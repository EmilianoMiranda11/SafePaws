import { useState } from 'react'

function AdoptionRequestForm({ animals, error, loading, onCancel, onSubmit }) {
  const [animalId, setAnimalId] = useState('')
  const [observaciones, setObservaciones] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!animalId) return
    onSubmit({
      animal_id: Number(animalId),
      observaciones: observaciones.trim() || null,
    })
  }

  return (
    <section aria-labelledby="request-form-title" className="request-form-panel">
      <div className="animal-form-heading">
        <div>
          <p className="eyebrow">Adopciones</p>
          <h3 id="request-form-title">Nueva solicitud</h3>
        </div>
        <button
          aria-label="Cerrar formulario"
          className="icon-button"
          disabled={loading}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      {loading && <p className="status-message" role="status">Cargando animales disponibles…</p>}
      {error && <p className="error-message" role="alert">{error}</p>}

      {!loading && !error && animals.length === 0 && (
        <p className="empty-state">No hay animales disponibles para solicitar en este momento.</p>
      )}

      {!error && animals.length > 0 && (
        <form className="request-form" onSubmit={handleSubmit}>
          <label>
            Animal disponible
            <select
              autoFocus
              onChange={(event) => setAnimalId(event.target.value)}
              required
              value={animalId}
            >
              <option disabled value="">Selecciona un animal</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.nombre} · {animal.especie}{animal.raza ? ` · ${animal.raza}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            Observaciones
            <textarea
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Información que quieras compartir con el equipo"
              rows={3}
              value={observaciones}
            />
          </label>

          <p className="form-hint">
            El servidor confirmará la disponibilidad y las reglas de adopción al enviar.
          </p>
          <div className="form-actions">
            <button className="form-cancel-button" disabled={loading} onClick={onCancel} type="button">
              Cerrar
            </button>
            <button
              className="primary-button"
              disabled={loading || !animalId}
              type="submit"
            >
              {loading ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default AdoptionRequestForm
