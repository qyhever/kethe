import { BusinessIcon } from '../BusinessIcon'
import './CategoryIcon.css'
export type CategoryIconName = string
export function CategoryIcon({ name = 'other', svgContent, size = 40, color = 'currentColor', className }: {
 name?: string; svgContent?: string | null; size?: number; color?: string; className?: string
}) { return <BusinessIcon scene="category" iconKey={name} svgContent={svgContent} size={size} color={color} className={className} /> }
