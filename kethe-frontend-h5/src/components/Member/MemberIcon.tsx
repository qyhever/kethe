import { BusinessIcon } from '../BusinessIcon'
export function MemberIcon({ iconKey, size = 23 }: { iconKey?: string | null; size?: number }) {
 return <BusinessIcon scene="member" iconKey={iconKey} size={size} />
}
