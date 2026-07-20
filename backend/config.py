import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///sales_copilot.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

    # Prompt paths
    KNOWLEDGEBASE_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "prompts", "knowledgebase.txt"
    )
    SYSTEM_PROMPT_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "prompts", "system.txt"
    )
    FEWSHOT_PATH = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "prompts", "fewshot.py"
    )
