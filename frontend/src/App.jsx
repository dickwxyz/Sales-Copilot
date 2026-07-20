import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<div className="p-8 text-center text-gray-500 text-lg">AI销冠助手 — 加载中...</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
