"""
话术风格少样本示例。

这些示例只展示话术风格的差异，不包含任何方法论信息。
DeepSeek 通过示例学会输出3种不同风格，而非通过显式规则。
"""

FEW_SHOT_EXAMPLES = [
    {
        "client_info": "初三数学偏科的妈妈，对比三家后想找提分快的方法",
        "stage": "对比期",
        "advice": "先诊断再给方案，主动提出免费学科诊断",
        "pitfall": "切忌直接推销或夸大承诺",
        "expected_scripts": {
            "professional": "家长您好，孩子具体是哪类题型丢分最多？是几何还是代数？我们先帮孩子做个免费的学科诊断，再针对性出方案，这样提分才更稳。",
            "affinity": "特别理解您现在的心情，初三关键期都想找最适合的。您先跟我说说孩子的学习情况，我们一起分析下问题出在哪，总能找到适合孩子的方法的。",
            "efficient": "初三时间确实紧，咱们别在选择上浪费太多时间。这周末刚好有个免费的学科诊断，老师会当面给您分析，您看周六上午方便带孩子过来吗？"
        }
    },
    {
        "client_info": "客户说别家更便宜，想再考虑考虑",
        "stage": "决策期",
        "advice": "拆解价值而非降价，对比班型时长和师资配置",
        "pitfall": "不要直接降价或催促成交",
        "expected_scripts": {
            "professional": "我理解您对价格的考虑。我们家单节看起来贵一些，但每节课90分钟，折合每分钟单价其实比一般机构还低。而且我们是小班教学，老师能关注到每个孩子。",
            "affinity": "价格确实是重要考虑因素。很多家长一开始也这么觉得，但上过一段时间后发现孩子进步明显，算下来每天才多花几块钱，效果完全不一样。",
            "efficient": "您方便来中心一趟吗？我带你实际看下课，再给您算笔明细账，您对比一下就清楚值不值了。"
        }
    },
    {
        "client_info": "3岁宝宝的妈妈，犹豫要不要上早教",
        "stage": "认知期",
        "advice": "科普早教价值，帮助认识到早期教育的重要性",
        "pitfall": "不要一上来就报价或推课程",
        "expected_scripts": {
            "professional": "妈妈您好，3岁是孩子大脑发育的黄金期，这个阶段的语言能力、社交能力和运动能力都在快速发展，科学的早期教育能极大地促进这些能力的发展。",
            "affinity": "特别理解您的犹豫，很多妈妈一开始都有这个顾虑。其实早教不是要让孩子学多少知识，而是培养他和其他小朋友相处的能力，为幼儿园做准备。",
            "efficient": "您现在方便带宝宝来中心体验一下吗？我们有免费的试听课，您亲自感受下孩子的反应再做决定，比听我说更有说服力。"
        }
    }
]


def get_few_shot_block() -> str:
    """将少样本示例组装成 Prompt 中的参考块"""
    lines = ["以下是一些话术风格的参考示例：\n"]
    for i, example in enumerate(FEW_SHOT_EXAMPLES, 1):
        lines.append(f"【示例{i}】")
        lines.append(f"客户：{example['client_info']}")
        lines.append(f"当前阶段：{example['stage']}")
        lines.append(f"策略：{example['advice']}")
        lines.append(f"话术：")
        for style, script in example["expected_scripts"].items():
            lines.append(f"  {style}: {script}")
        lines.append("")
    lines.append("请参考以上风格，根据实际客户信息生成3套针对性话术。")
    return "\n".join(lines)
