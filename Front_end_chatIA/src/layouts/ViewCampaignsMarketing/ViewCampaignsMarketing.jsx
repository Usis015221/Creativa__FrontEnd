import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonAdd from '../../components/ButtonAdd/ButtonAdd.jsx';
import LoadingSpinner from '../../components/animations/LoadingSpinner.jsx';
import { useCampaigns } from '../../hooks/useCampaigns.js';
import { Inbox } from 'lucide-react';
import CampaignFilter from '../../components/Campaigns/CampaignFilter.jsx';
import CampaignFilterCompany from '../../components/Campaigns/CampaignFilterCompany.jsx';
import CampaignSection from '../../components/Campaigns/CampaignSection.jsx';
import './ViewCampaignsMarketing.css';

const SECTIONS_CONFIG = [
    { id: 'chat_draft', label: 'Borradores', title: 'Borradores de Chat' },
    { id: 'draft', label: 'En proceso', title: 'Campañas en proceso' },
    { id: 'approved', label: 'Aprobadas', title: 'Campañas aprobadas' },
    { id: 'rejected', label: 'Rechazadas', title: 'Campañas rechazadas' },
    { id: 'cancelled', label: 'Canceladas', title: 'Campañas canceladas' }
];
const COMPANY_SECTIONS = [
    { id: 'Creativa Studios', label: 'Creativa Studios' },
    { id: 'Visible', label: 'Visible' },
    { id: 'Visible y Creativa Studios', label: 'Creativa Studios y Visible'}
];

const STATUS_LABELS = {
    chat_draft: "Borrador de Chat",
    draft: "En Proceso",
    approved: "Aprobado",
    rejected: "Rechazado",
    cancelled: "Cancelado"
};
const COMPANY_LABELS = {
    Creativa_Studios: "Creativa Studios",
    Visible: "Visible",
    Creativa_Studios_Visible: "Creativa Studios y Visible"
};

function ViewCampaignsMarketing() {
    const { campaigns, loading } = useCampaigns();
    const [activeFilter, setActiveFilter] = useState('all');
    const [activeFilterCompany, setActiveFilterCompany] = useState('all');
    const navigate = useNavigate();
    const sectionCampaignsCompany = ""; // Variable para almacenar campañas filtradas por empresa

    const handleCardClick = (campaign) => {
        // Navigate to chat for both local drafts and API campaigns
        navigate(`/chat/${campaign.id}`);
    };

    const getFilteredSections = () => {
        if (activeFilter === 'all') {
            return SECTIONS_CONFIG;
        }
        return SECTIONS_CONFIG.filter(section => section.id === activeFilter);
    };
    const getFilteredCompany = () => {
        if (activeFilterCompany === 'all') {
            return COMPANY_SECTIONS;
        }
        return COMPANY_SECTIONS.filter(section => section.id === activeFilterCompany);
    };

    if (loading) return (
        <div className="loading-container">
            <LoadingSpinner text="Cargando campañas..." />
        </div>
    );
    function showMessage(){
        if (activeFilter === 'all' && campaigns.length === 0) {
            return (
                <div className="empty-state-container">
                    <span className="empty-state-icon"><Inbox size={48} /></span>
                    <p className="empty-state-text">No hay campañas disponibles.</p>
                </div>
            );
        }else if (activeFilterCompany === 'all' && sectionCampaignsCompany.length === 0) {
            return (
                <div className="empty-state-container">
                    <span className="empty-state-icon"><Inbox size={48} /></span>
                    <p className="empty-state-text">No hay campañas disponibles de esta empresa.</p>
                </div>
            );
        }
    } 

    return (
        <div className='container-ViewCampaignsMarketing'>
            <div className='header-ViewCampaignsMarketing'>
                <ButtonAdd />
                <CampaignFilter
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    sections={SECTIONS_CONFIG}
                />
                <CampaignFilterCompany
                    activeFilter={activeFilterCompany}
                    onFilterChange={setActiveFilterCompany}
                    sections={COMPANY_SECTIONS}
                />
            </div>

            <div className='cards-ViewCampaignsMarketing'>
                {getFilteredSections().map((section, index) => {
                    const name = section
                    const sectionCampaigns = campaigns.filter(c => c.status === section.id);
                    if (activeFilter === 'all' && sectionCampaigns.length === 0) {
                        showMessage();
                        return null;
                    }

                    return (
                        // <div key={section.id}>
                        //     <CampaignSection
                        //         title={section.title}
                        //         campaigns={sectionCampaigns}
                        //         statusLabels={STATUS_LABELS}
                        //         onCardClick={handleCardClick}
                        //     />
                        //     {activeFilter === 'all' && index < SECTIONS_CONFIG.length - 1 && sectionCampaigns.length > 0 && <div className="section-divider"></div>}
                        // </div>
                        getFilteredCompany().map((section, index) => {
                            const sectionCampaignsCompany = sectionCampaigns.filter(c => c.company === section.id);
                            if (activeFilterCompany === 'all' && sectionCampaignsCompany.length === 0) {
                                showMessage();
                                return null;
                            }
                            return (
                                <div key={section.id}>
                                    <CampaignSection
                                        title={name.title + "-" + section.label}
                                        campaigns={sectionCampaignsCompany}
                                        statusLabels={STATUS_LABELS}
                                        onCardClick={handleCardClick}
                                    />
                                    {activeFilterCompany === 'all' && index < COMPANY_SECTIONS.length - 1 && sectionCampaignsCompany.length > 0 && <div className="section-divider"></div>}
                                </div>
                            );
                        })

                    );
                })
                }

            </div>
        </div>
    );
}

export default ViewCampaignsMarketing;