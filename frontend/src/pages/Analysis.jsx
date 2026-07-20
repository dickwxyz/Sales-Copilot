import { useState } from 'react'

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

const EDU_TYPES = [
  { value: '素质', label: '素质' },
  { value: '学科', label: '学科' },
]

const SUBJECTS_BY_TYPE = {
  '素质': ['游泳', '体能', '艺术', '编程', '口才', '其他'],
  '学科': ['英语', '数学', '语文', '物理', '化学', '其他'],
}

export default function Analysis() {
  const [ageGroup, setAgeGroup] = useState('')
  const [decisionMaker, setDecisionMaker] = useState('')
  const [eduType, setEduType] = useState('')
  const [subject, setSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')

  const subjects = eduType ? SUBJECTS_BY_TYPE[eduType] : []

  const handleSubjectSelect = (val) => {
    setSubject(val)
    if (val !== '其他') setCustomSubject('')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">新建分析</h2>

      {/* 区块一：培训对象年龄 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">一、培训对象年龄</h3>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((item) => (
            <button
              key={item.value}
              onClick={() => setAgeGroup(item.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition border ${
                ageGroup === item.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* 区块二：决策人 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">二、决策人</h3>
        <div className="flex flex-wrap gap-2">
          {DECISION_MAKERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setDecisionMaker(item.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition border ${
                decisionMaker === item.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* 区块三：培训类型和门类 */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">三、培训类型 / 门类</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {EDU_TYPES.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setEduType(item.value)
                setSubject('')
                setCustomSubject('')
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition border ${
                eduType === item.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {eduType && (
          <div className="flex flex-wrap gap-2">
            {subjects.map((item) => (
              <button
                key={item}
                onClick={() => handleSubjectSelect(item)}
                className={`px-4 py-2 rounded-lg text-sm transition border ${
                  subject === item
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200'
                }`}
              >
                {item}
              </button>
            ))}
            {subject === '其他' && (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="请输入具体门类"
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 outline-none text-sm"
              />
            )}
          </div>
        )}
      </section>

      {/* 占位：后续区块 */}
      <div className="text-center text-sm text-gray-400 py-8">
        后续将添加聊天记录上传、备注信息和提交分析功能
      </div>
    </div>
  )
}
