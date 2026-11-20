import { useCallback, useEffect, useState } from 'react'
import AdoptionRequestForm from '../components/requests/AdoptionRequestForm.jsx'
import RequestCard from '../components/requests/RequestCard.jsx'
import { ApiError } from '../services/api/http.js'
import { getAnimals } from '../services/animalService.js'
import {
  cancelAdoptionRequest,
  createAdoptionRequest,
  getAdoptionRequests,
  updateAdoptionRequest,
} from '../services/requestService.js'

function isAuthorizedView(role, isAdopterView) {
  return isAdopterView ? role === 'Adoptante' : role === 'Administrador'
}

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message
  }

  return error?.message || 'Ocurrió un error al comunicarse con el servicio.'
}

async function fetchRequests() {
  const response = await getAdoptionRequests()
  if (!Array.isArray(response?.solicitudes)) {
    throw new Error('La respuesta de solicitudes no tiene el formato esperado.')
  }

  return response.solicitudes
}

function RequestsPage({ isAdopterView = false, role }) {
  const authorized = isAuthorizedView(role, isAdopterView)
  const [requests, setRequests] = useState([])
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(authorized)
  const [loadingAnimals, setLoadingAnimals] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [listError, setListError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [notice, setNotice] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setListError('')

    try {
      const currentRequests = await fetchRequests()
      setRequests(currentRequests)
      return currentRequests
    } catch (error) {
      setListError(getErrorMessage(error))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    if (authorized) {
      fetchRequests()
        .then((result) => {
          if (active) setRequests(result)
        })
        .catch((error) => {
          if (active) setListError(getErrorMessage(error))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }

    return () => {
      active = false
    }
  }, [authorized])

  async function openCreateForm() {
    if (role !== 'Adoptante') return

    setOperationError('')
    setNotice('')
    setFormError('')
    setLoadingAnimals(true)
    setIsFormOpen(true)

    try {
      const response = await getAnimals()
      if (!Array.isArray(response?.animales)) {
        throw new Error('La respuesta de animales no tiene el formato esperado.')
      }

      setAnimals(response.animales.filter((animal) => animal.estado === 'Disponible'))
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setLoadingAnimals(false)
    }
  }

  function closeCreateForm() {
    setIsFormOpen(false)
    setFormError('')
  }

  async function handleCreate({ animal_id, observaciones }) {
    if (role !== 'Adoptante') return

    setProcessingId('create')
    setOperationError('')
    setNotice('')

    try {
      const response = await createAdoptionRequest({ animal_id, observaciones })
      const updatedRequests = await loadRequests()
      setIsFormOpen(false)
      if (updatedRequests) {
        setNotice(response?.mensaje || 'La solicitud se registró correctamente.')
      } else {
        setOperationError(
          'La solicitud se registró correctamente, pero no se pudo actualizar la lista. Intenta actualizarla.',
        )
      }
    } catch (error) {
      setOperationError(getErrorMessage(error))
    } finally {
      setProcessingId(null)
    }
  }

  async function handleDecision(request, estado) {
    if (role !== 'Administrador' || request.estado !== 'En Revisión') return

    const previousRequests = requests
    setProcessingId(request.id)
    setOperationError('')
    setNotice('')

    try {
      const response = await updateAdoptionRequest(request.id, { estado })
      const updatedRequests = await loadRequests()

      if (!updatedRequests) {
        setOperationError(
          `${response?.mensaje || 'La solicitud se actualizó correctamente'}, pero no se pudo actualizar la lista.`,
        )
        return
      }

      if (estado === 'Aprobada') {
        const automaticallyCancelled = updatedRequests.filter((updatedRequest) => {
          const previousRequest = previousRequests.find(
            (item) => item.id === updatedRequest.id,
          )

          return (
            previousRequest?.estado === 'En Revisión' &&
            updatedRequest.estado === 'Cancelada' &&
            updatedRequest.animal_id === request.animal_id &&
            updatedRequest.id !== request.id
          )
        })

        const cancellationSummary = automaticallyCancelled.length
          ? ` El backend canceló automáticamente otras solicitudes del mismo animal: ${automaticallyCancelled
              .map((item) => item.nombre_adoptante || `solicitud #${item.id}`)
              .join(', ')}.`
          : ''
        setNotice(`${response?.mensaje || 'Solicitud aprobada correctamente.'}${cancellationSummary}`)
      } else {
        setNotice(response?.mensaje || 'Solicitud rechazada correctamente.')
      }
    } catch (error) {
      setOperationError(getErrorMessage(error))
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCancel(request) {
    if (
      !['Administrador', 'Adoptante'].includes(role) ||
      request.estado !== 'En Revisión'
    ) {
      return
    }

    const confirmed = window.confirm(
      `¿Cancelar la solicitud de ${request.nombre_animal}?`,
    )
    if (!confirmed) return

    setProcessingId(request.id)
    setOperationError('')
    setNotice('')

    try {
      const response = await cancelAdoptionRequest(request.id)
      const updatedRequests = await loadRequests()

      if (updatedRequests) {
        setNotice(response?.mensaje || 'La solicitud se canceló correctamente.')
      } else {
        setOperationError(
          'La solicitud se canceló correctamente, pero no se pudo actualizar la lista. Intenta actualizarla.',
        )
      }
    } catch (error) {
      setOperationError(getErrorMessage(error))
    } finally {
      setProcessingId(null)
    }
  }

  if (!authorized) {
    return (
      <section aria-labelledby="requests-title" className="content-card">
        <p className="eyebrow">Acceso restringido</p>
        <h2 id="requests-title">Solicitudes de adopción</h2>
        <p className="error-message" role="alert">
          Este módulo está disponible únicamente para Administradores y Adoptantes.
        </p>
      </section>
    )
  }

  const title = isAdopterView ? 'Mis solicitudes de adopción' : 'Solicitudes de adopción'

  return (
    <section aria-labelledby="requests-title" className="content-card">
      <div className="page-heading requests-page-heading">
        <div>
          <p className="eyebrow">Adopciones</p>
          <h2 id="requests-title">{title}</h2>
          <p>
            {isAdopterView
              ? 'Consulta el estado de tus solicitudes y explora animales disponibles.'
              : 'Revisa las solicitudes recibidas y gestiona las que siguen en revisión.'}
          </p>
        </div>
        <div className="requests-heading-actions">
          {!loading && !listError && (
            <span className="count-badge">
              {requests.length} {requests.length === 1 ? 'solicitud' : 'solicitudes'}
            </span>
          )}
          <button
            className="form-cancel-button"
            disabled={loading || processingId !== null}
            onClick={loadRequests}
            type="button"
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
          {isAdopterView && !isFormOpen && (
            <button
              className="primary-button request-create-button"
              disabled={processingId !== null}
              onClick={openCreateForm}
              type="button"
            >
              Nueva solicitud
            </button>
          )}
        </div>
      </div>

      {notice && <p className="success-message" role="status">{notice}</p>}
      {operationError && <p className="error-message" role="alert">{operationError}</p>}

      {isFormOpen && (
        <AdoptionRequestForm
          animals={animals}
          error={formError}
          loading={loadingAnimals || processingId === 'create'}
          onCancel={closeCreateForm}
          onSubmit={handleCreate}
        />
      )}

      {listError && (
        <div className="load-error">
          <p className="error-message" role="alert">{listError}</p>
          <button
            className="form-cancel-button"
            disabled={loading}
            onClick={loadRequests}
            type="button"
          >
            Reintentar consulta
          </button>
        </div>
      )}
      {loading && <p className="status-message" role="status">Cargando solicitudes…</p>}
      {!loading && !listError && requests.length === 0 && (
        <p className="empty-state">
          {isAdopterView
            ? 'Aún no tienes solicitudes de adopción.'
            : 'No hay solicitudes registradas.'}
        </p>
      )}
      {!loading && !listError && requests.length > 0 && (
        <ul className="request-list">
          {requests.map((request) => (
            <RequestCard
              isAdopterView={isAdopterView}
              key={request.id}
              onApprove={() => handleDecision(request, 'Aprobada')}
              onCancel={() => handleCancel(request)}
              onReject={() => handleDecision(request, 'Rechazada')}
              processing={processingId === request.id}
              request={request}
              role={role}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default RequestsPage
