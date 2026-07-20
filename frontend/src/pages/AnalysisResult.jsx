import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { analysisApi } from '@/api/analysis'
import { evaluationsApi } from '@/api/evaluations'
import { ChevronLeft, RefreshCw, Upload, FileText, X, CheckCircle, AlertCircle, ChevronDown, ChevronUp, MessageSquare, ShieldAlert } from 'lucide-react'
import InjectionWarning from '@/components/InjectionWarning'

const STAGE_COLORS = {
  '认知期': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: '了解中' },
  '需求期': { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', label: '有需求' },
  '对比期': { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', label: '在对比' },
  '决策期': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: '快成交' },
  '安全拦截': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: '已拦截' },
}

export default function AnalysisResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const chatFileRef = useRef(null)

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 追问
  const [followupInput, setFollowupInput] = useState('')
  const [followupFile, setFollowupFile] = useState(null)
  const [followupLoading, setFollowupLoading] = useState(false)

  // 评价
  const [evalOpen, setEvalOpen] = useState({})
  const [evaluating, setEvaluating] = useState({})

  useEffect(() => {
    loadRecord()
  }, [id])

  const loadRecord = async () => {
    setLoading(true)
    try {
      const res = await analysisApi.get(id)
      setRecord(res.record)
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFollowup = async () => {
    if (!followupInput && !followupFile) return
    setFollowupLoading(true)
    try {
      const fd = new FormData()
      if (followupInput) fd.append('user_input', followupInput)
      if (followupFile) fd.append('file', followupFile)
      await analysisApi.followup(id, fd)
      setFollowupInput('')
      setFollowupFile(null)
      await loadRecord()
    } catch {
      setError('追问失败')
    } finally {
      setFollowupLoading(false)
    }
  }

  const handleEvaluate = async (roundId, dim, value) => {
    const key = `${roundId}`
    setEvaluating((prev) => ({ ...prev, [key]: true }))
    try {
      const existing = record.rounds.find((r) => r.id === roundId)
      const ev = existing?.evaluations?.[0] || {}
      await evaluationsApi.submit({
        round_id: roundId,
        accuracy: dim === 'accuracy' ? value : (ev.accuracy || 0),
        usability: dim === 'usability' ? value : (ev.usability || 0),
        insight: dim === 'insight' ? value : (ev.insight || 0),
      })
      await loadRecord()
    } catch {
    } finally {
      setEvaluating((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="animate-spin text-blue-500" size={28} />
      </div>
    )
  }

  if (error || !record) {
    return <div className="text-center py-20 text-red-500">{error || '记录不存在'}</div>
  }

  const stageStyle = STAGE_COLORS[record.current_stage] || STAGE_COLORS['认知期']
  const rounds = record.rounds || []
  const latestRound = rounds[rounds.length - 1] || {}

  return (
    <div className="space-y-5 pb-20">
      {/* 返回 */}
      <button onClick={() => navigate('/history')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition">
        <ChevronLeft size={16} /> 返回列表
      </button>

      {/* 页头：客户名称 + 阶段 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">
          {record.customer_name || '未知客户'}
          <span className="text-sm font-normal text-gray-400 ml-2">第{rounds.length}轮</span>
        </h2>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${stageStyle.bg} ${stageStyle.text}`}>
          <span className={`w-2 h-2 rounded-full ${stageStyle.dot}`} />
          {record.current_stage}
          {stageStyle.label && <span className="opacity-60">· {stageStyle.label}</span>}
        </div>
      </div>

      {/* 注入告警 */}
      {latestRound.injection_warning && (
        <InjectionWarning detail={latestRound.injection_detail} type="result" />
      )}

      {/* 最新分析结果 */}
      {latestRound.id && (
        <AnalysisContent round={latestRound} record={record}
          evalOpen={evalOpen} setEvalOpen={setEvalOpen}
          evaluating={evaluating} handleEvaluate={handleEvaluate} />
      )}

      {/* 历史轮次 */}
      {rounds.length > 1 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">历史轮次</h3>
          </div>
          {rounds.slice(0, -1).reverse().map((r) => (
            <RoundHistoryItem key={r.id} round={r} />
          ))}
        </section>
      )}

      {/* 追问区域 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">追问</h3>
        <p className="text-xs text-gray-400 mb-4">追加聊天记录或填写新的问题，AI 将重新完整分析</p>

        <textarea
          value={followupInput}
          onChange={(e) => setFollowupInput(e.target.value)}
          placeholder="填写追问内容..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-300 outline-none text-sm resize-none mb-3"
        />

        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => chatFileRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600">
            <Upload size={14} /> {followupFile ? '已选文件' : '上传聊天记录'}
          </button>
          <input ref={chatFileRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.md" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setFollowupFile(f)
            }} />
          {followupFile && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <FileText size={12} />
              <span>{followupFile.name}</span>
              <button onClick={() => setFollowupFile(null)} className="text-red-400 hover:text-red-600 ml-1"><X size={12} /></button>
            </div>
          )}
        </div>

        <button onClick={handleFollowup} disabled={followupLoading || (!followupInput && !followupFile)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50">
          {followupLoading ? '分析中...' : '提交追问'}
        </button>
      </section>
    </div>
  )
}

/* 最新分析内容 */
function AnalysisContent({ round, evalOpen, setEvalOpen, evaluating, handleEvaluate }) {
  const profile = round.customer_profile || {}
  const completeness = round.completeness || {}
  const strategy = round.strategy || {}
  const scripts = round.scripts || {}

  const evaluation = round.evaluations?.[0]
  const evalKey = round.id

  return (
    <div className="space-y-4">

      {/* 阶段判定 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">阶段判定</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{round.stage_reason}</p>
      </section>

      {/* 客户画像 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">客户画像</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          <ProfileItem label="年龄段" value={profile.age_group} />
          <ProfileItem label="决策人" value={profile.decision_maker} />
          <ProfileItem label="培训类型" value={profile.edu_type} />
          <ProfileItem label="具体门类" value={profile.subject} />
          <ProfileItem label="需求明确度" value={profile.demand_clarity} />
          <ProfileItem label="核心痛点" value={profile.core_pain} />
        </div>
      </section>

      {/* 信息完整性 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">信息完整性</h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${completeness.score || 0}%` }} />
          </div>
          <span className="text-sm font-semibold text-gray-600">{completeness.score || 0}/100</span>
        </div>
        {(completeness.gaps || []).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-gray-400">缺失信息：</p>
            {completeness.gaps.map((g, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{g}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 策略建议 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">策略建议</h3>
        <div className="space-y-2">
          {strategy.advice && <StrategyBlock label="建议" text={strategy.advice} />}
          {strategy.pitfall && <StrategyBlock label="避坑" text={strategy.pitfall} />}
          {strategy.question && <StrategyBlock label="追问建议" text={strategy.question} />}
        </div>
      </section>

      {/* 三套话术 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">话术建议</h3>
        <div className="space-y-3">
          {scripts.professional && <ScriptCard label="专业型" text={scripts.professional} />}
          {scripts.affinity && <ScriptCard label="亲和型" text={scripts.affinity} />}
          {scripts.efficient && <ScriptCard label="高效型" text={scripts.efficient} />}
        </div>
      </section>

      {/* 评价 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <button onClick={() => setEvalOpen((prev) => ({ ...prev, [evalKey]: !prev[evalKey] }))}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700">
          评价此分析
          {evalOpen[evalKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {evalOpen[evalKey] && (
          <div className="mt-4 space-y-4">
            <EvalRow label="准确度" dim="accuracy" options={{ 1: '不准确', 2: '基本准确', 3: '非常准确' }}
              value={evaluation?.accuracy || 0} onChange={(v) => handleEvaluate(round.id, 'accuracy', v)} disabled={evaluating[round.id]} />
            <EvalRow label="可用性" dim="usability" options={{ 1: '无法使用', 2: '参考使用', 3: '可直接用' }}
              value={evaluation?.usability || 0} onChange={(v) => handleEvaluate(round.id, 'usability', v)} disabled={evaluating[round.id]} />
            <EvalRow label="洞察力" dim="insight" options={{ 1: '较浅', 2: '有一些洞察', 3: '很有深度' }}
              value={evaluation?.insight || 0} onChange={(v) => handleEvaluate(round.id, 'insight', v)} disabled={evaluating[round.id]} />
          </div>
        )}
      </section>
    </div>
  )
}

function ProfileItem({ label, value }) {
  if (!value || value === '未提供' || value === '') return null
  return (
    <div>
      <span className="text-gray-400">{label}</span>
      <p className="text-gray-700 font-medium">{value}</p>
    </div>
  )
}

function StrategyBlock({ label, text }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50">
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <p className="text-sm text-gray-700 mt-1">{text}</p>
    </div>
  )
}

function ScriptCard({ label, text }) {
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{label}</span>
      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{text}</p>
    </div>
  )
}

function EvalRow({ label, options, value, onChange, disabled }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <div className="flex gap-2">
        {Object.entries(options).map(([k, v]) => (
          <button key={k} onClick={() => onChange(Number(k))}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              value === Number(k)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
            } disabled:opacity-50`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

function RoundHistoryItem({ round }) {
  const [open, setOpen] = useState(false)
  const stageStyle = STAGE_COLORS[round.stage] || STAGE_COLORS['认知期']
  const evaluation = round.evaluations?.[0]

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">第{round.round_number}轮</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stageStyle.bg} ${stageStyle.text}`}>
            {round.stage}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {evaluation && <CheckCircle size={14} className="text-green-400" />}
          {open ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2">
          {round.stage_reason && <p className="text-xs text-gray-500 leading-relaxed">{round.stage_reason}</p>}
          <p className="text-xs text-gray-400">{new Date(round.created_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}
