"""用户注册/登录 API"""

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
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password", "")
    company = (data.get("company") or "").strip()

    if not username or not email or not password:
        return jsonify({"error": "用户名、邮箱和密码不能为空"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "用户名已存在"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "邮箱已被注册"}), 409

    user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        company=company,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return jsonify({"user": user.to_dict(), "token": token}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    account = (data.get("account") or "").strip()
    password = data.get("password", "")

    if not account:
        return jsonify({"error": "请输入用户名或邮箱"}), 400

    user = User.query.filter(
        (User.username == account) | (User.email == account)
    ).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "账号或密码错误"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({"user": user.to_dict(), "token": token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "用户不存在"}), 404
    return jsonify({"user": user.to_dict()})
