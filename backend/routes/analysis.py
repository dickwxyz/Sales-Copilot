"""客户分析 API — 新建分析、追问、历史查询"""

import json
import uuid
import logging
import os
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models.analysis import AnalysisRecord, AnalysisRound
from models.material import SOPFile
from services.ai_service import analyze as ai_analyze
from utils.file_parser import extract_text, safe_filename

logger = logging.getLogger(__name__)

analysis_bp = Blueprint("analysis", __name__, url_prefix="/api/analysis")


def _save_upload(file_storage, upload_dir: str) -> str:
    """保存上传文件，返回保存路径"""
    os.makedirs(upload_dir, exist_ok=True)
    filename = safe_filename(file_storage.filename or "upload")
    save_path = os.path.join(upload_dir, f"{uuid.uuid4().hex}_{filename}")
    file_storage.save(save_path)
    return save_path


def _extract_customer_name(text: str, notes: str = "") -> str:
    """从聊天记录或备注中尝试提取客户姓名"""
    import re
    # 优先从聊天记录中提取: "客户: XXX" "家长: XXX"
    for line in text.split("\n"):
        m = re.search(r"(?:客户|家长|妈妈|爸爸)[：:]+\s*(\S{2,4})", line)
        if m:
            name = m.group(1).strip()
            # 排除常见非姓名的词语
            if name not in ("你好", "您好", "请问", "我家孩子", "宝宝", "你好，", "您好，"):
                return name
    # fallback: 从 "我叫xxx" "姓名xxx" 中提取
    name_match = re.search(r"我\s*叫\s*(\S{2,4})", text)
    if name_match:
        return name_match.group(1)
    return ""


def _get_user_sop_text(user_id: str) -> str:
    """获取用户的 SOP 文本汇总"""
    files = SOPFile.query.filter_by(user_id=user_id).all()
    texts = [f"【{f.filename}】\n{f.content}" for f in files if f.content]
    return "\n\n".join(texts)


def _get_chat_history(record: AnalysisRecord, current_round: int) -> str:
    """获取指定轮次之前的所有聊天记录"""
    parts = []
    for r in record.rounds:
        if r.round_number >= current_round:
            break
        if r.chat_files_text:
            parts.append(f"【第{r.round_number}轮聊天记录】\n{r.chat_files_text}")
    return "\n\n".join(parts)


# ── 新建分析 ──


@analysis_bp.route("", methods=["POST"])
@jwt_required()
def create_analysis():
    user_id = get_jwt_identity()

    customer_name = request.form.get("customer_name", "").strip()
    customer_phone = request.form.get("customer_phone", "").strip()
    notes = request.form.get("notes", "").strip()
    file = request.files.get("file")

    chat_text = ""
    if file and file.filename:
        save_path = _save_upload(file, current_app.config["UPLOAD_FOLDER"])
        chat_text = extract_text(save_path)
        # 清理临时文件
        try:
            os.remove(save_path)
        except OSError:
            pass

    # AI 分析
    sop_text = _get_user_sop_text(user_id)
    result = ai_analyze(user_input=notes, chat_text=chat_text, sop_text=sop_text)

    # 自动提取客户姓名
    if not customer_name:
        customer_name = _extract_customer_name(chat_text, notes)

    # 创建记录
    record_id = str(uuid.uuid4())
    record = AnalysisRecord(
        id=record_id,
        user_id=user_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        notes=notes,
        current_stage=result.get("stage", ""),
        stage_reason=result.get("stage_reason", ""),
        customer_profile=json.dumps(result.get("profile", {}), ensure_ascii=False),
        completeness=json.dumps(result.get("completeness", {}), ensure_ascii=False),
        strategy=json.dumps(
            {
                "advice": result.get("advice", ""),
                "pitfall": result.get("pitfall", ""),
                "question": result.get("question", ""),
            },
            ensure_ascii=False,
        ),
        scripts=json.dumps(result.get("scripts", {}), ensure_ascii=False),
        stage_history=json.dumps(
            [
                {
                    "stage": result.get("stage", ""),
                    "reason": result.get("stage_reason", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ],
            ensure_ascii=False,
        ),
    )
    db.session.add(record)

    round_obj = AnalysisRound(
        id=str(uuid.uuid4()),
        record_id=record_id,
        round_number=1,
        user_input=notes,
        chat_files_text=chat_text,
        stage=result.get("stage", ""),
        stage_reason=result.get("stage_reason", ""),
        customer_profile=json.dumps(result.get("profile", {}), ensure_ascii=False),
        completeness=json.dumps(result.get("completeness", {}), ensure_ascii=False),
        strategy=json.dumps(
            {
                "advice": result.get("advice", ""),
                "pitfall": result.get("pitfall", ""),
                "question": result.get("question", ""),
            },
            ensure_ascii=False,
        ),
        scripts=json.dumps(result.get("scripts", {}), ensure_ascii=False),
        injection_warning=result.get("injection_warning", False),
        injection_detail=result.get("injection_detail", ""),
        raw_response=result.get("raw_response", ""),
    )
    db.session.add(round_obj)
    db.session.commit()

    return jsonify({"record": record.to_dict()}), 201


# ── 历史记录列表 ──


@analysis_bp.route("", methods=["GET"])
@jwt_required()
def list_analysis():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)

    query = AnalysisRecord.query.filter_by(user_id=user_id).order_by(
        AnalysisRecord.updated_at.desc()
    )
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "records": [r.to_dict() for r in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
            "per_page": per_page,
        }
    )


