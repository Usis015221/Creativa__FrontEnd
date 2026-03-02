import React, { useState, useEffect } from 'react';
import './RequestsMailbox.css';
import { Check, X, Calendar } from 'lucide-react';
import FadeIn from '../../components/animations/FadeIn';
import ScalePress from '../../components/animations/ScalePress';
import toast from 'react-hot-toast';
import { getRequests, updateRequestStatus, sendResetLink } from '../../services/adminService';
import { Mail } from 'lucide-react';

const TYPE_LABELS = {
  password: 'Olvidó contraseña',
  email: 'Olvidó correo',
  both: 'Ambos',
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

const ROLE_LABELS = {
  marketing: 'Marketing',
  designer: 'Diseñador',
};

const RequestsMailbox = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getRequests();
      const data = response.data.data;
      setRequests(data);
      if (data.length > 0) {
        setSelectedRequest(data[0]);
        setAdminNotes(data[0].adminNotes || '');
      }
    } catch (error) {
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    try {
      await updateRequestStatus(selectedRequest.id, status, adminNotes);
      toast.success(status === 'accepted' ? 'Solicitud aceptada' : 'Solicitud rechazada');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar solicitud');
    }
  };

  const handleSendResetLink = async () => {
    if (!selectedRequest) return;
    try {
      await sendResetLink(selectedRequest.id);
      toast.success('Link de recuperación enviado al correo del usuario');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar el link');
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => dateStr ? dateStr.slice(0, 10) : '';

  return (
    <FadeIn className="requests-container">
      <div className="requests-card">
        <div className="requests-header">
          <h2>Buzón de solicitudes</h2>
          <p>Revisa y gestiona las solicitudes de recuperación de cuenta</p>
        </div>

        <div className="requests-content">
          {/* Lista de solicitudes */}
          <aside className="requests-list">
            <div className="list-search">
              <input
                type="text"
                placeholder="Buscar solicitudes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="list-filter">
              <select
                className="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="accepted">Aceptadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>

            {loading ? (
              <ul>
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={`skel-${i}`} className="request-item skeleton-item">
                    <span className="skeleton-box skeleton-dot" />
                    <div className="meta">
                      <span className="skeleton-box skeleton-name-line" />
                      <span className="skeleton-box skeleton-type-line" />
                    </div>
                    <span className="skeleton-box skeleton-date-line" />
                  </li>
                ))}
              </ul>
            ) : filteredRequests.length === 0 ? (
              <p>No hay solicitudes</p>
            ) : (
              <ul>
                {filteredRequests.map((request) => (
                  <li
                    key={request.id}
                    className={`request-item${selectedRequest?.id === request.id ? ' selected' : ''}`}
                    onClick={() => handleSelectRequest(request)}
                  >
                    <span className={`status-dot ${request.status}`} title={STATUS_LABELS[request.status]} />
                    <div className="meta">
                      <span className="name">{request.firstName} {request.lastName}</span>
                      <span className="type">{TYPE_LABELS[request.requestType] || request.requestType}</span>
                    </div>
                    <div className="right">
                      <span className="date"><Calendar size={14} /> {formatDate(request.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Panel de detalle */}
          <section className="request-detail">
            {!selectedRequest ? (
              <p style={{ padding: '2rem', textAlign: 'center' }}>Selecciona una solicitud</p>
            ) : (
              <>
                <div className="detail-header">
                  <div>
                    <h3>Solicitud de {selectedRequest.firstName} {selectedRequest.lastName}</h3>
                    <div className="small-meta">
                      <Calendar size={14} /> Enviada: {formatDate(selectedRequest.createdAt)}
                    </div>
                  </div>
                  {selectedRequest.status === 'pending' && (
                    <div className="detail-actions">
                      {(selectedRequest.requestType === 'password' || selectedRequest.requestType === 'both') && (
                        <ScalePress>
                          <button className="reset-btn" onClick={handleSendResetLink}>
                            <Mail size={16} /> Enviar link
                          </button>
                        </ScalePress>
                      )}
                      {selectedRequest.requestType === 'email' && (
                        <ScalePress>
                          <button className="accept-btn" onClick={() => handleUpdateStatus('accepted')}>
                            <Check size={16} /> Aceptar
                          </button>
                        </ScalePress>
                      )}
                      <ScalePress>
                        <button className="reject-btn" onClick={() => handleUpdateStatus('rejected')}>
                          <X size={16} /> Rechazar
                        </button>
                      </ScalePress>
                    </div>
                  )}
                  {selectedRequest.status !== 'pending' && (
                    <span className={`status-badge ${selectedRequest.status}`}>
                      {STATUS_LABELS[selectedRequest.status]}
                    </span>
                  )}
                </div>

                <div className="detail-body">
                  <div className="detail-fields">
                    <div className="detail-field">
                      <span className="field-label">Tipo</span>
                      <span className="field-value">{TYPE_LABELS[selectedRequest.requestType] || selectedRequest.requestType}</span>
                    </div>
                    <div className="detail-field">
                      <span className="field-label">Cuenta</span>
                      <span className="field-value">
                        {selectedRequest.userEmail}
                        {(selectedRequest.requestType === 'password' || selectedRequest.requestType === 'both') && (
                          <span className="email-hint"> — el link se enviará aquí</span>
                        )}
                      </span>
                    </div>
                    <div className="detail-field">
                      <span className="field-label">Rol</span>
                      <span className="field-value">
                        <span className={`rm-role-badge ${selectedRequest.role}`}>
                          {ROLE_LABELS[selectedRequest.role] || selectedRequest.role}
                        </span>
                      </span>
                    </div>
                  </div>

                  {selectedRequest.message && (
                    <div className="detail-field--stacked">
                      <span className="field-label">Mensaje</span>
                      <p className="message">{selectedRequest.message}</p>
                    </div>
                  )}

                  <div className="admin-note">
                    <label>Notas del administrador</label>
                    <textarea
                      placeholder="Agrega observaciones..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      disabled={selectedRequest.status !== 'pending'}
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </FadeIn>
  );
};

export default RequestsMailbox;
