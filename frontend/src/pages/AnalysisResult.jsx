import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { analysisApi } from '@/api/analysis'
import { evaluationsApi } from '@/api/evaluations'
import {
  ChevronLeft, RefreshCw, Upload, FileText, X,
  ChevronDown, ChevronUp, Send, Sparkles, User, Target, Brain,
  Lightbulb, MessageSquare, ShieldAlert, Star, ThumbsUp,
  AlertTriangle, ClipboardList, BookOpen, AlertCircle, CheckCircle, Copy, CopyCheck
} from 'lucide-react'
import InjectionWarning from '@/components/InjectionWarning'

/* 从 round 中提取用户提问文本 */
function getQuestionText(round) {
  const input = round.user_input || ''
  if (!input) return ''
  try {
    const parsed = JSON.parse(input)
    if (typeof parsed === 'object' && parsed.question) return parsed.question
  } catch {}
  return input
}

const STAGE_COLORS = {
  '认知期': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: '了解中' },
  '需求期': { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', label: '有需求' },
  '对比期': { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', label: '在对比' },
  '决策期': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: '快成交' },
  '安全拦截': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: '已拦截' },
}

const QUESTION_BUBBLES = [
  { value: 'chat', label: '接下来怎么跟客户聊？', icon: MessageSquare },
  { value: 'review', label: '帮我分析之前的回复哪里不好？', icon: FileText },
  { value: 'ask', label: '怎么向客户提问获取更多信息？', icon: Send },
  { value: 'summary', label: '总结这个客户成交的经验', icon: Sparkles },
]

/* 工具：复制文本 */
function useCopy() {
  const [copiedId, setCopiedId] = useState(null)
  const copy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }
  return { copiedId, copy }
}

