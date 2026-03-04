import React, { useState, useMemo, useCallback, useContext } from 'react';
import toast from 'react-hot-toast';
import { Rocket, Search, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendCampaign } from '../../services/designerService';
import { useDesigners } from '../../hooks/useDesigners';
import { useUser } from '../../hooks/useUser';
import { getTranslatedLabel, validateCampaignData, formatBriefData } from '../../config/campaignConfig';
import { deleteDraft } from '../../services/draftService';
import { updateChatSession } from '../../services/chatService';
import sessionContext from "../../context/SessionContextValue";

// 💡 Recibimos el registeredCampaignId
const Sidebar = ({ className, onToggle, briefData = [], isRegisteredCampaign, registeredCampaignId }) => {
  const summaryData = useMemo(() => Array.isArray(briefData) ? briefData : [], [briefData]);
  const { designers } = useDesigners();
  const user = useUser();
  const { activeDraft, setActiveDraft } = useContext(sessionContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesigner, setSelectedDesigner] = useState(null);
  const navigate = useNavigate();

  const filteredDesigners = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return designers.filter((d) => d.first_name.toLowerCase().includes(term) || d.last_name.toLowerCase().includes(term));
  }, [designers, searchTerm]);

  const handleSendCampaign = useCallback(async () => {
    const missingFields = validateCampaignData(summaryData);
    if (missingFields.length === 0 && selectedDesigner && user) {
      try {
        const campaign = {
          user_id: user.id,
          briefData: formatBriefData(summaryData),
          designer_id: selectedDesigner.id,
          // 💡 EL FIX FINAL: Le mandamos a tu controlador el ID real de la campaña, NO el del chat
          idCampaing: isRegisteredCampaign ? registeredCampaignId : undefined
        };

        const response = await sendCampaign(campaign);
        const responseData = response?.data?.data || response?.data;

        if (response?.status === 200 || response?.status === 201 || responseData) {
          try {
            const newCampaignId = responseData?.id || responseData?.id_campaing || responseData?.campings_id || registeredCampaignId;
            if (newCampaignId && activeDraft) {
              // Aquí sí usamos el activeDraft porque es el ID del Chat
              await updateChatSession(activeDraft, { userId: user.id, campings_id: newCampaignId });
            }
          } catch (error) { }

          deleteDraft(activeDraft);
          setActiveDraft(null);

          toast.success(isRegisteredCampaign ? "¡Campaña actualizada y reenviada!" : "¡Campaña enviada con éxito!", {
            icon: <div style={{ minWidth: '28px' }}><Rocket size={28} color="var(--color-success)" /></div>
          });

          setTimeout(() => navigate('/'), 1500);
        }
      } catch (e) {
        toast.error("Error al enviar.");
      }
    } else {
      if (!selectedDesigner) toast.error('Seleccione un diseñador.');
      else toast.error(`Faltan datos obligatorios en el chat.`);
    }
  }, [summaryData, selectedDesigner, user, activeDraft, navigate, setActiveDraft, isRegisteredCampaign, registeredCampaignId]);

  return (
    <aside className={`sidebar ${className}`}>
      <div className="sidebar-header">
        <Rocket /> <h3 className='sidebar-h3'>Resumen de Campaña</h3>
        <button className="close-sidebar-btn" onClick={onToggle}><X /></button>
      </div>

      <div className="summary-list">
        {summaryData.length > 0 ? (
          summaryData.map((item, index) => (
            <div key={index} className="summary-item">
              <span className="summary-label">{getTranslatedLabel(item.label)}</span>
              <span className="summary-value">{item.value}</span>
            </div>
          ))
        ) : (
          <div className="empty-message"><p>Conversa con el asistente para completar los datos</p></div>
        )}
      </div>

      <div className="search-bar">
        <span className="icon"><Search /></span>
        <input type="text" placeholder="Buscar diseñador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className='box-users'>
        {filteredDesigners.map((d) => {
          // Sacamos la inicial de cada diseñador en la lista
          const initial = d.first_name ? d.first_name.charAt(0).toUpperCase() : 'D';

          return (
            <div className={`user-card ${selectedDesigner?.id === d.id ? 'selected' : ''}`} key={d.id} onClick={() => setSelectedDesigner(d)}>
              {/* AVATAR ESTILO WHATSAPP PARA LA LISTA */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#00a884',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                flexShrink: 0 // Evita que el círculo se aplaste si hay poco espacio
              }} className="card-avatar">
                {initial}
              </div>
              <div className="user-info"><h4>{d.first_name} {d.last_name}</h4><p>Diseñador</p></div>
            </div>
          );
        })}
      </div>

      <div className="send-action-area">
        <label>{isRegisteredCampaign ? "Reasignar/Reenviar a:" : "Enviar campaña a:"}</label>
        <div className="recipient-tag">
          {selectedDesigner ? (
            <>
              {/* AVATAR ESTILO WHATSAPP PARA EL DISEÑADOR SELECCIONADO */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#00a884',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                marginRight: '8px'
              }}>
                {selectedDesigner.first_name ? selectedDesigner.first_name.charAt(0).toUpperCase() : 'D'}
              </div>
              <span>{selectedDesigner.first_name} {selectedDesigner.last_name}</span>
              <button className="close-tag" onClick={() => setSelectedDesigner(null)}><X size={14} /></button>
            </>
          ) : (
            <p>No hay diseñador seleccionado</p>
          )}
        </div>
        <button className="main-cta-btn" onClick={handleSendCampaign}>
          {isRegisteredCampaign ? "Actualizar Campaña" : "Enviar"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;