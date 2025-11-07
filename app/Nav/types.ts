export interface NavItem {
  name: string
  href: string
}

export interface NavProps {
  title?: string
  nav?: Record<string, NavItem[]>
}
