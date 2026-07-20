from app import db


class AnalysisRecord(db.Model):
    """分析主记录"""
    __tablename__ = "analysis_records"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    customer_name = db.Column(db.String(80), default="")  # 从聊天记录智能提取
    customer_phone = db.Column(db.String(20), default="")
    notes = db.Column(db.Text, default="")  # 销售员备注/基础信息

    # 最新分析结果（每次追问后更新）
    current_stage = db.Column(db.String(20), default="")  # 认知期/需求期/对比期/决策期
    stage_reason = db.Column(db.Text, default="")  # 阶段判定依据
    customer_profile = db.Column(db.Text, default="")  # JSON: 客户画像
    completeness = db.Column(db.Text, default="")  # JSON: 信息完整性评估
    strategy = db.Column(db.Text, default="")  # JSON: 策略建议
    scripts = db.Column(db.Text, default="")  # JSON: 三套话术

    # 阶段变更历史
    stage_history = db.Column(db.Text, default="[]")  # JSON: [{stage, reason, timestamp}]

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    user = db.relationship("User", backref=db.backref("analysis_records", lazy="dynamic"))
    rounds = db.relationship("AnalysisRound", backref="record", lazy="dynamic",
                             order_by="AnalysisRound.round_number")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "notes": self.notes,
            "current_stage": self.current_stage,
            "customer_profile": self._load_json(self.customer_profile),
            "completeness": self._load_json(self.completeness),
            "strategy": self._load_json(self.strategy),
            "scripts": self._load_json(self.scripts),
            "stage_history": self._load_json(self.stage_history, []),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "rounds": [r.to_dict() for r in self.rounds],
            "round_count": self.rounds.count(),
        }

    def to_list_dict(self) -> dict:
        """列表页轻量序列化，含 customer_profile 不含 rounds"""
        profile = self._load_json(self.customer_profile)
        notes_data = self._load_json(self.notes)
        return {
            "id": self.id,
            "customer_name": self.customer_name,
            "notes": self.notes,
            "current_stage": self.current_stage,
            "round_count": self.rounds.count(),
            "profile": {
                "age_group": profile.get("age_group", ""),
                "decision_maker": profile.get("decision_maker", ""),
                "edu_type": profile.get("edu_type", ""),
                "subject": profile.get("subject", ""),
            },
            "notes_parsed": {
                "ageGroup": notes_data.get("ageGroup", "") if isinstance(notes_data, dict) else "",
                "decisionMaker": notes_data.get("decisionMaker", "") if isinstance(notes_data, dict) else "",
                "trainingType": notes_data.get("trainingType", "") if isinstance(notes_data, dict) else "",
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @staticmethod
    def _load_json(val, default=None):
        import json
        if not val:
            return default or {}
        try:
            return json.loads(val)
        except (json.JSONDecodeError, TypeError):
            return default or {}


class AnalysisRound(db.Model):
    """每一轮分析（首次分析 + 每轮追问）"""
    __tablename__ = "analysis_rounds"

    id = db.Column(db.String(36), primary_key=True)
    record_id = db.Column(db.String(36), db.ForeignKey("analysis_records.id"), nullable=False)
    round_number = db.Column(db.Integer, nullable=False)  # 1 = 首次分析，2+ = 追问

    # 用户输入
    user_input = db.Column(db.Text, default="")  # 本轮填写的文本/追问内容
    chat_files_text = db.Column(db.Text, default="")  # 本轮上传的聊天记录文本

    # AI 完整分析结果
    stage = db.Column(db.String(20), default="")
    stage_reason = db.Column(db.Text, default="")
    customer_profile = db.Column(db.Text, default="")  # JSON
    completeness = db.Column(db.Text, default="")  # JSON
    strategy = db.Column(db.Text, default="")  # JSON
    scripts = db.Column(db.Text, default="")  # JSON

    # 注入告警
    injection_warning = db.Column(db.Boolean, default=False)
    injection_detail = db.Column(db.Text, default="")

    # AI 原始响应（调试用）
    raw_response = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    evaluations = db.relationship("RoundEvaluation", backref="round", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "round_number": self.round_number,
            "user_input": self.user_input,
            "stage": self.stage,
            "stage_reason": self.stage_reason,
            "customer_profile": AnalysisRecord._load_json(self.customer_profile),
            "completeness": AnalysisRecord._load_json(self.completeness),
            "strategy": AnalysisRecord._load_json(self.strategy),
            "scripts": AnalysisRecord._load_json(self.scripts),
            "injection_warning": self.injection_warning,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "evaluations": [e.to_dict() for e in self.evaluations],
        }


class RoundEvaluation(db.Model):
    """每轮的三维度评价"""
    __tablename__ = "round_evaluations"

    id = db.Column(db.String(36), primary_key=True)
    round_id = db.Column(db.String(36), db.ForeignKey("analysis_rounds.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    # 三维度评分（1=低, 2=中, 3=高）
    accuracy = db.Column(db.Integer, default=0)      # 不准确 / 基本准确 / 非常准确
    usability = db.Column(db.Integer, default=0)      # 无法使用 / 参考使用 / 可直接用
    insight = db.Column(db.Integer, default=0)        # 较浅 / 有一些洞察 / 很有深度

    # 评价备注
    comment = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", backref=db.backref("evaluations", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "accuracy": self.accuracy,
            "usability": self.usability,
            "insight": self.insight,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
