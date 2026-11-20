const STATUS_CLASS = {
  Rescatado: 'rescued',
  'En Cuarentena': 'quarantine',
  Disponible: 'available',
  'En Trámite': 'in-progress',
  Adoptado: 'adopted',
}

function AnimalCard({ animal, canDelete, canEdit, onDelete, onEdit }) {
  const details = [
    animal.raza,
    animal.sexo,
    animal.fecha_nacimiento
      ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(
          new Date(`${animal.fecha_nacimiento.slice(0, 10)}T00:00:00`),
        )
      : null,
  ].filter(Boolean)

  return (
    <li className="animal-card">
      <span aria-hidden="true" className="animal-card-icon">
        {animal.especie === 'Gato' ? '🐈' : animal.especie === 'Perro' ? '🐕' : '🐾'}
      </span>
      <div className="animal-card-body">
        <div className="animal-card-title">
          <h3>{animal.nombre}</h3>
          <span className={`animal-status status-${STATUS_CLASS[animal.estado] ?? 'default'}`}>
            {animal.estado}
          </span>
        </div>
        <p className="animal-card-species">{animal.especie}</p>
        {details.length > 0 && <p className="animal-card-details">{details.join(' · ')}</p>}
        {animal.descripcion && <p className="animal-card-description">{animal.descripcion}</p>}
        {(canEdit || canDelete) && (
          <div className="animal-card-actions">
            {canEdit && (
              <button className="text-button" onClick={() => onEdit(animal)} type="button">
                Editar
              </button>
            )}
            {canDelete && (
              <button
                className="text-button danger-button"
                onClick={() => onDelete(animal)}
                type="button"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export default AnimalCard
