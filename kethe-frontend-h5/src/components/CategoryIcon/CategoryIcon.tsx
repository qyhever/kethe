
import FoodIcon from './icons/food.svg?raw'
import TransportIcon from './icons/transport.svg?raw'
import ShoppingIcon from './icons/shopping.svg?raw'
import HousingIcon from './icons/housing.svg?raw'
import EntertainmentIcon from './icons/entertainment.svg?raw'
import MedicalIcon from './icons/medical.svg?raw'
import EducationIcon from './icons/education.svg?raw'
import GiftIcon from './icons/gift.svg?raw'
import CommunicationIcon from './icons/communication.svg?raw'
import SubscriptionIcon from './icons/subscription.svg?raw'
import FinanceIcon from './icons/finance.svg?raw'
import SalaryIcon from './icons/salary.svg?raw'
import BonusIcon from './icons/bonus.svg?raw'
import PartTimeIcon from './icons/part-time.svg?raw'
import InvestmentIcon from './icons/investment.svg?raw'
import GiftMoneyIcon from './icons/gift-money.svg?raw'
import OtherIcon from './icons/other.svg?raw'

const iconMap = {
  food: FoodIcon,
  transport: TransportIcon,
  shopping: ShoppingIcon,
  housing: HousingIcon,
  entertainment: EntertainmentIcon,
  medical: MedicalIcon,
  education: EducationIcon,
  gift: GiftIcon,
  communication: CommunicationIcon,
  subscription: SubscriptionIcon,
  finance: FinanceIcon,
  salary: SalaryIcon,
  bonus: BonusIcon,
  'part-time': PartTimeIcon,
  investment: InvestmentIcon,
  'gift-money': GiftMoneyIcon,
  other: OtherIcon,
} as const

export type CategoryIconName = keyof typeof iconMap

interface CategoryIconProps {
  name?: CategoryIconName | string
  svgContent?: string | null
  size?: number
  color?: string
  className?: string
}

function getSvgContent(svg: string) {
  const openTagEnd = svg.indexOf('>')
  const closeTagStart = svg.lastIndexOf('</svg>')

  return svg.slice(openTagEnd + 1, closeTagStart)
}

export function CategoryIcon({
  name = 'other',
  svgContent,
  size = 40,
  color,
  className,
}: CategoryIconProps) {
  const iconSvg = svgContent || iconMap[name as CategoryIconName] || iconMap.other

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      color={color}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: getSvgContent(iconSvg) }}
    />
  )
}
