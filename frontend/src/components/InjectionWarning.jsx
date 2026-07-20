import { AlertTriangle, ShieldAlert, X } from 'lucide-react'

const INJECTION_KEYWORDS = [
  { pattern: /忽略\s*上[述面文]/i, hint: '包含"忽略上文/上述"等规避指令' },
  { pattern: /忽略\s*[所全].*?(提示|规则|设定)/i, hint: '包含"忽略提示/规则/设定"等规避指令' },
  { pattern: /忘记\s*[你自].*?(身份|设定)/i, hint: '包含"忘记身份/设定"等越狱指令' },
  { pattern: /忘记\s*上[述面文]/i, hint: '包含"忘记上文/上述"等规避指令' },
  { pattern: /(输出|打印|显示|告诉|重复|复述|说出|透露|泄露|分享)\s*(你.?)?[的所].*?(提示词|指令|规则|prompt|设定)/i, hint: '试图获取系统提示词/指令' },
  { pattern: /(你|现在|请).*?(是|扮演).*?(不受限制|自由|无限制|解锁|越狱)/i, hint: '包含越狱角色扮演行为' },
  { pattern: /DAN/i, hint: '包含DAN越狱关键词' },
  { pattern: /解除|打破|突破.*?(限制|约束|规则)/i, hint: '试图解除系统限制' },
  { pattern: /(base64|base32|rot13)/i, hint: '包含编码混淆，可能试图绕过检测' },
  { pattern: /s\s*y\s*s\s*t\s*e\s*m/i, hint: '以拆字方式试图绕过system关键词检测' },
  { pattern: /p\s*r\s*o\s*m\s*p\s*t/i, hint: '以拆字方式试图绕过prompt关键词检测' },
  { pattern: /(先|请).*?(翻译|转换).*?(成|到).*?(英文|英文)/i, hint: '通过翻译越狱获取系统提示' },
  { pattern: /用.*?(英文|英文).*?(回答|回复|输出)/i, hint: '通过外语越狱获取系统提示' },
]

export function checkInjection(text) {
  if (!text) return []
  const matches = []
  for (const { pattern, hint } of INJECTION_KEYWORDS) {
    if (pattern.test(text)) {
      matches.push(hint)
    }
  }
  return matches
}

// 关键敏感词 - 直接阻断
const BLOCK_KEYWORDS = [
  /忽略\s*上[述面文]/i, /忽略\s*[所全].*?(提示|规则|设定)/i,
  /忘记\s*[你自].*?(身份|设定)/i, /(输出|打印|显示|告诉|重复|复述|说出|透露|泄露)\s*(你.?)?[的所].*?(提示词|指令|规则|prompt|设定)/i,
]

export function isHighRisk(text) {
  if (!text) return false
  return BLOCK_KEYWORDS.some((p) => p.test(text))
}

export default function InjectionWarning({ detail, onClose, type = 'result' }) {
  if (type === 'result') {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 animate-in fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert size={22} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-red-800">系统安全告警</h3>
            <p className="text-xs text-red-600 mt-1 leading-relaxed">
              系统检测到您的输入包含可能的提示注入关键词，已自动拦截本次请求，未调用 AI 接口。
              请专注于客户分析场景，不要尝试获取系统提示词或修改系统行为。
            </p>
            {detail && (
              <div className="mt-2 bg-red-100/50 rounded-lg px-3 py-2">
                <p className="text-xs text-red-700 font-medium">检测详情：</p>
                <p className="text-xs text-red-600 mt-0.5">{detail}</p>
              </div>
            )}
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 text-red-400 hover:text-red-600 shrink-0">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // type = 'modal' - 提交前的阻断弹窗
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">安全拦截</h3>
          <p className="text-sm text-gray-500 mt-1">输入内容包含敏感关键词</p>
        </div>

        <div className="bg-red-50 rounded-xl p-4 mb-5">
          <p className="text-xs text-red-700 font-medium mb-2">以下输入可能存在安全风险：</p>
          <ul className="space-y-1">
            {detail.split(';').map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-600">
                <span className="block w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                {d.trim()}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-amber-700">
            <strong>提示：</strong>请专注于客户跟进场景，描述客户信息和需求即可。
            不要尝试让系统忽略规则或输出提示词。
          </p>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              我知道了
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
