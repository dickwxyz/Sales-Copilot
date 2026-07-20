"""
DeepSeek API 调用与分析服务。

核心原则：一次 API 调用完成全部分析（心理阶段、画像、完整性、策略、话术），
追问也走完整分析流程，更新而非追加。
"""

import json
import logging
from typing import Optional
from openai import OpenAI

from config import Config
from utils.security import check_injection, SAFE_REPLY
from prompts.fewshot import get_few_shot_block

logger = logging.getLogger(__name__)

# ---------- 输出断言（用于校验 AI 返回值） ----------

REQUIRED_FIELDS = {
    "stage": str,
    "stage_reason": str,
    "profile": dict,
    "completeness": dict,
    "advice": str,
    "pitfall": str,
    "question": str,
    "scripts": dict,
}

PROFILE_FIELDS = {
    "age_group": str,
    "decision_maker": str,
    "edu_type": str,
    "subject": str,
    "demand_clarity": str,
    "core_pain": str,
}

COMPLETENESS_FIELDS = {
    "score": (int, float),
    "gaps": list,
}

SCRIPTS_FIELDS = {
    "professional": str,
    "affinity": str,
    "efficient": str,
}

AGE_GROUP_VALUES = {"0-3", "4-6", "7-12", "13-18", "其他", "未提供"}
DECISION_MAKER_VALUES = {"妈妈", "爸爸", "其他", "未提供"}
EDU_TYPE_VALUES = {"素质", "学科", "未提供"}
DEMAND_CLARITY_VALUES = {"明确", "模糊", "未提供"}
STAGE_VALUES = {"认知期", "需求期", "对比期", "决策期", "安全拦截"}


def _validate_output(data: dict) -> list[str]:
    """校验 AI 输出完整性，返回缺失/错误的字段列表"""
    errors = []

    for field, ftype in REQUIRED_FIELDS.items():
        if field not in data:
            errors.append(f"缺少字段: {field}")
            continue
        if not isinstance(data[field], ftype):
            errors.append(f"字段类型错误: {field} 期望 {ftype.__name__}")

    if "profile" in data and isinstance(data["profile"], dict):
        for field, ftype in PROFILE_FIELDS.items():
            if field not in data["profile"]:
                errors.append(f"profile 缺少字段: {field}")
            elif not isinstance(data["profile"][field], ftype):
                errors.append(f"profile.{field} 类型错误")

        stage = data["profile"].get("age_group", "")
        if stage and stage not in AGE_GROUP_VALUES:
            errors.append(f"profile.age_group 值无效: {stage}")
        dm = data["profile"].get("decision_maker", "")
        if dm and dm not in DECISION_MAKER_VALUES:
            errors.append(f"profile.decision_maker 值无效: {dm}")
        et = data["profile"].get("edu_type", "")
        if et and et not in EDU_TYPE_VALUES:
            errors.append(f"profile.edu_type 值无效: {et}")
        dc = data["profile"].get("demand_clarity", "")
        if dc and dc not in DEMAND_CLARITY_VALUES:
            errors.append(f"profile.demand_clarity 值无效: {dc}")

    if "completeness" in data and isinstance(data["completeness"], dict):
        for field in ("score", "gaps"):
            if field not in data["completeness"]:
                errors.append(f"completeness 缺少字段: {field}")
        score = data["completeness"].get("score")
        if score is not None and not isinstance(score, (int, float)):
            errors.append("completeness.score 必须为数字")

    if "scripts" in data and isinstance(data["scripts"], dict):
        for field in ("professional", "affinity", "efficient"):
            if field not in data["scripts"]:
                errors.append(f"scripts 缺少字段: {field}")

    stage = data.get("stage", "")
    if stage and stage not in STAGE_VALUES:
        errors.append(f"stage 值无效: {stage}")

    return errors


# ---------- Prompt 组装 ----------

