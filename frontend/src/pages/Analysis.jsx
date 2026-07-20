import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, MessageSquare, Send, Sparkles } from 'lucide-react'
import { analysisApi } from '@/api/analysis'

const AGE_GROUPS = [
  { value: '0-3', label: '0-3岁' },
  { value: '4-6', label: '4-6岁' },
  { value: '7-12', label: '7-12岁' },
  { value: '13-18', label: '13-18岁' },
  { value: '其他', label: '其他' },
]

const DECISION_MAKERS = [
  { value: '妈妈', label: '妈妈' },
  { value: '爸爸', label: '爸爸' },
  { value: '其他', label: '其他' },
]

const TRAINING_TYPES = [
  { value: '学科辅导', label: '学科辅导' },
  { value: '艺术素质', label: '艺术素质' },
  { value: '体育运动', label: '体育运动' },
  { value: '编程/机器人', label: '编程/机器人' },
  { value: '英语/语培', label: '英语/语培' },
  { value: '早教/托育', label: '早教/托育' },
  { value: '升学规划', label: '升学规划' },
  { value: '其他', label: '其他' },
]

const DEMAND_CLARITY = [
  { value: '明确', label: '明确' },
  { value: '模糊', label: '模糊' },
]

const PAIN_POINTS = [
  { value: '担心价格', label: '担心价格' },
  { value: '对比了好几家', label: '对比了好几家' },
  { value: '对效果不确定', label: '对效果不确定' },
  { value: '距离/时间不合适', label: '距离/时间不合适' },
  { value: '孩子不愿意上课', label: '孩子不愿意上课' },
  { value: '其他', label: '其他' },
]

const QUESTION_BUBBLES = [
  { value: 'chat', label: '接下来怎么跟客户聊？', icon: MessageSquare },
  { value: 'review', label: '帮我分析之前的回复哪里不好？', icon: FileText },
  { value: 'ask', label: '怎么向客户提问获取更多信息？', icon: Send },
  { value: 'summary', label: '总结这个客户成交的经验', icon: Sparkles },
]

