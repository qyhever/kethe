import { BusinessIcon } from '../BusinessIcon'
export function MerchantIcon({ iconKey, size = 24 }: { iconKey?: string | null; size?: number }) {
 return <BusinessIcon scene="merchant" iconKey={iconKey} size={size} />
}
