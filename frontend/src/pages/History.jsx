import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analysisApi } from '@/api/analysis'
import { Plus, Search, ChevronLeft, ChevronRight, RefreshCw, MessageSquare, User, BarChart3 } from 'lucide-react'

const STAGE_COLORS = {
  '认知期': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  '需求期': { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  '对比期': { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  '决策期': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  '安全拦截': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
}

export default function History() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [keyword, setKeyword] = useState('')

  const loadList = async (p) => {
    setLoading(true)
    try {
      const params = { page: p, per_page: 10 }
      if (keyword.trim()) params.keyword = keyword.trim()
      const res = await analysisApi.list(params)
      setRecords(res.records || [])
      setTotal(res.total || 0)
      setPages(res.pages || 0)
      setPage(res.page || 1)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList(1)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadList(1)
  }

  const goNewAnalysis = () => navigate('/analysis')
  const goDetail = (id) => navigate(`/analysis/${id}`)

  return (
    <div className="space-y-4">

      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">历史记录</h1>
        <button onClick={goNewAnalysis}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm">
          <Plus size={16} /> 新分析
        </button>
      </div>

      {/* 搜索栏 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索客户名称..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 outline-none text-sm"
          />
        </div>
        <button type="submit"
          className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition">
          搜索
        </button>
      </form>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-blue-400" size={24} />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">还没有分析记录</p>
          <button onClick={goNewAnalysis}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm">
            <Plus size={16} /> 新分析
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <RecordCard key={r.id} record={r} onClick={() => goDetail(r.id)} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => loadList(page - 1)} disabled={page <= 1}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition">
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => loadList(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition ${p === page ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => loadList(page + 1)} disabled={page >= pages}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

/* 单条记录卡片 */
function RecordCard({ record, onClick }) {
  const stage = STAGE_COLORS[record.current_stage]
  const time = new Date(record.updated_at || record.created_at)
  const profile = record.profile || {}
  const notesParsed = record.notes_parsed || {}

  // 提取特征标签
  const tags = []
  const ageLabel = profile.age_group || notesParsed.ageGroup
  if (ageLabel) tags.push({ label: ageLabel, icon: User, color: 'text-blue-600 bg-blue-50' })
  const decisionLabel = profile.decision_maker || notesParsed.decisionMaker
  if (decisionLabel) tags.push({ label: decisionLabel, icon: null, color: 'text-purple-600 bg-purple-50' })
  const typeLabel = profile.edu_type || profile.subject || notesParsed.trainingType
  if (typeLabel) tags.push({ label: typeLabel, icon: null, color: 'text-green-600 bg-green-50' })

  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition cursor-pointer group">

      {/* 顶部：客户名称 + 阶段 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="text-base font-bold text-gray-800 truncate">
            {record.customer_name || '未知客户'}
          </h3>
          {record.round_count > 0 && (
            <span className="text-xs text-gray-300 shrink-0">{record.round_count} 轮</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {stage && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${stage.bg} ${stage.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
              {record.current_stage}
            </span>
          )}
          <span className="text-xs text-gray-400">{time.toLocaleDateString()}</span>
        </div>
      </div>

      {/* 特征标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((t, i) => (
            <span key={i}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${t.color}`}>
              {t.icon && <t.icon size={12} />}
              {t.label}
            </span>
          ))}
        </div>
      )}

      {/* 底部提示 */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-blue-500 transition">
        <BarChart3 size={13} />
        <span>查看分析详情</span>
      </div>
    </div>
  )
}