export default function Analysis() {
  const navigate = useNavigate()
  const chatFileRef = useRef(null)
  const sopFileRef = useRef(null)
  const competitorFileRef = useRef(null)

  // ① 基础信息
  const [ageGroup, setAgeGroup] = useState('')
  const [decisionMaker, setDecisionMaker] = useState('')
  const [trainingType, setTrainingType] = useState('')
  const [customTrainingType, setCustomTrainingType] = useState('')
  const [demandClarity, setDemandClarity] = useState('')
  const [painPoint, setPainPoint] = useState('')
  const [customPainPoint, setCustomPainPoint] = useState('')

  // ② 文件
  const [chatFile, setChatFile] = useState(null)
  const [sopFile, setSopFile] = useState(null)
  const [competitorFile, setCompetitorFile] = useState(null)

  // ③ 诉求
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e, setter) => {
    const file = e.target.files?.[0]
    if (file) setter(file)
  }

  const removeFile = (setter) => {
    setter(null)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  const handleSubmit = async () => {
    setError('')

    if (!chatFile && !customQuestion && !selectedQuestion) {
      // 允许不填任何内容，但提示一下
    }

    setLoading(true)
    try {
      const fd = new FormData()

      // 基础信息组装为 notes
      const notes = {
        ageGroup,
        decisionMaker,
        trainingType: trainingType === '其他' ? customTrainingType : trainingType,
        demandClarity,
        painPoint: painPoint === '其他' ? customPainPoint : painPoint,
        question: selectedQuestion || customQuestion,
      }
      fd.append('notes', JSON.stringify(notes))

      // 文件
      if (chatFile) fd.append('chat_file', chatFile)
      if (sopFile) fd.append('sop_file', sopFile)
      if (competitorFile) fd.append('competitor_file', competitorFile)

      const res = await analysisApi.create(fd)
      navigate(`/analysis/${res.record.id}`)
    } catch (err) {
      setError(err.response?.data?.error || '分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-800">新建分析</h2>

      {/* ① 基础信息 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">① 基础信息</h3>
        <p className="text-xs text-gray-400 mb-4">填写客户已知信息，不确定可不填。AI 会自动从聊天记录中提取并交叉验证</p>

        {/* 培训对象年龄 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">培训对象年龄</label>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((item) => (
              <button key={item.value} type="button"
                onClick={() => setAgeGroup(item.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  ageGroup === item.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
                }`}
              >{item.label}</button>
            ))}
          </div>
        </div>

        {/* 决策人 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">决策人</label>
          <div className="flex flex-wrap gap-2">
            {DECISION_MAKERS.map((item) => (
              <button key={item.value} type="button"
                onClick={() => setDecisionMaker(item.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  decisionMaker === item.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
                }`}
              >{item.label}</button>
            ))}
          </div>
        </div>

        {/* 培训类型 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">培训类型</label>
          <div className="flex flex-wrap gap-2">
            {TRAINING_TYPES.map((item) => (
              <button key={item.value} type="button"
                onClick={() => { setTrainingType(item.value); if (item.value !== '其他') setCustomTrainingType('') }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  trainingType === item.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
                }`}
              >{item.label}</button>
            ))}
          </div>
          {trainingType === '其他' && (
            <input type="text" value={customTrainingType}
              onChange={(e) => setCustomTrainingType(e.target.value)}
              placeholder="请输入培训类型"
              className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 outline-none text-sm"
            />
          )}
        </div>

        {/* 需求明确度 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">需求明确度</label>
          <div className="flex gap-2">
            {DEMAND_CLARITY.map((item) => (
              <button key={item.value} type="button"
                onClick={() => setDemandClarity(item.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  demandClarity === item.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
                }`}
              >{item.label}</button>
            ))}
          </div>
        </div>

        {/* 核心痛点 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">核心痛点 <span className="text-gray-300 font-normal">（选填）</span></label>
          <div className="flex flex-wrap gap-2">
            {PAIN_POINTS.map((item) => (
              <button key={item.value} type="button"
                onClick={() => { setPainPoint(item.value); if (item.value !== '其他') setCustomPainPoint('') }}
                className={`px-4 py-2 rounded-lg text-sm transition border ${
                  painPoint === item.value
                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200'
                }`}
              >{item.label}</button>
            ))}
          </div>
          {painPoint === '其他' && (
            <input type="text" value={customPainPoint}
              onChange={(e) => setCustomPainPoint(e.target.value)}
              placeholder="请输入具体痛点"
              className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-300 outline-none text-sm"
            />
          )}
        </div>
      </section>

      {/* ② 上传文件 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">② 上传文件</h3>
        <p className="text-xs text-gray-400 mb-4">支持 .txt .pdf .doc .docx .csv .md 格式，选填</p>

        <div className="space-y-3">
          {/* 聊天记录 */}
          <FileUploadRow label="聊天记录" icon={FileText}
            file={chatFile} onFileChange={(e) => handleFileChange(e, setChatFile)}
            onRemove={() => removeFile(setChatFile)} inputRef={chatFileRef} />

          {/* 企业 SOP / 工作流 */}
          <FileUploadRow label="企业 SOP / 工作流" icon={FileText}
            file={sopFile} onFileChange={(e) => handleFileChange(e, setSopFile)}
            onRemove={() => removeFile(setSopFile)} inputRef={sopFileRef} />

          {/* 竞品 / 其他 */}
          <FileUploadRow label="竞品介绍 / 其他参考" icon={FileText}
            file={competitorFile} onFileChange={(e) => handleFileChange(e, setCompetitorFile)}
            onRemove={() => removeFile(setCompetitorFile)} inputRef={competitorFileRef} />
        </div>
      </section>

      {/* ③ 具体诉求 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">③ 具体诉求</h3>
        <p className="text-xs text-gray-400 mb-4">选择或描述你希望 AI 帮你解决的问题</p>

        {/* 气泡 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {QUESTION_BUBBLES.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.value} type="button"
                onClick={() => { setSelectedQuestion(item.value); setCustomQuestion('') }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition border ${
                  selectedQuestion === item.value
                    ? 'bg-purple-50 text-purple-700 border-purple-300'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200 hover:text-purple-600'
                }`}
              >
                <Icon size={16} />
                <span className="text-left leading-snug">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* 文本框 */}
        <textarea
          value={customQuestion}
          onChange={(e) => { setCustomQuestion(e.target.value); if (e.target.value) setSelectedQuestion('') }}
          placeholder="选择上方示例或直接描述您的诉求"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-300 focus:ring-2 focus:ring-purple-50 outline-none text-sm resize-none"
        />
      </section>

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition disabled:opacity-50 shadow-md"
      >
        {loading ? 'AI 分析中... 请稍候' : '开始分析'}
      </button>
    </div>
  )
}

/* 文件上传行组件 */
function FileUploadRow({ label, icon: Icon, file, onFileChange, onRemove, inputRef }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
      <Icon size={18} className="text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        {file ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 truncate">{file.name}</span>
            <span className="text-xs text-gray-400 shrink-0">{formatFileSize(file.size)}</span>
            <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 shrink-0">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            + 上传{label}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx,.csv,.md"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}
