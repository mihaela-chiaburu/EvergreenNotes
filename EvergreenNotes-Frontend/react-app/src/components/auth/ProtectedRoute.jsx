import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthReady } = useAuth()

  if (!isAuthReady) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
