'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { name, repository } from '@/package.json'

import { DEFAULT_NAV } from './constants'
import { DesktopNav } from './DesktopNav'
import { MobileNav } from './MobileNav'
import { NavActions } from './NavActions'
import type { NavProps } from './types'

const DEFAULT_TITLE = name.replace('vercel', '').split('-').join(' ')
const GITHUB_URL = repository.url

export function Nav(props: NavProps) {
  const { title = DEFAULT_TITLE, nav = DEFAULT_NAV } = props
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  return (
    <nav ref={navRef} className="w-full px-4 bg-indigo-500 text-white relative">
      <div className="container-md flex items-stretch justify-start gap-4">
        <h1 className="text-xl font-bold self-center">
          <Link className="whitespace-nowrap capitalize" href="/">
            {title}
          </Link>
        </h1>

        <DesktopNav nav={nav} />

        <div className="ml-auto flex items-center">
          <NavActions githubUrl={GITHUB_URL} isMobileMenuOpen={isMobileMenuOpen} onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </div>
      </div>

      {isMobileMenuOpen && <MobileNav nav={nav} githubUrl={GITHUB_URL} onClose={() => setIsMobileMenuOpen(false)} />}
    </nav>
  )
}
