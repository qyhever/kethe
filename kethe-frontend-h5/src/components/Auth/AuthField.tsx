import type { ComponentType, InputHTMLAttributes } from 'react'
import { Eye, EyeOff, type LucideProps } from 'lucide-react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ComponentType<LucideProps>
  onTogglePassword?: () => void
  passwordVisible?: boolean
  trailing?: React.ReactNode
}

export function AuthField({
  icon: FieldIcon,
  onTogglePassword,
  passwordVisible = false,
  trailing,
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className="auth-field">
      <FieldIcon className="auth-field__icon" aria-hidden="true" size={23} strokeWidth={1.9} />
      <input {...inputProps} />
      {onTogglePassword && (
        <button
          className="auth-field__visibility"
          type="button"
          aria-label={passwordVisible ? '隐藏密码' : '显示密码'}
          onClick={onTogglePassword}
        >
          {passwordVisible ? (
            <EyeOff aria-hidden="true" size={23} strokeWidth={1.9} />
          ) : (
            <Eye aria-hidden="true" size={23} strokeWidth={1.9} />
          )}
        </button>
      )}
      {trailing}
    </div>
  )
}

