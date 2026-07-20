"""素材管理 API — 上传/列出/删除 SOP 和聊天记录"""

import uuid
import os
import logging

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models.material import SOPFile, ChatRecordFile
from utils.file_parser import extract_text, safe_filename

logger = logging.getLogger(__name__)

materials_bp = Blueprint("materials", __name__, url_prefix="/api/materials")


def _handle_upload(
    model_class, user_id: str, file, upload_dir: str
):
    """通用文件上传处理"""
    if not file or not file.filename:
        return {"error": "请选择文件"}, 400

    ext = os.path.splitext(file.filename)[1].lower()
    supported = (".txt", ".pdf", ".doc", ".docx", ".csv", ".md")
    if ext not in supported:
        return {"error": f"不支持的文件类型: {ext}，支持: {', '.join(supported)}"}, 400

    os.makedirs(upload_dir, exist_ok=True)
    save_name = f"{uuid.uuid4().hex}_{safe_filename(file.filename)}"
    save_path = os.path.join(upload_dir, save_name)
    file.save(save_path)

    content = extract_text(save_path)
    file_size = os.path.getsize(save_path)

    try:
        os.remove(save_path)
    except OSError:
        pass

    obj = model_class(
        id=str(uuid.uuid4()),
        user_id=user_id,
        filename=file.filename,
        content=content,
        file_type=ext.lstrip("."),
        file_size=file_size,
    )
    db.session.add(obj)
    db.session.commit()

    return {"file": obj.to_dict()}, 201


# ── SOP 文件 ──


@materials_bp.route("/sop", methods=["POST"])
@jwt_required()
def upload_sop():
    user_id = get_jwt_identity()
    file = request.files.get("file")
    return _handle_upload(SOPFile, user_id, file, current_app.config["UPLOAD_FOLDER"])


@materials_bp.route("/sop", methods=["GET"])
@jwt_required()
def list_sop():
    user_id = get_jwt_identity()
    files = (
        SOPFile.query.filter_by(user_id=user_id)
        .order_by(SOPFile.created_at.desc())
        .all()
    )
    return jsonify({"files": [f.to_dict() for f in files]})


@materials_bp.route("/sop/<file_id>", methods=["DELETE"])
@jwt_required()
def delete_sop(file_id):
    user_id = get_jwt_identity()
    sop = SOPFile.query.filter_by(id=file_id, user_id=user_id).first()
    if not sop:
        return jsonify({"error": "文件不存在"}), 404
    db.session.delete(sop)
    db.session.commit()
    return jsonify({"message": "已删除"})


# ── 聊天记录文件 ──


@materials_bp.route("/chat", methods=["POST"])
@jwt_required()
def upload_chat():
    user_id = get_jwt_identity()
    file = request.files.get("file")
    return _handle_upload(ChatRecordFile, user_id, file, current_app.config["UPLOAD_FOLDER"])


@materials_bp.route("/chat", methods=["GET"])
@jwt_required()
def list_chat():
    user_id = get_jwt_identity()
    files = (
        ChatRecordFile.query.filter_by(user_id=user_id)
        .order_by(ChatRecordFile.created_at.desc())
        .all()
    )
    return jsonify({"files": [f.to_dict() for f in files]})
