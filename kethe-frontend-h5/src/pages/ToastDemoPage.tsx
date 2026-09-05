import { useToast } from '../components/Toast'
import './ToastDemoPage.css'

export function ToastDemoPage() {
  const toast = useToast()

  const showLoading = () => {
    const id = toast.loading('正在同步账单…')
    window.setTimeout(() => {
      toast.update(id, {
        message: '账单已同步',
        type: 'success',
        duration: 2200,
      })
    }, 1200)
  }

  return (
    <div className="toast-demo-page">
      <main className="toast-demo">
        <p className="toast-demo__eyebrow">COMPONENT / 01</p>
        <h1 className="toast-demo__title">轻提示</h1>
        <p className="toast-demo__lead">
          只在需要时出现，清晰反馈每一次操作，然后安静退场。
        </p>

        <section className="toast-demo__panel" aria-labelledby="toast-demo-title">
          <div>
            <h2 id="toast-demo-title" className="toast-demo__panel-title">Toast states</h2>
            <p className="toast-demo__panel-copy">点击查看不同状态，最多同时显示三条。</p>
          </div>
          <div className="toast-demo__actions">
            <button type="button" onClick={() => toast.success('记录已保存')}>成功</button>
            <button type="button" onClick={() => toast.error('保存失败，请稍后重试')}>错误</button>
            <button type="button" onClick={() => toast.warning('本月预算仅剩 ¥320')}>提醒</button>
            <button type="button" onClick={() => toast.info('已切换至 9 月账单')}>信息</button>
            <button type="button" className="toast-demo__loading" onClick={showLoading}>加载 → 完成</button>
          </div>
        </section>
      </main>
    </div>
  )
}
