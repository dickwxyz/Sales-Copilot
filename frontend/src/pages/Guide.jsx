import { Link } from 'react-router-dom'
import { Download, ClipboardCheck, FileText, Star, MessageSquare, ArrowLeft } from 'lucide-react'

const TEST_FILES = [
  {
    filename: '悦芽湖亲子游泳馆帅帅1-JJ-成交10000.docx',
    label: '成功案例',
    desc: '成交 10000 元，包含完整的销售对话全流程',
    path: '/api/uploads/悦芽湖亲子游泳馆帅帅1-JJ-成交10000.docx',
  },
  {
    filename: '销售Mary-客户c-未成交.docx',
    label: '失败案例',
    desc: '未成交案例，可用于分析销售过程中存在的问题',
    path: '/api/uploads/销售Mary-客户c-未成交.docx',
  },
]

export default function Guide() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 简易导航 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-blue-600 tracking-tight">AI销冠助手</Link>
          <Link to={localStorage.getItem('token') ? '/analysis' : '/login'}
            className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
            {localStorage.getItem('token') ? '进入工作台' : '登录'}
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-20">

      {/* 页头 */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition mb-3">
          <ArrowLeft size={14} /> 返回首页
        </Link>
        <h1 className="text-xl font-bold text-gray-800">使用指南</h1>
        <p className="text-sm text-gray-400 mt-1">供评委/销售测试使用</p>
      </div>

      {/* 测试流程 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <ClipboardCheck size={18} className="text-blue-500" />
          测试流程
        </h2>

        <div className="space-y-5">
          <Step number={1} title="下载示例聊天记录">
            <p className="text-sm text-gray-500">从下方下载成功或失败案例的聊天记录文件，保存到本地。</p>
          </Step>

          <Step number={2} title="进入分析页面">
            <p className="text-sm text-gray-500">点击导航栏「分析」，进入销售沟通分析页面。</p>
          </Step>

          <Step number={3} title="上传并提交">
            <p className="text-sm text-gray-500">
              在分析页面，上传刚才下载的聊天记录文件（支持 txt / pdf / doc / docx 格式），
              可选的备注栏填写客户背景信息，然后点击「开始分析」。
            </p>
          </Step>

          <Step number={4} title="查看分析结果">
            <p className="text-sm text-gray-500">
              AI 会自动完成以下分析：
            </p>
            <ul className="text-sm text-gray-500 space-y-1 mt-2 ml-4 list-disc">
              <li>客户当前所处的决策阶段（认知期 → 需求期 → 对比期 → 决策期）</li>
              <li>客户画像提取（年龄段、决策角色、需求类型、痛点等）</li>
              <li>信息完整性评估及缺失信息提示</li>
              <li>下一步策略建议</li>
              <li>三套话术建议（专业型 / 亲和型 / 高效型）</li>
            </ul>
          </Step>

          <Step number={5} title="追问">
            <p className="text-sm text-gray-500">
              可以追加新的聊天记录或填写问题，AI 会结合历史对话进行新一轮完整分析。
            </p>
          </Step>

          <Step number={6} title="评价分析质量">
            <p className="text-sm text-gray-500">
              对每次分析结果进行三维度评分，帮助评委对比不同分析结果的质量（见下方说明）。
            </p>
          </Step>
        </div>
      </section>

      {/* 示例文件下载 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-blue-500" />
          示例聊天记录
        </h2>
        <p className="text-sm text-gray-400 mb-4">下载后直接在分析页面上传即可测试</p>
        <div className="space-y-3">
          {TEST_FILES.map((file) => (
            <a key={file.filename} href={file.path} download
              className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                      {file.label}
                    </span>
                    <span className="text-xs text-gray-300 truncate">{file.filename}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{file.desc}</p>
                </div>
                <Download size={18} className="text-gray-300 group-hover:text-blue-500 shrink-0 mt-1 transition" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 关于评价体系 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Star size={18} className="text-amber-400" />
          关于评价体系
        </h2>
        <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
          <p>
            在「历史」页面，您可以对每次分析结果进行评分，包含三个维度：
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-xs font-medium text-gray-400 shrink-0 mt-0.5">准确度：</span>
              <span>分析结果是否符合聊天记录的实际内容</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs font-medium text-gray-400 shrink-0 mt-0.5">可用性：</span>
              <span>策略建议和话术是否可以直接用于销售沟通</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs font-medium text-gray-400 shrink-0 mt-0.5">洞察力：</span>
              <span>分析是否提供了超出表面信息的有价值洞察</span>
            </li>
          </ul>
          <p>
            评分数据会汇总展示在历史页顶部，帮助评委对比不同分析结果的质量。
          </p>
        </div>
      </section>

      {/* 四阶段模型 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare size={18} className="text-purple-500" />
          客户决策四阶段模型
        </h2>
        <div className="space-y-4">
          <StageCard number="1" title="认知期" color="blue" description="客户刚开始了解产品或服务，主要关注基本信息和初步印象。销售应着重建立信任、提供基础信息。" />
          <StageCard number="2" title="需求期" color="indigo" description="客户已明确自身需求，开始评估不同方案。销售应深入挖掘需求、展示针对性解决方案。" />
          <StageCard number="3" title="对比期" color="amber" description="客户在多个选择之间对比，关注价格、服务、口碑等具体因素。销售应突出差异化优势、提供案例背书。" />
          <StageCard number="4" title="决策期" color="green" description="客户已基本决定，进入最终成交阶段。销售应消除最后顾虑、促成成交。" />
        </div>
      </section>

      </div>{/* end max-w-4xl */}
    </div>
  )
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
        {children}
      </div>
    </div>
  )
}

const STAGE_MAP = {
  '认知期': { border: 'border-blue-200', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  '需求期': { border: 'border-indigo-200', bg: 'bg-indigo-50', dot: 'bg-indigo-500' },
  '对比期': { border: 'border-amber-200', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  '决策期': { border: 'border-green-200', bg: 'bg-green-50', dot: 'bg-green-500' },
}

function StageCard({ number, title, description }) {
  const s = STAGE_MAP[title] || { border: 'border-gray-200', bg: 'bg-gray-50', dot: 'bg-gray-400' }
  return (
    <div className={`p-4 rounded-xl border ${s.border} ${s.bg}`}>
      <div className="flex items-center gap-2.5 mb-1">
        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
        <span className="text-xs font-semibold text-gray-400">阶段 {number}</span>
        <span className="text-sm font-bold text-gray-800">{title}</span>
      </div>
      <p className="text-sm text-gray-600 ml-4.5">{description}</p>
    </div>
  )
}
