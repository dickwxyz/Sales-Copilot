import uuid
from datetime import datetime, timezone

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = db.Column(db.String(20), unique=True, nullable=False, index=True)
    nickname = db.Column(db.String(80), default="")
    password_hash = db.Column(db.String(256), nullable=False)
    company = db.Column(db.String(120), default="")
    role = db.Column(db.String(20), default="sales")  # sales / admin
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "phone": self.phone,
            "nickname": self.nickname,
            "company": self.company,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
