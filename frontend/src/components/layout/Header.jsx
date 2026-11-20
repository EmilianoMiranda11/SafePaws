function Header({ user, onLogout }) {
  const displayName = user.nombre?.trim() || 'Usuario'

  return (
    <header className="app-header">
      <div className="header-welcome">
        <p className="eyebrow">Un hogar empieza con cuidado</p>
        <h1>Hola, {displayName}</h1>
      </div>
      <div className="header-actions">
        <div className="user-role">
          <span aria-hidden="true" className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="user-details">
            <strong>{displayName}</strong>
            <small>{user.rol}</small>
          </span>
        </div>
        <button className="logout-button" onClick={onLogout} type="button">
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

export default Header