def _load_text(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.warning("读取文件失败 %s: %s", path, e)
        return ""


def build_analysis_prompt(
    user_input: str = "",
    chat_text: str = "",
    sop_text: str = "",
    chat_history: str = "",
    previous_analysis: Optional[dict] = None,
    is_followup: bool = False,
) -> str:
    """
    组装完整分析 Prompt。

    优先级：system prompt > 知识库 > 少样本示例 > 用户素材(SOP > 聊天记录 > 其他)

    Args:
        user_input: 销售填写的本轮输入
        chat_text: 本轮上传的聊天记录文本
        sop_text: 用户上传的企业 SOP
        chat_history: 历史聊天记录上下文
        previous_analysis: 上一轮完整分析结果（追问时使用）
        is_followup: 是否为追问轮次

    Returns:
        完整 prompt 字符串
    """
    # 1. system prompt
    system_prompt = _load_text(Config.SYSTEM_PROMPT_PATH)
    if not system_prompt:
        system_prompt = "你是一位资深的教培行业销售分析专家。"

    # 2. 知识库
    knowledgebase = _load_text(Config.KNOWLEDGEBASE_PATH)
    kb_block = (
        f"\n【参考知识库】\n{knowledgebase}\n"
        if knowledgebase
        else ""
    )

    # 3. 少样本示例
    few_shot_block = get_few_shot_block()

    # 4. 用户素材（按优先级）
    material_parts = []

    if sop_text:
        material_parts.append(f"【企业 SOP / 工作流】\n{sop_text}")

    if chat_history:
        material_parts.append(f"【历史聊天记录】\n{chat_history}")

    if chat_text:
        material_parts.append(f"【本轮聊天记录】\n{chat_text}")

    material_block = "\n\n".join(material_parts)

    # 5. 追问上下文
    followup_block = ""
    if is_followup and previous_analysis:
        followup_block = (
            "\n【上一轮分析结果（追问参考）】\n"
            f"上一轮客户阶段: {previous_analysis.get('stage', '未知')}\n"
            f"上一轮画像: {json.dumps(previous_analysis.get('profile', {}), ensure_ascii=False)}\n"
            f"上一轮完整性评分: {previous_analysis.get('completeness', {}).get('score', 0)}\n"
            f"上一轮建议: {previous_analysis.get('advice', '')}\n"
            "\n注意: 本轮请基于全部可用信息重新分析，不要简单复制上一轮结果。"
            "如果本轮新信息导致阶段变化，请在 stage_reason 中说明变化原因和依据。\n"
        )

    # 6. 组装完整 prompt
    parts = [
        system_prompt,
        "",
        "=== 输入数据 ===",
        f"【用户输入】\n{user_input}" if user_input else "",
        "",
        material_block if material_block else "",
        "",
        kb_block,
        "",
        few_shot_block,
        "",
        followup_block,
        "",
        "【输出要求】",
        "请直接输出一个合法 JSON 对象（不要包含 markdown 代码块标记），包含以下字段：",
        "  - stage: string — 认知期/需求期/对比期/决策期",
        "  - stage_reason: string — 判定依据",
        "  - profile: object — 客户画像（含 age_group, decision_maker, edu_type, subject, demand_clarity, core_pain）",
        "  - completeness: object — 信息完整性（score 0-100, gaps 缺失信息列表）",
        "  - advice: string — 策略建议（100字以内）",
        "  - pitfall: string — 避坑提示（80字以内）",
        "  - question: string — 给销售的追问建议（80字以内）",
        "  - scripts: object — 三套话术（professional, affinity, efficient 各60-120字）",
    ]

    return "\n".join(filter(None, parts))


# ---------- API 调用 ----------

def call_deepseek(
    prompt: str,
    model: str = "",
    max_tokens: int = 8192,
    temperature: float = 0.7,
) -> Optional[str]:
    """
    调用 DeepSeek API。

    Args:
        prompt: 完整 prompt
        model: 模型名称，默认使用 Config.DEEPSEEK_MODEL
        max_tokens: 最大输出 token
        temperature: 生成温度

    Returns:
        API 响应文本，失败返回 None
    """
    api_key = Config.DEEPSEEK_API_KEY
    if not api_key:
        logger.error("DEEPSEEK_API_KEY 未配置")
        return None

    model = model or Config.DEEPSEEK_MODEL
    base_url = Config.DEEPSEEK_BASE_URL

    try:
        client = OpenAI(api_key=api_key, base_url=base_url)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error("DeepSeek API 调用失败: %s", e)
        return None


# ---------- 主分析函数 ----------

def analyze(
    user_input: str = "",
    chat_text: str = "",
    sop_text: str = "",
    chat_history: str = "",
    previous_analysis: Optional[dict] = None,
    is_followup: bool = False,
) -> dict:
    """
    执行完整分析。

    流程：
    1. 注入检测 → 命中直接返回 SAFE_REPLY
    2. 组装 Prompt
    3. 调用 DeepSeek API
    4. 解析 JSON + 校验
    5. 校验失败 → 降级为规则引擎（待实现）

    Args:
        参数同 build_analysis_prompt()

    Returns:
        完整分析结果 dict
    """
    # 1. 注入检测
    combined_input = f"{user_input}\n{chat_text}"
    is_attack, matched = check_injection(combined_input)
    if is_attack:
        logger.warning("注入检测命中: %s", matched)
        result = dict(SAFE_REPLY)  # 拷贝
        result["injection_warning"] = True
        result["injection_detail"] = "; ".join(matched)
        return result

    # 2. 组装 Prompt
    prompt = build_analysis_prompt(
        user_input=user_input,
        chat_text=chat_text,
        sop_text=sop_text,
        chat_history=chat_history,
        previous_analysis=previous_analysis,
        is_followup=is_followup,
    )

    # 3. 调用 DeepSeek
    raw = call_deepseek(prompt)

    if raw is None:
        logger.warning("DeepSeek API 不可用，返回降级结果")
        return _fallback_result("DeepSeek API 调用失败，规则引擎尚未实现")

    # 4. 解析 JSON
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error("JSON 解析失败: %s", e)
        return _fallback_result(f"AI 输出解析失败: {e}")

    # 5. 校验
    errors = _validate_output(parsed)
    if errors:
        logger.warning("输出校验不通过: %s", errors)

    # 补充缺失字段
    _fill_defaults(parsed)

    result = {
        "injection_warning": False,
        "injection_detail": "",
        "raw_response": raw,
        "validation_errors": errors,
        **parsed,
    }

    return result


def _fill_defaults(data: dict):
    """补充缺失的字段"""
    for field, default in [
        ("stage", "认知期"),
        ("stage_reason", ""),
        ("advice", ""),
        ("pitfall", ""),
        ("question", ""),
    ]:
        if field not in data:
            data[field] = default

    if "profile" not in data or not isinstance(data["profile"], dict):
        data["profile"] = {}
    for field, default in [
        ("age_group", "未提供"),
        ("decision_maker", "未提供"),
        ("edu_type", "未提供"),
        ("subject", "未提供"),
        ("demand_clarity", "未提供"),
        ("core_pain", ""),
    ]:
        if field not in data["profile"]:
            data["profile"][field] = default

    if "completeness" not in data or not isinstance(data["completeness"], dict):
        data["completeness"] = {}
    for field, default in [("score", 0), ("gaps", [])]:
        if field not in data["completeness"]:
            data["completeness"][field] = default

    if "scripts" not in data or not isinstance(data["scripts"], dict):
        data["scripts"] = {}
    for field, default in [
        ("professional", ""),
        ("affinity", ""),
        ("efficient", ""),
    ]:
        if field not in data["scripts"]:
            data["scripts"][field] = default


def _fallback_result(reason: str) -> dict:
    """返回降级结果"""
    return {
        "injection_warning": False,
        "injection_detail": "",
        "raw_response": "",
        "validation_errors": [reason],
        "stage": "认知期",
        "stage_reason": f"系统降级: {reason}",
        "profile": {
            "age_group": "未提供",
            "decision_maker": "未提供",
            "edu_type": "未提供",
            "subject": "未提供",
            "demand_clarity": "未提供",
            "core_pain": "",
        },
        "completeness": {"score": 0, "gaps": []},
        "advice": "AI 服务不可用，建议手动跟进。",
        "pitfall": "",
        "question": "请稍后再试或联系管理员检查 AI 服务状态。",
        "scripts": {
            "professional": "抱歉，AI 分析服务暂时不可用，稍后将为您重新生成话术。",
            "affinity": "AI 服务暂时无法使用，请您稍后再试。",
            "efficient": "系统暂时无法完成分析，请联系管理员。",
        },
    }
