const STATUS_CLASS = {
  'En Revisión': 'review',
  Aprobada: 'approved',
  Rechazada: 'rejected',
  Cancelada: 'cancelled',
}

function formatDate(value) {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function RequestCard({
  isAdopterView,
  onApprove,
  onCancel,
  onReject,
  processing,
  request,
  role,
}) {
  const isPending = request.estado === 'En Revisión'
  const canProcess = role === 'Administrador' && isPending
  const canCancel = ['Administrador', 'Adoptante'].includes(role) && isPending

  return (
    <li className="request-card">
      <div className="request-card-main">
        <div className="request-animal-icon" aria-hidden="true">🐾</div>
        <div className="request-card-content">
          <div className="request-card-heading">
            <div>
              <p className="request-animal-label">Animal</p>
              <h3>{request.nombre_animal}</h3>
            </div>
            <span className={`request-status status-request-${STATUS_CLASS[request.estado] ?? 'default'}`}>
              {request.estado}
            </span>
          </div>
          <div className="request-meta">
            {!isAdopterView && (
              <span>
                <strong>Adoptante:</strong> {request.nombre_adoptante}
              </span>
            )}
            <span><strong>Solicitada:</strong> {formatDate(request.fecha_solicitud)}</span>
            <span><strong>ID:</strong> #{request.id}</span>
          </div>
          {request.observaciones && (
            <p className="request-observations">{request.observaciones}</p>
          )}
          {(canProcess || canCancel) && (
            <div className="request-actions">
              {canProcess && (
                <>
                  <button
                    className="request-action-button approve-action"
                    disabled={processing}
                    onClick={onApprove}
                    type="button"
                  >
                    {processing ? 'Procesando…' : 'Aprobar'}
                  </button>
                  <button
                    className="request-action-button reject-action"
                    disabled={processing}
                    onClick={onReject}
                    type="button"
                  >
                    Rechazar
                  </button>
                </>
              )}
              {canCancel && (
                <button
                  className="request-action-button cancel-action"
                  disabled={processing}
                  onClick={onCancel}
                  type="button"
                >
                  {processing ? 'Procesando…' : 'Cancelar solicitud'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export default RequestCard
