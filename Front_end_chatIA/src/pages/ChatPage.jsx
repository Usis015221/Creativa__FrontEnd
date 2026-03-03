import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.jsx';
import ChatSection from '../components/Chatbox/ChatSection';
import Sidebar from '../components/Chatbox/Sidebar';
import '../components/Chatbox/Chatbox.css';
import { getDrafts } from '../services/draftService.js';
import { getChatHistoryByCampaignId } from '../services/chatService.js';
import sessionContext from "../context/SessionContextValue";

function ChatPage() {
    const { draftId } = useParams();
    const { setActiveDraft } = useContext(sessionContext);

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);
    const [briefData, setBriefData] = useState([]);
    const [initialMessages, setInitialMessages] = useState([]);
    const [loadingDraft, setLoadingDraft] = useState(true);
    const [isRegisteredCampaign, setIsRegisteredCampaign] = useState(false);
    const [registeredCampaignId, setRegisteredCampaignId] = useState(null); // 💡 NUEVO: Guarda el ID real de la campaña

    useEffect(() => {
        const loadDraft = async () => {
            if (!draftId) {
                setActiveDraft(null);
                setLoadingDraft(false);
                return;
            }

            setActiveDraft(draftId);

            const drafts = getDrafts() || [];
            const foundDraft = drafts.find(d => d.id === draftId);
            if (foundDraft) {
                if (foundDraft.messages) setInitialMessages(foundDraft.messages);
                if (foundDraft.data) handleBriefData(foundDraft.data);
                setLoadingDraft(false);
                return;
            }

            try {
                const apiChat = await getChatHistoryByCampaignId(draftId);
                if (apiChat && apiChat.length > 0) {
                    const session = apiChat[0];

                    // 💡 EL FIX: Forzamos a que el chat use el ID de la SESIÓN, no el de la campaña
                    setActiveDraft(session.id);

                    if (session.campings_id) {
                        setIsRegisteredCampaign(true);
                        setRegisteredCampaignId(session.campings_id); // Rescatamos la campaña
                    } else if (draftId !== session.id) {
                        setIsRegisteredCampaign(true);
                        setRegisteredCampaignId(draftId);
                    }

                    let messagesToSet = [];
                    if (session.chat && session.chat.message && Array.isArray(session.chat.message)) messagesToSet = session.chat.message;
                    else if (session.chat && Array.isArray(session.chat)) messagesToSet = session.chat;

                    const formattedMessages = messagesToSet.map((msg, index) => {
                        if (msg.sender) return { ...msg, id: msg.id || `msg-${index}` };
                        return {
                            id: `hist-${index}-${Date.now()}`,
                            sender: msg.role === 'model' ? 'bot' : 'user',
                            text: msg.parts?.[0]?.text || ''
                        };
                    }).filter(msg => msg.text);

                    setInitialMessages(formattedMessages);
                    if (session.chat && session.chat.data) handleBriefData(session.chat.data);
                }
            } catch (error) { console.error("Error:", error); }

            setLoadingDraft(false);
        };
        loadDraft();
    }, [draftId, setActiveDraft]);

    useEffect(() => {
        const handleResize = () => setIsSidebarOpen(window.innerWidth > 800);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleBriefData = (newData) => {
        setBriefData((prevBriefData) => {
            const updatedData = [...prevBriefData];
            Object.entries(newData).forEach(([key, value]) => {
                if (value && value !== "") {
                    const existingIndex = updatedData.findIndex(item => item.label === key);
                    if (existingIndex !== -1) updatedData[existingIndex].value = value;
                    else updatedData.push({ label: key, value: value });
                }
            });
            return updatedData;
        });
    };

    if (loadingDraft) return <div className="app-container"><Navbar showAdminLinks={false} /><div>Cargando...</div></div>;

    return (
        <div className="app-container">
            <Navbar showAdminLinks={false} />
            <main className="main-layout">
                <ChatSection onToggleSidebar={toggleSidebar} onBriefData={handleBriefData} initialMessages={initialMessages} />
                {isSidebarOpen && <Sidebar
                    briefData={briefData}
                    className={window.innerWidth <= 800 ? 'open' : ''}
                    onToggle={toggleSidebar}
                    isRegisteredCampaign={isRegisteredCampaign}
                    registeredCampaignId={registeredCampaignId} // 💡 LE PASAMOS EL ID CORRECTO A LA SIDEBAR
                />}
            </main>
        </div>
    );
}

export default ChatPage;