# ── 单条详情 ──


@analysis_bp.route("/<record_id>", methods=["GET"])
@jwt_required()
def get_analysis(record_id):
    user_id = get_jwt_identity()
    record = AnalysisRecord.query.filter_by(id=record_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "记录不存在"}), 404
    return jsonify({"record": record.to_dict()})


# ── 追问 ──


@analysis_bp.route("/<record_id>/followup", methods=["POST"])
@jwt_required()
def followup_analysis(record_id):
    user_id = get_jwt_identity()
    record = AnalysisRecord.query.filter_by(id=record_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "记录不存在"}), 404

    user_input = request.form.get("user_input", "").strip()
    file = request.files.get("file")

    chat_text = ""
    if file and file.filename:
        save_path = _save_upload(file, current_app.config["UPLOAD_FOLDER"])
        chat_text = extract_text(save_path)
        try:
            os.remove(save_path)
        except OSError:
            pass

    if not user_input and not chat_text:
        return jsonify({"error": "请填写追问内容或上传聊天记录"}), 400

    # 准备上一轮分析结果
    last_round = record.rounds.order_by(AnalysisRound.round_number.desc()).first()
    previous_analysis = {}
    if last_round:
        previous_analysis = {
            "stage": last_round.stage,
            "profile": AnalysisRecord._load_json(last_round.customer_profile),
            "completeness": AnalysisRecord._load_json(last_round.completeness),
            "advice": AnalysisRecord._load_json(last_round.strategy, {}).get("advice", ""),
        }

    # 聊天记录上下文
    chat_history = _get_chat_history(record, record.rounds.count() + 1)

    # AI 分析
    sop_text = _get_user_sop_text(user_id)
    result = ai_analyze(
        user_input=user_input,
        chat_text=chat_text,
        sop_text=sop_text,
        chat_history=chat_history,
        previous_analysis=previous_analysis,
        is_followup=True,
    )

    # 阶段变更检测
    stage_history = AnalysisRecord._load_json(record.stage_history, [])
    prev_stage = stage_history[-1]["stage"] if stage_history else ""
    new_stage = result.get("stage", "")
    if new_stage and new_stage != prev_stage:
        stage_history.append(
            {
                "stage": new_stage,
                "reason": result.get("stage_reason", ""),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    # 创建新轮次
    next_round = (record.rounds.count() or 0) + 1
    round_obj = AnalysisRound(
        id=str(uuid.uuid4()),
        record_id=record_id,
        round_number=next_round,
        user_input=user_input,
        chat_files_text=chat_text,
        stage=result.get("stage", ""),
        stage_reason=result.get("stage_reason", ""),
        customer_profile=json.dumps(result.get("profile", {}), ensure_ascii=False),
        completeness=json.dumps(result.get("completeness", {}), ensure_ascii=False),
        strategy=json.dumps(
            {
                "advice": result.get("advice", ""),
                "pitfall": result.get("pitfall", ""),
                "question": result.get("question", ""),
            },
            ensure_ascii=False,
        ),
        scripts=json.dumps(result.get("scripts", {}), ensure_ascii=False),
        injection_warning=result.get("injection_warning", False),
        injection_detail=result.get("injection_detail", ""),
        raw_response=result.get("raw_response", ""),
    )
    db.session.add(round_obj)

    # 更新主记录
    record.current_stage = new_stage
    record.stage_reason = result.get("stage_reason", "")
    record.customer_profile = json.dumps(result.get("profile", {}), ensure_ascii=False)
    record.completeness = json.dumps(result.get("completeness", {}), ensure_ascii=False)
    record.strategy = json.dumps(
        {
            "advice": result.get("advice", ""),
            "pitfall": result.get("pitfall", ""),
            "question": result.get("question", ""),
        },
        ensure_ascii=False,
    )
    record.scripts = json.dumps(result.get("scripts", {}), ensure_ascii=False)
    record.stage_history = json.dumps(stage_history, ensure_ascii=False)
    record.updated_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({"record": record.to_dict(), "new_round": round_obj.to_dict()})
