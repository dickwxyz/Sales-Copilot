import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Target, MessageSquare, BarChart3, Shield } from 'lucide-react'

const FEATURES = [
  { icon: Target, title: '客户阶段识别', desc: '智能判定客户所处的决策阶段，精准把握沟通节奏' },
  { icon: MessageSquare, title: 'AI 话术建议', desc: '生成专业型、亲和型、高效型三套话术，适配不同客户风格' },
  { icon: BarChart3, title: '多轮追问分析', desc: '支持追加聊天记录进行多轮分析，追踪客户状态变化' },
  { icon: Shield, title: '安全防护', desc: '内置 prompt 注入检测，保障系统安全运行' },
]

export default function Home() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 顶部导航 */}
      <header className="border-b border-gray-100 bg-white/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600 tracking-tight">AI销冠助手</span>
          <div className="flex items-center gap-3">
            <Link to="/guide" className="text-sm text-gray-500 hover:text-gray-700">使用指南</Link>
            {token ? (
              <button onClick={() => navigate('/analysis')}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                进入工作台
              </button>
            ) : (
              <button onClick={() => navigate('/login')}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-32 text-center">
        {/* 小字 slogan */}
        <p className="text-sm font-medium text-blue-500 tracking-widest mb-4">
          让每个销售，都拥有销冠的成交力
        </p>

        {/* 大字标题 */}
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
          AI销冠助手
        </h1>

        {/* 一句话介绍 */}
        <p className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto mb-12">
          聚焦 0-10 岁亲子游泳，辅助销售生成客户画像和推进话术建议，提高成单率
        </p>

        {/* CTA 按钮 */}
        <div className="flex items-center justify-center gap-4 mb-20">
          {token ? (
            <button onClick={() => navigate('/analysis')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200">
              开始分析
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200">
                登录使用
              </button>
              <button onClick={() => navigate('/register')}
                className="px-8 py-3.5 rounded-2xl bg-white text-gray-700 font-semibold text-base border border-gray-200 hover:border-blue-200 hover:text-blue-600 transition">
                注册体验
              </button>
            </>
          )}
        </div>

        {/* 特色卡片 */}
        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 text-left shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
