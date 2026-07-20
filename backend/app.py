import os
from flask import Flask, send_from_directory
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
        from models.analysis import AnalysisRecord, AnalysisRound, RoundEvaluation  # noqa: F401
        from models.material import SOPFile, ChatRecordFile  # noqa: F401

        db.create_all()

    # 注册路由
    from routes.auth import auth_bp
    from routes.analysis import analysis_bp
    from routes.materials import materials_bp
    from routes.evaluations import evaluations_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(materials_bp)
    app.register_blueprint(evaluations_bp)

    # 上传文件静态访问
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")

    @app.route("/api/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(upload_dir, filename)

    return app
