// 断言里的期望文案都是英文（"node 环境词典 = en"）。Node 20+ 自带全局
// navigator，t() 会回退到 navigator.language —— 非 en 的机器（如 zh-CN）
// 于是全部断言失配。只在语言真正取自系统、且不是 en 时覆盖成 en。
const lang = navigator.language
if (typeof lang === 'string' && !lang.toLowerCase().startsWith('en')) {
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
}
