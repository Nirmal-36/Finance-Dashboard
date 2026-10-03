import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Spinner } from '../ui/Primitives'

export function ProtectedRoute() {
  const { isAuthed, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <Spinner />
      </div>
    )
  }

  if (!isAuthed) return <Navigate to="/login" replace />

  return <Outlet />
}
