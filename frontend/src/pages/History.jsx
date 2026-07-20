import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analysisApi } from '@/api/analysis'
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, RefreshCw, MessageSquare } from 'lucide-react'

const STAGE_DOTS = {
  '认知期': 'bg-blue-500',
  '需求期': 'bg-indigo-500',
  '对比期': 'bg-amber-500',
  '决策期': 'bg-green-500',
  '安全拦截': 'bg-red-500',
}

export default function History() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // 搜索
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

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    // TODO: 后端删除接口
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
        <div className="space-y-2.5">
          {records.map((r) => {
            const score = r.strategy?.advice ? 1 : 0
            const time = new Date(r.updated_at || r.created_at)
            return (
              <div key={r.id} onClick={() => goDetail(r.id)}
                className="bg-white rounded-xl border border-gray-100 px-5 py-4 hover:border-blue-200 hover:shadow-sm transition cursor-pointer">

                <div className="flex items-start justify-between gap-3">
                  {/* 左侧: 客户名 + 阶段 + 轮次 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {r.customer_name || '未知客户'}
                      </h3>
                      {r.current_stage && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOTS[r.current_stage] || 'bg-gray-300'}`} />
                          {r.current_stage}
                        </span>
                      )}
                      <span className="text-xs text-gray-300">{r.round_count || '?'} 轮</span>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{r.notes}</p>
                    )}
                  </div>

                  {/* 右侧: 时间 + 操作 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{time.toLocaleDateString()}</span>
                    {/* <button onClick={(e) => handleDelete(r.id, e)} className="p-1.5 text-gray-300 hover:text-red-400 transition rounded-lg hover:bg-red-50">
                      <Trash2 size={14} />
                    </button> */}
                  </div>
                </div>
              </div>
            )
          })}
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
