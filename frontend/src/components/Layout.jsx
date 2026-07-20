import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/analysis', label: '分析' },
  { path: '/history', label: '历史' },
  { path: '/guide', label: '指南' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-lg font-bold text-blue-600 tracking-tight"
          >
            AI销冠助手
          </button>

          {/* 桌面导航 */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={16} />
              <span>{user.nickname || user.phone}</span>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
              title="退出登录"
            >
              <LogOut size={16} />
            </button>
          </nav>

          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-500"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* 移动端下拉导航 */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setMobileOpen(false)
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User size={16} />
                  <span>{user.nickname || user.phone}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-400 hover:text-red-600"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 页面内容 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
