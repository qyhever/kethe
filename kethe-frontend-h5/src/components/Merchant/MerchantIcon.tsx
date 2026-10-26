import {
  Store,
  ShoppingCart,
  ShoppingBag,
  Package,
  Globe,
  Gift,
  Tags,
  Building,
} from 'lucide-react'
const icons = {
  store: Store,
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  package: Package,
  globe: Globe,
  gift: Gift,
  tags: Tags,
  building: Building,
}

export function MerchantIcon({
  iconKey,
  size = 24,
}: {
  iconKey?: string | null
  size?: number
}) {
  const Icon = icons[iconKey as keyof typeof icons] ?? Store
  return <Icon size={size} aria-hidden="true" />
}
