const dashboardMessages = {
  Administrador: {
    title: 'Un espacio para coordinar el cuidado',
    description: 'Desde aquí puedes acceder a las herramientas de gestión de SafePaws.',
  },
  Veterinario: {
    title: 'El bienestar comienza con una buena atención',
    description: 'Consulta y acompaña el cuidado de los animales rescatados.',
  },
  Adoptante: {
    title: 'Cada encuentro puede cambiar una vida',
    description: 'Explora los animales y da seguimiento a tus solicitudes de adopción.',
  },
}

function DashboardPage({ role }) {
  const message = dashboardMessages[role] ?? {
    title: 'Bienvenido a SafePaws',
    description: 'Tu espacio de cuidado y bienestar animal.',
  }

  return (
    <section aria-labelledby="dashboard-title" className="welcome-panel">
      <div className="welcome-copy">
        <p className="eyebrow">Panel principal</p>
        <h2 id="dashboard-title">{message.title}</h2>
        <p>{message.description}</p>
      </div>
      <div aria-hidden="true" className="welcome-art">
        <span>🐕</span>
        <span>🐈</span>
        <i />
      </div>
    </section>
  )
}

export default DashboardPage
