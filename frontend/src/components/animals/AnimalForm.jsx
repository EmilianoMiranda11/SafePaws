import { useState } from 'react'

const SPECIES = ['Perro', 'Gato', 'Otro']
const SEXES = ['Macho', 'Hembra', 'Desconocido']
const STATUSES = [
  'Rescatado',
  'En Cuarentena',
  'Disponible',
  'En Trámite',
  'Adoptado',
]

function AnimalForm({ animal, loading, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => ({
    nombre: animal?.nombre ?? '',
    especie: animal?.especie ?? '',
    raza: animal?.raza ?? '',
    sexo: animal?.sexo ?? '',
    fecha_nacimiento: animal?.fecha_nacimiento?.slice(0, 10) ?? '',
    descripcion: animal?.descripcion ?? '',
    estado: animal?.estado ?? 'Rescatado',
  }))
  const isEditing = Boolean(animal)

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      ...values,
      raza: values.raza.trim() || null,
      sexo: values.sexo || null,
      fecha_nacimiento: values.fecha_nacimiento || null,
      descripcion: values.descripcion.trim() || null,
    })
  }

  return (
    <section aria-labelledby="animal-form-title" className="animal-form-panel">
      <div className="animal-form-heading">
        <div>
          <p className="eyebrow">{isEditing ? 'Actualizar registro' : 'Nuevo registro'}</p>
          <h3 id="animal-form-title">{isEditing ? 'Editar animal' : 'Registrar animal'}</h3>
        </div>
        <button className="icon-button" onClick={onCancel} type="button" aria-label="Cerrar formulario">
          ×
        </button>
      </div>

      <form className="animal-form" onSubmit={handleSubmit}>
        <label>
          <span className="animal-field-label">Nombre <span aria-hidden="true">*</span></span>
          <input
            autoFocus
            maxLength={100}
            name="nombre"
            onChange={updateField}
            pattern=".*\S.*"
            required
            value={values.nombre}
          />
        </label>

        <label>
          <span className="animal-field-label">Especie <span aria-hidden="true">*</span></span>
          <select name="especie" onChange={updateField} required value={values.especie}>
            <option disabled value="">Selecciona una especie</option>
            {SPECIES.map((species) => <option key={species} value={species}>{species}</option>)}
          </select>
        </label>

        <label>
          Raza
          <input maxLength={80} name="raza" onChange={updateField} value={values.raza} />
        </label>

        <label>
          Sexo
          <select name="sexo" onChange={updateField} value={values.sexo}>
            <option value="">Sin especificar</option>
            {SEXES.map((sex) => <option key={sex} value={sex}>{sex}</option>)}
          </select>
        </label>

        <label>
          Fecha de nacimiento
          <input
            name="fecha_nacimiento"
            onChange={updateField}
            type="date"
            value={values.fecha_nacimiento}
          />
        </label>

        <label>
          Estado
          <select name="estado" onChange={updateField} required value={values.estado}>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className="form-field-wide">
          Descripción
          <textarea
            name="descripcion"
            onChange={updateField}
            rows={3}
            value={values.descripcion}
          />
        </label>

        <p className="form-hint form-field-wide">Los campos marcados con * son obligatorios.</p>
        <div className="form-actions form-field-wide">
          <button className="form-cancel-button" disabled={loading} onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Registrar animal'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AnimalForm
