'use client'

import { useMemo } from 'react'

import { Spinner } from '@/components/Spinner'
import { useClient } from '@/hooks/useClient'
import { supportsMoveAPI } from '@/services/file'

import { IconCheck, IconWarning } from './components/icons'

export function Tooltips() {
  const isClient = useClient()
  const moveAPISupported = useMemo(() => (isClient ? supportsMoveAPI() : false), [isClient])

  if (!isClient) {
    return (
      <div className="mt-2 inline-flex items-center px-3 py-2 bg-cyan-100 text-cyan-800 text-xs font-medium rounded">
        <div className="w-4 h-4 mr-2">
          <Spinner color="text-cyan-600" />
        </div>
        Checking for file system support...
      </div>
    )
  }

  if (moveAPISupported) {
    return (
      <div className="mt-2 inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-xs font-medium rounded">
        <IconCheck className="w-4 h-4 mr-2" />
        Move API supported — processing starts automatically after selecting a folder
      </div>
    )
  }

  return (
    <div className="mt-2 inline-flex items-center px-3 py-2 bg-orange-100 text-orange-800 text-xs font-medium rounded">
      <IconWarning className="w-4 h-4 mr-2" />
      Move API not supported by this browser — cannot proceed
    </div>
  )
}
