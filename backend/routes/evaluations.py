"""评价 API — 三维度评价（准确度/可用性/洞察力）+ 统计概览"""

import uuid
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models.analysis import AnalysisRound, RoundEvaluation

logger = logging.getLogger(__name__)

evaluations_bp = Blueprint("evaluations", __name__, url_prefix="/api/evaluations")


EVALUATION_LABELS = {
    "accuracy": {1: "不准确", 2: "基本准确", 3: "非常准确"},
    "usability": {1: "无法使用", 2: "参考使用", 3: "可直接用"},
    "insight": {1: "较浅", 2: "有一些洞察", 3: "很有深度"},
}


@evaluations_bp.route("", methods=["POST"])
@jwt_required()
def submit_evaluation():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    round_id = data.get("round_id", "")
    if not round_id:
        return jsonify({"error": "缺少 round_id"}), 400

    # 验证该轮次属于当前用户
    round_obj = AnalysisRound.query.get(round_id)
    if not round_obj:
        return jsonify({"error": "轮次不存在"}), 404

    # 通过 record 验证归属
    from models.analysis import AnalysisRecord
    record = AnalysisRecord.query.filter_by(
        id=round_obj.record_id, user_id=user_id
    ).first()
    if not record:
        return jsonify({"error": "无权评价该轮次"}), 403

    # 读取评分，默认 0
    accuracy = int(data.get("accuracy", 0))
    usability = int(data.get("usability", 0))
    insight = int(data.get("insight", 0))

    # 校验范围
    for val, name in [(accuracy, "accuracy"), (usability, "usability"), (insight, "insight")]:
        if val not in (0, 1, 2, 3):
            return jsonify({"error": f"{name} 取值范围为 1-3（0=未评分）"}), 400

    comment = (data.get("comment") or "").strip()

    # 删除该用户对该轮次的旧评价（覆盖更新）
    RoundEvaluation.query.filter_by(round_id=round_id, user_id=user_id).delete()

    evaluation = RoundEvaluation(
        id=str(uuid.uuid4()),
        round_id=round_id,
        user_id=user_id,
        accuracy=accuracy,
        usability=usability,
        insight=insight,
        comment=comment,
    )
    db.session.add(evaluation)
    db.session.commit()

    return jsonify({"evaluation": evaluation.to_dict()}), 201


@evaluations_bp.route("/stats", methods=["GET"])
@jwt_required()
def evaluation_stats():
    user_id = get_jwt_identity()
    user_evaluations = RoundEvaluation.query.filter_by(user_id=user_id).all()

    total = len(user_evaluations)
    if total == 0:
        return jsonify(
            {
                "total": 0,
                "accuracy": {"avg": 0, "distribution": {1: 0, 2: 0, 3: 0}},
                "usability": {"avg": 0, "distribution": {1: 0, 2: 0, 3: 0}},
                "insight": {"avg": 0, "distribution": {1: 0, 2: 0, 3: 0}},
                "comment_count": 0,
            }
        )

    stats = {}
    for dim in ("accuracy", "usability", "insight"):
        values = [getattr(e, dim) for e in user_evaluations if getattr(e, dim) > 0]
        distribution = {1: 0, 2: 0, 3: 0}
        for v in values:
            distribution[v] = distribution.get(v, 0) + 1
        stats[dim] = {
            "avg": round(sum(values) / len(values), 2) if values else 0,
            "distribution": distribution,
        }

    return jsonify(
        {
            "total": total,
            "comment_count": sum(1 for e in user_evaluations if e.comment),
            **stats,
        }
    )
