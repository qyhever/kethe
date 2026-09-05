
import FoodIcon from './icons/food.svg'
import TransportIcon from './icons/transport.svg'
import ShoppingIcon from './icons/shopping.svg'
import HousingIcon from './icons/housing.svg'
import EntertainmentIcon from './icons/entertainment.svg'
import MedicalIcon from './icons/medical.svg'
import EducationIcon from './icons/education.svg'
import GiftIcon from './icons/gift.svg'
import CommunicationIcon from './icons/communication.svg'
import SubscriptionIcon from './icons/subscription.svg'
import FinanceIcon from './icons/finance.svg'
import OtherIcon from './icons/other.svg'

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
  other: OtherIcon,
} as const

export type CategoryIconName = keyof typeof iconMap

interface CategoryIconProps {
  name?: CategoryIconName | string
  size?: number
  className?: string
}

export function CategoryIcon({
  name = 'other',
  size = 40,
  className,
}: CategoryIconProps) {
  const Icon =
    iconMap[name as CategoryIconName] ??
    iconMap.other

  return (
    <Icon
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    />
  )
}