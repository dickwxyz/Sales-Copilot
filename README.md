# AI销冠助手

**让每个销售，都拥有销冠的成交力。**

教培销售助手是一套面向教育培训行业的销售智能辅助系统，帮助课程顾问在日常跟进客户时快速判断客户当前的心理状态，并给出有针对性的沟通策略。

传统的教培销售工作中，课程顾问每日要跟进大量客户，面对千差万别的回复需求，往往只能凭个人经验"猜客户心思"。经验丰富的销冠能快速判断客户所处阶段并调整话术，但普通销售容易陷入套用统一话术的低效模式，导致大量需求模糊的 B 类客户被误判流失。

本系统将经过多年市场验证的教培销售方法论（客户决策心理四阶段模型、SPIN 销售法则、竞品差异化策略）编译为知识库，通过 DeepSeek API 一次性完成客户心理阶段判定、画像提取、信息完整性评估、策略建议生成和三套话术（专业型/亲和型/高效型）的生成。同时内置 Python 规则引擎作为 DeepSeek 不可用时的兜底方案。系统搭载关键字注入防护模块，最大限度降低提示泄露风险。

---

## 产品特色

- **客户阶段识别** — 基于客户心理四阶段模型，AI 自动判定客户当前所处的决策阶段
- **客户画像提取** — 从聊天记录中智能提取年龄段、决策角色、需求类型、核心痛点等信息
- **信息完整性评估** — 自动发现缺失的关键信息，指引销售补充沟通方向
- **AI 话术建议** — 为每轮对话生成专业型、亲和型、高效型三套话术
- **多轮追问分析** — 支持追加聊天记录进行多轮对话，追踪客户状态变化
- **三维度评价体系** — 评委可对分析结果的准确度、可用性、洞察力进行评分
- **安全防护** — 内置 prompt 注入检测，保障系统安全运行

## 系统架构

```
┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   React SPA   │────▶│  Flask API  │────▶│ DeepSeek │
│  (Vite build) │     │  (RESTful)  │     │   LLM    │
└──────────────┘     └──────┬──────┘     └──────────┘
                            │
                     ┌──────┴──────┐
                     │  SQLite DB  │
                     └─────────────┘
```

## 核心设计原则

1. **轻量化** — 前后端分离，SQLite 零配置数据库，开箱即用
2. **AI 优先，人工兜底** — AI 自动提取分析，用户信息作补充和校验
3. **结构化输出** — 所有分析结果统一为 JSON 结构化格式，便于前端消费
4. **安全纵深** — JWT 鉴权 + prompt 注入检测 + 敏感词拦截
5. **可评价** — 三维度评价体系，持续追踪 AI 分析质量

## 客户心理阶段模型

| 阶段 | 颜色 | 描述 |
|------|------|------|
| 认知期 | 蓝色 | 客户刚开始了解产品，关注基础信息。销售应建立信任、提供基础信息 |
| 需求期 | 靛色 | 客户明确需求，评估方案。销售应深入挖掘需求、展示针对性方案 |
| 对比期 | 琥珀色 | 客户在多选择之间对比。销售应突出差异化优势、提供案例背书 |
| 决策期 | 绿色 | 客户基本决定，进入成交阶段。销售应消除最后顾虑、促成成交 |
| 安全拦截 | 红色 | 检测到 prompt 注入等安全风险，系统自动拦截 |

## 技术栈

### 前端
- **框架**: React 19 + React Router 7
- **构建**: Vite 8
- **样式**: Tailwind CSS 4
- **图标**: Lucide React
- **HTTP**: Axios

### 后端
- **框架**: Flask 3
- **ORM**: SQLAlchemy + SQLite
- **鉴权**: Flask-JWT-Extended
- **LLM**: DeepSeek API (兼容 OpenAI SDK)
- **文件解析**: python-docx, PyPDF2, python-csv

### 部署
- **前端**: Vite build → Nginx 静态托管
- **后端**: Flask (Gunicorn + Nginx 反向代理)
- **数据库**: SQLite（可切换 PostgreSQL）

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+

### 1. 克隆并安装依赖

```bash
git clone https://github.com/your-org/sales-copilot.git
cd sales-copilot

# 后端
cd backend
pip install -r requirements.txt

# 前端
cd ../frontend
npm install
```

### 2. 配置环境变量

```bash
cp backend/.env.example backend/.env
```

编辑 `.env` 填写 DeepSeek API Key:

```
DEEPSEEK_API_KEY=sk-your-api-key-here
```

### 3. 启动服务

```bash
# 终端 1: 启动后端 (默认 5001 端口)
cd backend
python run.py

# 终端 2: 启动前端开发服务器 (默认 5173 端口)
cd frontend
npm run dev
```

访问 http://localhost:5173

### 4. 注册并使用

1. 打开首页，点击注册
2. 使用 4 位以上密码注册账号
3. 从「指南」页面下载示例聊天记录
4. 进入「分析」页面，上传文件开始测试

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/analysis` | 新建分析（文件上传） |
| GET | `/api/analysis` | 历史记录列表（分页+搜索） |
| GET | `/api/analysis/:id` | 单条分析详情 |
| POST | `/api/analysis/:id/followup` | 追问 |
| POST | `/api/evaluations` | 提交评价 |
| GET | `/api/evaluations/stats` | 评价统计 |
| POST | `/api/materials/sop` | 上传 SOP 文件 |
| GET | `/api/materials/sop` | SOP 文件列表 |
| GET | `/api/uploads/:filename` | 示例文件下载 |

## 目录结构

```
sales-copilot/
├── frontend/                   # React 前端
│   └── src/
│       ├── api/                # API 请求封装
│       ├── components/         # 通用组件 (Layout, InjectionWarning)
│       └── pages/
│           ├── Home.jsx        # 首页
│           ├── Login.jsx       # 登录
│           ├── Register.jsx    # 注册
│           ├── Analysis.jsx    # 新建分析
│           ├── AnalysisResult.jsx # 分析详情/结果
│           ├── History.jsx     # 历史记录
│           └── Guide.jsx       # 使用指南
├── backend/
│   ├── app.py                  # Flask 应用工厂
│   ├── config.py               # 配置
│   ├── run.py                  # 启动入口
│   ├── routes/                 # API 路由
│   │   ├── auth.py             # 认证
│   │   ├── analysis.py         # 分析 CRUD
│   │   ├── evaluations.py      # 评价
│   │   └── materials.py        # 素材管理
│   ├── models/                 # 数据模型
│   │   ├── user.py
│   │   ├── analysis.py
│   │   └── material.py
│   ├── services/               # 业务服务
│   │   ├── ai_service.py       # DeepSeek API 调用
│   │   └── rule_engine.py      # (预留) 规则引擎兜底
│   ├── prompts/                # AI prompt 模板
│   │   ├── system.txt          # 系统提示词
│   │   ├── knowledgebase.txt   # 知识库/领域知识
│   │   └── fewshot.py          # few-shot 示例
│   └── uploads/                # 示例聊天记录文件
└── README.md
```

## 部署结构

推荐使用 Docker Compose 部署:

```
frontend/   → Vite build → Nginx 容器 (静态文件 + API 反向代理)
backend/    → Flask/Gunicorn → WSGI 容器
SQLite      → 挂载卷持久化
```

Nginx 配置要点:
- `/` 路由 → 托管前端 dist 目录
- `/api/` 路由 → 反向代理到后端 5001 端口
- `/api/uploads/` → 代理到后端文件下载路由

## 开发背景

本项目为 「她来创造」Coding Lady 2026年度参赛作品。
