"""用户注册/登录 API — 手机号注册登录"""

import uuid
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from app import db
from models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    phone = (data.get("phone") or "").strip()
    password = data.get("password", "")
    nickname = (data.get("nickname") or "").strip()

    if not phone or not password:
        return jsonify({"error": "手机号和密码不能为空"}), 400
    if len(password) < 6:
        return jsonify({"error": "密码至少6位"}), 400

    if User.query.filter_by(phone=phone).first():
        return jsonify({"error": "该手机号已注册"}), 409

    user = User(
        id=str(uuid.uuid4()),
        phone=phone,
        nickname=nickname or "",
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({"user": user.to_dict(), "token": token}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    phone = (data.get("phone") or "").strip()
    password = data.get("password", "")

    if not phone:
        return jsonify({"error": "请输入手机号"}), 400

    user = User.query.filter_by(phone=phone).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "手机号或密码错误"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({"user": user.to_dict(), "token": token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "用户不存在"}), 404
    return jsonify({"user": user.to_dict()})
