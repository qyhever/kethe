import { PasswordResetView } from '../components/Auth/PasswordResetView'
import { useAuthStore } from '../stores/auth'

export function ResetPasswordPage() {
  const email = useAuthStore((state) => state.user?.email ?? '')
  const signOut = useAuthStore((state) => state.signOut)

  return <PasswordResetView mode="reset" email={email} onReset={signOut} />
}
