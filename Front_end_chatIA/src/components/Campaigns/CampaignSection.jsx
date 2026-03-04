import React from 'react';
import Cards from '../Cards/Cards.jsx';
import { FolderClosed } from 'lucide-react';
import '../../layouts/ViewCampaignsMarketing/ViewCampaignsMarketing.css'; // Inherit styles
import { useDesigners } from '../../hooks/useDesigners'; // <--- IMPORTAMOS TU HOOK

const CampaignSection = ({ title, campaigns, statusLabels, onCardClick, emptyMessage }) => {
    // Jalamos la lista de todos los diseñadores disponibles
    const { designers } = useDesigners();

    return (
        <div className="section-container">
            <h3>{title}</h3>
            {campaigns.length > 0 ? (
                <div className='cards-grid'>
                    {campaigns.map((c, i) => {
                        // Magia: Buscamos al diseñador cuyo ID coincida con el designer_id de la campaña
                        const matchedDesigner = designers?.find(d => d.id === c.designer_id);

                        // Si hace match, armamos su nombre. Si no, o si no tiene asignado, ponemos "Diseñador"
                        const designerName = matchedDesigner?.first_name
                            ? `${matchedDesigner.first_name} ${matchedDesigner.last_name || ''}`.trim()
                            : "Diseñador";

                        return (
                            <Cards
                                key={c.id || i}
                                titulo={c.brief_data?.nombre_campaing || "Sin título"}
                                estado={statusLabels[c.status]}
                                fecha={c.brief_data?.fechaPublicacion || "Fecha no disponible"}
                                usuario={designerName}
                                onClick={() => onCardClick(c)}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state-container">
                    <span className="empty-state-icon"><FolderClosed /></span>
                    <p className="empty-state-text">{emptyMessage || "No hay campañas en esta sección"}</p>
                </div>
            )}
        </div>
    );
};

export default CampaignSection;