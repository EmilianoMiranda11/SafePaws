function Sidebar({ activeViewId, navigation, onNavigate }) {
  return (
    <aside className="sidebar">
      <a
        aria-label="SafePaws, panel principal"
        className="brand"
        href="#inicio"
        onClick={(event) => {
          event.preventDefault()
          onNavigate('dashboard')
        }}
      >
        <span aria-hidden="true" className="brand-mark">🐾</span>
        <span className="brand-copy">
          <strong>SafePaws</strong>
          <small>Rescate · cuidado · hogar</small>
        </span>
      </a>

      <p className="sidebar-label">MENÚ PRINCIPAL</p>
      <nav aria-label="Navegación principal" className="sidebar-nav">
        {navigation.map((item) => (
          <button
            aria-current={activeViewId === item.id ? 'page' : undefined}
            className={`nav-link${activeViewId === item.id ? ' active' : ''}`}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <span aria-hidden="true" className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-note">
        <span aria-hidden="true">✦</span>
        <p>Cada cuidado abre el camino a un nuevo hogar.</p>
      </div>
    </aside>
  )
}

export default Sidebar
