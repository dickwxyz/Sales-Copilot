from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()


def create_app(config_name: str = "config.Config") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_name)

    CORS(app)
    db.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        from models.user import User  # noqa: F401

        db.create_all()

    return app
