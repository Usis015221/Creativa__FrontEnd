import React from 'react';
import Cards from '../Cards/Cards.jsx';
import { FolderClosed } from 'lucide-react';
import '../../layouts/ViewCampaignsMarketing/ViewCampaignsMarketing.css'; // Inherit styles

const CampaignSection = ({ title, campaigns, statusLabels, onCardClick, emptyMessage }) => {
    return (
        <div className="section-container">
            <h3>{title}</h3>
            {campaigns.length > 0 ? (
                <div className='cards-grid'>
                    {campaigns.map((c, i) => (
                        <Cards
                            key={c.id || i}
                            titulo={c.brief_data?.nombre_campaing || "Sin título"}
                            estado={statusLabels[c.status]}
                            fecha={c.brief_data?.fechaPublicacion || "Fecha no disponible"}
                            onClick={() => onCardClick(c)}
                        />
                    ))}
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
