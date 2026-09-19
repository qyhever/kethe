
import type { SVGProps } from 'react'
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

type SvgRootProps = Pick<
  SVGProps<SVGSVGElement>,
  | 'viewBox'
  | 'fill'
  | 'fillRule'
  | 'clipRule'
  | 'stroke'
  | 'strokeWidth'
  | 'strokeLinecap'
  | 'strokeLinejoin'
  | 'strokeMiterlimit'
  | 'strokeDasharray'
  | 'strokeDashoffset'
>

function getSvgAttribute(openTag: string, name: string) {
  const match = openTag.match(
    new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'),
  )
  return match?.[2]
}

function parseSvg(svg: string) {
  const openTagEnd = svg.indexOf('>')
  const closeTagStart = svg.lastIndexOf('</svg>')
  const openTag = svg.slice(0, openTagEnd + 1)
  const rootProps: SvgRootProps = {
    viewBox: getSvgAttribute(openTag, 'viewBox') ?? '0 0 24 24',
    fill: getSvgAttribute(openTag, 'fill') ?? 'currentColor',
    fillRule: getSvgAttribute(openTag, 'fill-rule') as SvgRootProps['fillRule'],
    clipRule: getSvgAttribute(openTag, 'clip-rule') as SvgRootProps['clipRule'],
    stroke: getSvgAttribute(openTag, 'stroke'),
    strokeWidth: getSvgAttribute(openTag, 'stroke-width'),
    strokeLinecap: getSvgAttribute(openTag, 'stroke-linecap') as SvgRootProps['strokeLinecap'],
    strokeLinejoin: getSvgAttribute(openTag, 'stroke-linejoin') as SvgRootProps['strokeLinejoin'],
    strokeMiterlimit: getSvgAttribute(openTag, 'stroke-miterlimit'),
    strokeDasharray: getSvgAttribute(openTag, 'stroke-dasharray'),
    strokeDashoffset: getSvgAttribute(openTag, 'stroke-dashoffset'),
  }

  return {
    content: svg.slice(openTagEnd + 1, closeTagStart),
    rootProps,
  }
}

export function CategoryIcon({
  name = 'other',
  svgContent,
  size = 40,
  color,
  className,
}: CategoryIconProps) {
  // 已有分类沿用应用内经过设计的图标；接口 SVG 只为扩展图标兜底，
  // 避免服务端的简化占位图覆盖原有图标风格。
  const iconSvg = iconMap[name as CategoryIconName] || svgContent || iconMap.other
  const { content, rootProps } = parseSvg(iconSvg)

  return (
    <svg
      width={size}
      height={size}
      {...rootProps}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      color={color}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
