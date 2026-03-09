import { Send, Menu, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * ChatSection - Main chat interface component.
 * Uses the useChatMessages hook for all chat logic.
 * * @param {Function} onToggleSidebar - Callback to toggle sidebar visibility
 * @param {Function} onBriefData - Callback when brief data is received
 * @param {Function} onTypeChange - Callback when chat type changes
 * @param {Array} initialMessages - Initial chat history from parent
 */
const ChatSection = ({ onToggleSidebar, onBriefData, onTypeChange, initialMessages = [] }) => {
  const {
    messages,
    isLoading,
    inputText,
    type,
    handleInputChange,
    sendMessage
  } = useChatMessages(onBriefData, initialMessages);

  const messagesEndRef = useRef(null);

  // --- HOOKS PARA EL BOTÓN DE MARKETING ---
  const navigate = useNavigate();
  const params = useParams();
  
  // ¡LA SOLUCIÓN AQUÍ! Extraemos draftId que es como se llama en tu App.jsx
  const currentCampaignId = params.draftId || params.campaignId || params.id;

  const { user } = useAuth();
  const rawRole = user?.role || user?.user_metadata?.role || '';
  const userRole = String(rawRole).toLowerCase().trim();
  // ----------------------------------------

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Notify parent when type changes
  useEffect(() => {
    if (type && onTypeChange) {
      onTypeChange(type);
    }
  }, [type, onTypeChange]);

  return (
    <section className="chat-section">
      <div className="chat-header-indicator">
        <div className='bot-header'>
          <Sparkles className="bot-icon" size={24} />
          <span>CHAT</span>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          {/* Renderizado condicional: Solo si es marketing o admin */}
          {(userRole === 'marketing' || userRole === 'admin') && currentCampaignId && (
            <button 
              className="btn-ir-generador" 
              onClick={() => navigate(`/designer/workspace/${currentCampaignId}`)}
              title="Abrir Generador de IA"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'var(--color-primary, #6366f1)', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              <ImageIcon size={18} />
              <span>Generador IA</span>
            </button>
          )}

          <button className="toggle-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            <Menu />
          </button>
        </div>
      </div>

      <div className="messages-list">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
        {isLoading ? (
          <div className='message-row msg-bot'>
            <div className='bubble typing-indicator'>
              <Loader2 className="spinner" size={24} />
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={sendMessage}>
        <input
          type="text"
          value={inputText}
          placeholder="Escribe ...."
          onChange={handleInputChange}
          disabled={isLoading}
          aria-label="Escribe tu mensaje"
        />
        <button className="send-btn" type="submit" aria-label="Enviar mensaje">
          <Send />
        </button>
      </form>
    </section>
  );
};

export default ChatSection;