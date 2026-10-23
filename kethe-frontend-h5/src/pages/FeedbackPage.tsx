import { ArrowLeft } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createFeedback } from '../api/feedbacks'
import { useToast } from '../components/Toast'
import './FeedbackPage.css'

export function FeedbackPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const trimmed = content.trim()
  const count = [...trimmed].length
  const valid = count >= 1 && count <= 1000
  const hint = count === 0
    ? '请输入反馈内容，不能仅包含空白'
    : count > 1000
      ? '反馈内容不能超过 1000 个字符'
      : '感谢你的建议，帮助我们改进产品'

  const submit = async () => {
    if (submittingRef.current || !valid) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      await createFeedback({ content: trimmed })
      toast.success('反馈已提交，感谢你的建议')
      navigate('/profile', { replace: true })
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : '提交失败，请重试')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <main className="feedback-page" aria-labelledby="feedback-title">
      <header className="feedback-page__header">
        <button type="button" aria-label="返回我的页面" onClick={() => navigate('/profile')}>
          <ArrowLeft aria-hidden="true" size={24} />
        </button>
        <h1 id="feedback-title">意见反馈</h1>
        <span aria-hidden="true" />
      </header>
      <form className="feedback-form" aria-busy={submitting} onSubmit={event => {
        event.preventDefault()
        void submit()
      }}>
        <label htmlFor="feedback-content">反馈内容</label>
        <textarea
          id="feedback-content"
          placeholder="请告诉我们你的问题或建议…"
          value={content}
          disabled={submitting}
          onChange={event => setContent(event.target.value)}
          aria-describedby="feedback-hint feedback-count"
          aria-invalid={count > 1000 || (content.length > 0 && count === 0)}
          rows={8}
        />
        <div className="feedback-form__details">
          <p id="feedback-hint" className={count > 1000 ? 'feedback-form__error' : undefined} aria-live="polite">{hint}</p>
          <span id="feedback-count">{count} / 1000</span>
        </div>
        <button className="feedback-form__submit" type="submit" disabled={!valid || submitting}>
          {submitting ? '提交中…' : '提交反馈'}
        </button>
      </form>
    </main>
  )
}