export default function AnalysisResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const chatFileRef = useRef(null)

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [followupInput, setFollowupInput] = useState('')
  const [followupFile, setFollowupFile] = useState(null)
  const [followupLoading, setFollowupLoading] = useState(false)

  const [evalOpen, setEvalOpen] = useState({})

  useEffect(() => {
    loadRecord()
  }, [id])

  const loadRecord = async () => {
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
      <button onClick={() => navigate('/history')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition">
        <ChevronLeft size={16} /> 返回列表
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">
          {record.customer_name || '未知客户'}
          <span className="text-sm font-normal text-gray-400 ml-2">共{rounds.length}轮对话</span>
        </h2>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${stageStyle.bg} ${stageStyle.text}`}>
          <span className={`w-2 h-2 rounded-full ${stageStyle.dot}`} />
          {record.current_stage}
          {stageStyle.label && <span className="opacity-60">· {stageStyle.label}</span>}
        </div>
      </div>

      {latestRound.injection_warning && (
        <InjectionWarning detail={latestRound.injection_detail} type="result" />
      )}

      {/* 所有轮次 */}
      {rounds.map((round, idx) => (
        <div key={round.id}>
          <RoundBubble round={round} isLatest={idx === rounds.length - 1} />
          <AnalysisContent round={round}
            evalOpen={evalOpen} setEvalOpen={setEvalOpen}
            onEvalSubmitted={loadRecord} />
        </div>
      ))}

      {/* 追问 */}
      <FollowupSection
        followupInput={followupInput} setFollowupInput={setFollowupInput}
        followupFile={followupFile} setFollowupFile={setFollowupFile}
        followupLoading={followupLoading}
        chatFileRef={chatFileRef}
        onSubmit={handleFollowup} />
    </div>
  )
}

/* 用户提问气泡 */
function RoundBubble({ round, isLatest }) {
  const text = getQuestionText(round)
  if (!text) return null
  return (
    <div className={`flex justify-end gap-3 mb-4 ${isLatest ? '' : 'opacity-60'}`}>
      <div className="flex-1 flex justify-end">
        <div className="bg-gradient-to-l from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm max-w-[80%]">
          <p className="text-sm font-semibold leading-relaxed">{text}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1 shadow-sm">
        我
      </div>
    </div>
  )
}

/* AI 分析内容块 */
function AnalysisContent({ round, evalOpen, setEvalOpen, onEvalSubmitted }) {
  const profile = round.customer_profile || {}
  const completeness = round.completeness || {}
  const strategy = round.strategy || {}
  const scripts = round.scripts || {}
  const evaluation = round.evaluations?.[0]
  const evalKey = round.id
  const { copiedId, copy } = useCopy()

  return (
    <div className="space-y-4 mb-8 ml-3 border-l-2 border-indigo-100 pl-5 relative">
      <div className="absolute -left-[1.45rem] top-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
        AI
      </div>

      <SectionCard icon={Target} title="阶段判定" color="blue">
        <p className="text-sm text-gray-600 leading-relaxed">{round.stage_reason}</p>
      </SectionCard>

      <SectionCard icon={User} title="客户画像" color="purple">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          <ProfileItem icon={User} label="年龄段" value={profile.age_group} />
          <ProfileItem icon={User} label="决策人" value={profile.decision_maker} />
          <ProfileItem icon={BookOpen} label="培训类型" value={profile.edu_type} />
          <ProfileItem icon={BookOpen} label="具体门类" value={profile.subject} />
          <ProfileItem icon={Target} label="需求明确度" value={profile.demand_clarity} />
          <ProfileItem icon={AlertTriangle} label="核心痛点" value={profile.core_pain} />
        </div>
      </SectionCard>

      <SectionCard icon={ClipboardList} title="信息完整性" color="cyan">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full transition-all shadow-sm" style={{ width: `${completeness.score || 0}%` }} />
          </div>
          <span className="text-sm font-bold text-gray-600">{completeness.score || 0}/100</span>
        </div>
        {(completeness.gaps || []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-gray-400 font-medium">缺失信息：</p>
            {completeness.gaps.map((g, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{g}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard icon={Lightbulb} title="策略建议" color="amber">
        <div className="space-y-2.5">
          {strategy.advice && <StrategyBlock icon={ThumbsUp} label="建议" text={strategy.advice} color="blue" copiedId={copiedId} onCopy={copy} />}
          {strategy.pitfall && <StrategyBlock icon={AlertTriangle} label="避坑" text={strategy.pitfall} color="red" copiedId={copiedId} onCopy={copy} />}
          {strategy.question && <StrategyBlock icon={MessageSquare} label="追问建议" text={strategy.question} color="green" copiedId={copiedId} onCopy={copy} />}
        </div>
      </SectionCard>

      <SectionCard icon={MessageSquare} title="话术建议" color="green">
        <div className="space-y-3">
          {scripts.professional && <ScriptCard label="专业型" text={scripts.professional} copiedId={copiedId} onCopy={copy} />}
          {scripts.affinity && <ScriptCard label="亲和型" text={scripts.affinity} copiedId={copiedId} onCopy={copy} />}
          {scripts.efficient && <ScriptCard label="高效型" text={scripts.efficient} copiedId={copiedId} onCopy={copy} />}
        </div>
      </SectionCard>

      <EvaluationCard roundId={round.id}
        evaluation={evaluation}
        evalOpen={evalOpen} setEvalOpen={setEvalOpen}
        onSubmitted={onEvalSubmitted} />
    </div>
  )
}

/* 追问区域 */
function FollowupSection({ followupInput, setFollowupInput, followupFile, setFollowupFile, followupLoading, chatFileRef, onSubmit }) {
  return (
    <section className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-purple-100 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-indigo-800 mb-1">追问</h3>
      <p className="text-xs text-indigo-400 mb-4">追加聊天记录或填写新的问题，AI 将重新完整分析</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {QUESTION_BUBBLES.map((item) => {
          const Icon = item.icon
          const isActive = followupInput === item.label
          return (
            <button key={item.value} type="button"
              onClick={() => setFollowupInput(isActive ? '' : item.label)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
              }`}>
              <Icon size={14} />
              <span className="text-left leading-snug">{item.label}</span>
            </button>
          )
        })}
      </div>

      <textarea
        value={followupInput}
        onChange={(e) => setFollowupInput(e.target.value)}
        placeholder="选择上方示例或直接描述您的诉求..."
        rows={2}
        className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-indigo-300 outline-none text-sm resize-none mb-3"
        style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
      />

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => chatFileRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-600">
          <Upload size={14} /> {followupFile ? '已选文件' : '上传聊天记录'}
        </button>
        <input ref={chatFileRef} type="file" accept=".txt,.pdf,.doc,.docx,.csv,.md" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setFollowupFile(f) }} />
        {followupFile && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FileText size={12} />
            <span>{followupFile.name}</span>
            <button onClick={() => setFollowupFile(null)} className="text-red-400 hover:text-red-600 ml-1"><X size={12} /></button>
          </div>
        )}
      </div>

      <button onClick={onSubmit} disabled={followupLoading || (!followupInput && !followupFile)}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50">
        {followupLoading ? '分析中...' : '提交追问'}
      </button>
    </section>
  )
}

/* 带色带的卡片 */
function SectionCard({ icon: Icon, title, color, children }) {
  const COLORS = {
    blue: { header: 'from-blue-500 to-blue-600' },
    purple: { header: 'from-purple-500 to-purple-600' },
    amber: { header: 'from-amber-500 to-orange-500' },
    green: { header: 'from-green-500 to-emerald-500' },
    cyan: { header: 'from-cyan-500 to-blue-500' },
    red: { header: 'from-red-500 to-rose-500' },
  }
  const c = COLORS[color] || COLORS.blue
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`bg-gradient-to-r ${c.header} px-5 py-3 flex items-center gap-2`}>
        <Icon size={15} className="text-white opacity-80" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

