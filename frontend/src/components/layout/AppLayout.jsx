import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

function AppLayout({
  activeViewId,
  children,
  navigation,
  onLogout,
  onNavigate,
  user,
}) {
  return (
    <div className="app-shell">
      <Sidebar
        activeViewId={activeViewId}
        navigation={navigation}
        onNavigate={onNavigate}
      />
      <div className="app-main">
        <Header onLogout={onLogout} user={user} />
        <main className="page-content">{children}</main>
        <footer className="app-footer">
          SafePaws <span aria-hidden="true">·</span> Cuidado con propósito
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
