import { useCallback, useEffect, useState } from 'react'
import AnimalCard from '../components/animals/AnimalCard.jsx'
import AnimalForm from '../components/animals/AnimalForm.jsx'
import { ApiError } from '../services/api/http.js'
import {
  createAnimal,
  deleteAnimal,
  getAnimals,
  updateAnimal,
} from '../services/animalService.js'

const MANAGEMENT_ROLES = ['Administrador', 'Veterinario']

async function fetchAnimals() {
  const response = await getAnimals()
  if (!Array.isArray(response?.animales)) {
    throw new Error('La respuesta de animales no tiene el formato esperado.')
  }

  return response.animales
}

function formatApiError(error, operation) {
  if (!(error instanceof ApiError)) {
    return error?.message || `No se pudo completar la operación: ${operation}.`
  }

  if (error.status === 401) {
    return `La sesión no es válida. Inicia sesión nuevamente. ${error.message}`
  }

  if (error.status === 403) {
    return `Tu rol no tiene permiso para ${operation}. ${error.message}`
  }

  if (error.status === 404 && operation === 'eliminar el animal') {
    return `No se pudo eliminar: el animal ya no existe (HTTP 404). ${error.message}`
  }

  if (error.status === 409 && operation === 'eliminar el animal') {
    return `No se pudo eliminar: el animal está adoptado o tiene solicitudes relacionadas (HTTP 409). ${error.message}`
  }

  if (error.status === 400) {
    return `Revisa los datos del formulario (HTTP 400). ${error.message}`
  }

  if (error.status) {
    return `No se pudo ${operation} (HTTP ${error.status}). ${error.message}`
  }

  return error.message
}

function AnimalsPage({ role, viewId }) {
  const [animals, setAnimals] = useState([])
  const [loadError, setLoadError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [formAnimal, setFormAnimal] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const canManage = MANAGEMENT_ROLES.includes(role)
  const canDelete = role === 'Administrador'
  const isCatalog = viewId === 'animals-catalog'

  const loadAnimals = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      setAnimals(await fetchAnimals())
      return true
    } catch (error) {
      setLoadError(formatApiError(error, 'consultar los animales'))
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    fetchAnimals()
      .then((result) => {
        if (active) setAnimals(result)
      })
      .catch((error) => {
        if (active) setLoadError(formatApiError(error, 'consultar los animales'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const formTitle = formAnimal ? 'Editar animal' : 'Registrar animal'

  function openCreateForm() {
    if (!canManage) return
    setOperationError('')
    setNotice('')
    setFormAnimal(null)
    setIsFormOpen(true)
  }

  function openEditForm(animal) {
    if (!canManage) return
    setOperationError('')
    setNotice('')
    setFormAnimal(animal)
    setIsFormOpen(true)
  }

  function closeForm() {
    setFormAnimal(null)
    setIsFormOpen(false)
    setOperationError('')
  }

  async function handleSave(payload) {
    if (!canManage) {
      setOperationError('Tu rol no tiene permiso para registrar o editar animales.')
      return
    }

    setSaving(true)
    setOperationError('')
    setNotice('')

    try {
      if (formAnimal) {
        await updateAnimal(formAnimal.id, payload)
        setNotice('El animal se actualizó correctamente.')
      } else {
        await createAnimal(payload)
        setNotice('El animal se registró correctamente.')
      }

      closeForm()
      await loadAnimals()
    } catch (error) {
      setOperationError(formatApiError(
        error,
        formAnimal ? 'actualizar el animal' : 'registrar el animal',
      ))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(animal) {
    if (!canDelete) {
      setOperationError('Solo un Administrador puede eliminar animales.')
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar a ${animal.nombre}? Esta acción no se puede deshacer.`,
    )
    if (!confirmed) return

    setDeletingId(animal.id)
    setOperationError('')
    setNotice('')

    try {
      await deleteAnimal(animal.id)
      setNotice(`El animal ${animal.nombre} se eliminó correctamente.`)
      await loadAnimals()
    } catch (error) {
      setOperationError(formatApiError(error, 'eliminar el animal'))
    } finally {
      setDeletingId(null)
    }
  }

  const title = isCatalog ? 'Catálogo de animales' : 'Gestión de animales'
  const description = isCatalog
    ? 'Conoce a los animales registrados que buscan cuidado y un hogar.'
    : 'Consulta y administra los registros de animales rescatados.'

  return (
    <section aria-labelledby="animals-title" className="content-card">
      <div className="page-heading animals-page-heading">
        <div>
          <p className="eyebrow">{isCatalog ? 'Catálogo' : 'Animales rescatados'}</p>
          <h2 id="animals-title">{title}</h2>
          <p>{description}</p>
        </div>
        <div className="animals-heading-actions">
          {!loading && !loadError && (
            <span className="count-badge">
              {animals.length} {animals.length === 1 ? 'animal' : 'animales'}
            </span>
          )}
          <button
            className="form-cancel-button refresh-button"
            disabled={loading || saving || deletingId !== null}
            onClick={loadAnimals}
            type="button"
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
          {canManage && !isFormOpen && (
            <button className="primary-button add-animal-button" onClick={openCreateForm} type="button">
              <span aria-hidden="true">＋</span> Registrar animal
            </button>
          )}
        </div>
      </div>

      {notice && <p className="success-message" role="status">{notice}</p>}
      {operationError && <p className="error-message" role="alert">{operationError}</p>}

      {isFormOpen && (
        <AnimalForm
          animal={formAnimal}
          key={formAnimal?.id ?? 'new'}
          loading={saving}
          onCancel={closeForm}
          onSubmit={handleSave}
        />
      )}

      {loadError && (
        <div className="load-error">
          <p className="error-message" role="alert">{loadError}</p>
          <button className="form-cancel-button" disabled={loading} onClick={loadAnimals} type="button">
            Reintentar consulta
          </button>
        </div>
      )}
      {loading && <p className="status-message" role="status">Cargando animales…</p>}
      {!loading && !loadError && animals.length === 0 && (
        <p className="empty-state">No hay animales registrados para mostrar.</p>
      )}
      {!loading && !loadError && animals.length > 0 && (
        <ul className="animal-grid">
          {animals.map((animal) => (
            <AnimalCard
              animal={animal}
              canDelete={canDelete && deletingId !== animal.id}
              canEdit={canManage}
              key={animal.id}
              onDelete={handleDelete}
              onEdit={openEditForm}
            />
          ))}
        </ul>
      )}
      {saving && <p className="status-message" role="status">{formTitle}…</p>}
    </section>
  )
}

export default AnimalsPage
