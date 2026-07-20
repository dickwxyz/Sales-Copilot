from app import db


class SOPFile(db.Model):
    """用户上传的企业 SOP / 工作流文件"""
    __tablename__ = "sop_files"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    content = db.Column(db.Text, default="")  # 提取的文本内容
    file_type = db.Column(db.String(20), default="")  # txt / pdf / docx / csv / md
    file_size = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", backref=db.backref("sop_files", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ChatRecordFile(db.Model):
    """用户上传的聊天记录文件"""
    __tablename__ = "chat_record_files"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    filename = db.Column(db.String(256), nullable=False)
    content = db.Column(db.Text, default="")  # 提取的文本内容
    file_type = db.Column(db.String(20), default="")
    file_size = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", backref=db.backref("chat_records", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
