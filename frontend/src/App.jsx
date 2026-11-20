import { useEffect, useMemo, useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import LoginForm from './components/common/LoginForm.jsx'
import RegisterForm from './components/common/RegisterForm.jsx'
import {
  canAccessView,
  getDefaultViewForRole,
  getNavigationForRole,
} from './config/navigation.js'
import AnimalsPage from './pages/AnimalsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RequestsPage from './pages/RequestsPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import './styles/layout.css'
import { AUTH_UNAUTHORIZED_EVENT, ApiError } from './services/api/http.js'
import { getCurrentUser } from './services/api/tokenStorage.js'
import { login, logout, registerAdopter } from './services/authService.js'

function App() {
  const [user, setUser] = useState(getCurrentUser)
  const [activeViewId, setActiveViewId] = useState(() =>
    getDefaultViewForRole(getCurrentUser()?.rol),
  )
  const [authError, setAuthError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [authView, setAuthView] = useState('login')
  const [registrationError, setRegistrationError] = useState('')
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState('')
  const navigation = useMemo(() => getNavigationForRole(user?.rol), [user?.rol])

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
      setActiveViewId(null)
      setAuthError(new ApiError('La sesión expiró o dejó de ser válida. Inicia sesión nuevamente.', {
        status: 401,
      }))
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  async function handleLogin(credentials) {
    setLoginLoading(true)
    setAuthError(null)
    try {
      const response = await login(credentials)
      if (getNavigationForRole(response.usuario.rol).length === 0) {
        logout()
        setAuthError(new ApiError('El rol recibido no tiene una navegación configurada.', {
          status: 403,
        }))
        return
      }

      setUser(response.usuario)
      setActiveViewId(getDefaultViewForRole(response.usuario.rol))
    } catch (error) {
      setAuthError(error)
    } finally {
      setLoginLoading(false)
    }
  }

  function showRegistration() {
    setAuthError(null)
    setRegistrationError('')
    setRegistrationSuccess('')
    setAuthView('register')
  }

  function showLogin() {
    setRegistrationError('')
    setRegistrationSuccess('')
    setAuthError(null)
    setAuthView('login')
  }

  async function handleRegistration(details) {
    setRegistrationLoading(true)
    setRegistrationError('')
    setRegistrationSuccess('')

    try {
      const response = await registerAdopter(details)
      setRegistrationSuccess(
        response?.mensaje || 'Tu cuenta de Adoptante se creó correctamente.',
      )
      return true
    } catch (error) {
      setRegistrationError(
        error?.status === 409
          ? 'Ese correo ya está registrado. Inicia sesión o utiliza otro correo.'
          : error?.message || 'No fue posible crear la cuenta. Inténtalo nuevamente.',
      )
      return false
    } finally {
      setRegistrationLoading(false)
    }
  }

  function handleNavigate(viewId) {
    if (!user || !canAccessView(user.rol, viewId)) {
      return
    }

    setActiveViewId(viewId)
  }

  function handleLogout() {
    logout()
    setUser(null)
    setActiveViewId(null)
    setAuthError(null)
  }

  if (!user) {
    if (authView === 'register') {
      return (
        <RegisterForm
          error={registrationError}
          loading={registrationLoading}
          onBackToLogin={showLogin}
          onSubmit={handleRegistration}
          successMessage={registrationSuccess}
        />
      )
    }

    return (
      <LoginForm
        error={authError}
        loading={loginLoading}
        onRegister={showRegistration}
        onSubmit={handleLogin}
      />
    )
  }

  const safeActiveViewId = canAccessView(user.rol, activeViewId)
    ? activeViewId
    : getDefaultViewForRole(user.rol)
  let page

  switch (safeActiveViewId) {
    case 'animals-catalog':
    case 'animals-management':
      page = <AnimalsPage key={safeActiveViewId} role={user.rol} viewId={safeActiveViewId} />
      break
    case 'users-management':
      page = <UsersPage adminId={user.id} role={user.rol} />
      break
    case 'adoption-requests':
      page = <RequestsPage role={user.rol} />
      break
    case 'my-requests':
      page = <RequestsPage isAdopterView role={user.rol} />
      break
    case 'dashboard':
    default:
      page = <DashboardPage role={user.rol} />
  }

  return (
    <AppLayout
      activeViewId={safeActiveViewId}
      navigation={navigation}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      user={user}
    >
      {page}
    </AppLayout>
  )
}

export default App
