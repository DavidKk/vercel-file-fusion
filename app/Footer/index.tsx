'use client'

import { useClient } from '@/hooks/useClient'

export default function Footer() {
  const isClient = useClient()

  return (
    <footer className="mt-auto py-6 bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner">
      <div className="mx-auto flex justify-end items-center px-6">
        <div className="text-xs font-medium text-gray-600 tracking-wide">
          {isClient ? (
            <>
              Build Time: <span className="font-mono text-gray-700">{process.env.NEXT_PUBLIC_BUILD_TIME}</span>
            </>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
