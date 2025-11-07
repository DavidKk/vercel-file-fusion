import { NavDropdown } from './NavDropdown'
import { NavLink } from './NavLink'
import type { NavItem } from './types'

interface DesktopNavProps {
  nav: Record<string, NavItem[]>
}

export function DesktopNav({ nav }: DesktopNavProps) {
  const navEntries = Object.entries(nav)

  return (
    <div className="hidden md:flex items-stretch gap-2">
      {navEntries.map(([hero, items]) => {
        const isSpecial = hero.startsWith('$')

        if (isSpecial) {
          return <NavLink key={hero} items={items} />
        }

        return <NavDropdown key={hero} hero={hero} items={items} />
      })}
    </div>
  )
}
