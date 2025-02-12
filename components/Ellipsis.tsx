import { useInterval } from 'ahooks'
import { useState } from 'react'

export function Ellipsis() {
  const [count, setCount] = useState(0)

  useInterval(
    () => {
      if (count === 3) {
        setCount(0)
        return
      }

      setCount(() => count + 1)
    },
    500,
    { immediate: true }
  )

  return <>{'.'.repeat(count)}</>
}