/* 评价卡片 */
function EvaluationCard({ roundId, evaluation, evalOpen, setEvalOpen, onSubmitted }) {
  const [comment, setComment] = useState(evaluation?.comment || '')
  const [submitting, setSubmitting] = useState(false)
  const key = `eval_${roundId}`
  const isOpen = evalOpen[key] ?? false

  // 本地评分状态（不即时提交）
  const [scores, setScores] = useState({
    accuracy: evaluation?.accuracy || 0,
    usability: evaluation?.usability || 0,
    insight: evaluation?.insight || 0,
  })

  useEffect(() => {
    if (evaluation) {
      setComment(evaluation.comment || '')
      setScores({
        accuracy: evaluation.accuracy || 0,
        usability: evaluation.usability || 0,
        insight: evaluation.insight || 0,
      })
    }
  }, [evaluation?.id, evaluation?.accuracy, evaluation?.usability, evaluation?.insight, evaluation?.comment])

  const hasScore = scores.accuracy > 0 || scores.usability > 0 || scores.insight > 0

  const handleSubmit = async () => {
    if (scores.accuracy === 0 && scores.usability === 0 && scores.insight === 0) return
    setSubmitting(true)
    try {
      await evaluationsApi.submit({
        round_id: roundId,
        ...scores,
        comment,
      })
      await onSubmitted()
      setEvalOpen((prev) => ({ ...prev, [key]: false }))
    } catch (err) {
      console.error('评价提交失败', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setEvalOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Star size={15} className="text-amber-400" />
          评价此分析
        </div>
        <div className="flex items-center gap-2">
          {hasScore && <CheckCircle size={14} className="text-green-400" />}
          {isOpen ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          <EvalRow label="准确度" dim="accuracy" options={{ 1: '不准确', 2: '基本准确', 3: '非常准确' }}
            value={scores.accuracy} onChange={(v) => setScores((s) => ({ ...s, accuracy: v }))} />
          <EvalRow label="可用性" dim="usability" options={{ 1: '无法使用', 2: '参考使用', 3: '可直接用' }}
            value={scores.usability} onChange={(v) => setScores((s) => ({ ...s, usability: v }))} />
          <EvalRow label="洞察力" dim="insight" options={{ 1: '较浅', 2: '有一些洞察', 3: '很有深度' }}
            value={scores.insight} onChange={(v) => setScores((s) => ({ ...s, insight: v }))} />

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">文本反馈 <span className="text-gray-300 font-normal">（选填）</span></p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="如果对 AI 回复不满意，请具体指出不合理或不合适之处，便于开发人员改进，谢谢。"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-300 outline-none text-sm resize-none"
            />
          </div>

          <button type="button" onClick={handleSubmit} disabled={submitting || (!scores.accuracy && !scores.usability && !scores.insight)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 shadow-sm">
            {submitting ? '提交中...' : '提交评价'}
          </button>
        </div>
      )}
    </section>
  )
}

/* 带复制按钮的策略块 */
function StrategyBlock({ icon: Icon, label, text, color, copiedId, onCopy }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-400' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-400' },
    green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-400' },
  }
  const c = colors[color] || colors.blue
  const id = `${label}_${text?.slice(0, 20)}`
  const isCopied = copiedId === id

  return (
    <div className={`flex gap-2.5 p-3.5 rounded-xl ${c.bg}`}>
      {Icon && <Icon size={16} className={`shrink-0 mt-0.5 ${c.icon}`} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold ${c.text}`}>{label}</span>
          <button onClick={() => onCopy(text, id)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 shrink-0 transition">
            {isCopied ? <CopyCheck size={12} className="text-green-500" /> : <Copy size={12} />}
            {isCopied ? '√已复制' : '复制'}
          </button>
        </div>
        <p className="text-sm text-gray-700 mt-0.5">{text}</p>
      </div>
    </div>
  )
}

/* 带复制按钮的话术卡片 */
function ScriptCard({ label, text, copiedId, onCopy }) {
  const id = `${label}_${text?.slice(0, 20)}`
  const isCopied = copiedId === id
  return (
    <div className="p-4 rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white">{label}</span>
        <button onClick={() => onCopy(text, id)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 shrink-0 transition">
          {isCopied ? <CopyCheck size={12} className="text-green-500" /> : <Copy size={12} />}
          {isCopied ? '√已复制' : '复制'}
        </button>
      </div>
      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{text}</p>
    </div>
  )
}

function ProfileItem({ icon: Icon, label, value }) {
  if (!value || value === '未提供' || value === '') return null
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon size={14} className="text-gray-300 shrink-0 mt-0.5" />}
      <div>
        <span className="text-xs text-gray-400">{label}</span>
        <p className="text-sm text-gray-700 font-medium">{value}</p>
      </div>
    </div>
  )
}

function EvalRow({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <div className="flex gap-2">
        {Object.entries(options).map(([k, v]) => (
          <button key={k} type="button" onClick={() => onChange(Number(k))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              value === Number(k)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
            }`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
