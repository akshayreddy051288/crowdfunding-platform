import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getSession } from '../utils/auth'

/** Stable session object so effects do not re-run every render. */
export function useSession() {
  const location = useLocation()
  const [session, setSession] = useState(getSession)

  useEffect(() => {
    const next = getSession()
    setSession(prev => {
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev
      return next
    })
  }, [location.pathname, location.search])

  return session
}
