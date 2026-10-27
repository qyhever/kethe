import { BusinessIcon } from '../BusinessIcon'
export function ExpenseProjectIcon({ iconKey, size = 24 }: { iconKey?: string | null; size?: number }) {
 return <BusinessIcon scene="expense-project" iconKey={iconKey} size={size} />
}
