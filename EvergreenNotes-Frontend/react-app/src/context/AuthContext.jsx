import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { clearAuthSession, fetchMe, readAuthSession, saveAuthSession } from "../utils/auth"

const AuthContext = createContext(null)

function mergeSessionWithMe(session, mePayload) {
  return {
    token: session.token,
    id: mePayload?.id ?? session.id,
    email: mePayload?.email ?? session.email ?? "",
    username: mePayload?.username ?? session.username ?? "",
  }
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    const bootstrapAuth = async () => {
      const session = readAuthSession()
      if (!session?.token) {
        setAuthUser(null)
        setIsAuthReady(true)
        return
      }

      try {
        const mePayload = await fetchMe(session.token)
        const nextSession = mergeSessionWithMe(session, mePayload)
        saveAuthSession(nextSession)
        setAuthUser(nextSession)
      } catch {
        clearAuthSession()
        setAuthUser(null)
      } finally {
        setIsAuthReady(true)
      }
    }

    bootstrapAuth()
  }, [])

  const establishSession = async (authPayload) => {
    if (!authPayload?.token) {
      return false
    }

    try {
      const mePayload = await fetchMe(authPayload.token)
      const nextSession = mergeSessionWithMe(authPayload, mePayload)
      saveAuthSession(nextSession)
      setAuthUser(nextSession)
      return true
    } catch {
      clearAuthSession()
      setAuthUser(null)
      return false
    }
  }

  const logout = () => {
    clearAuthSession()
    setAuthUser(null)
  }

  const value = useMemo(
    () => ({
      authUser,
      isAuthenticated: Boolean(authUser?.token),
      isAuthReady,
      establishSession,
      logout,
    }),
    [authUser, isAuthReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.")
  }

  return context
}
