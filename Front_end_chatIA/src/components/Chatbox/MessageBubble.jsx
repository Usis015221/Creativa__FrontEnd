import { CircleUser } from 'lucide-react';
import React from 'react';
import ImageUser from '../ImageUser/ImageUser';


import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageBubble = ({ sender, text }) => {
  const isBot = sender === 'bot';
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    let nameUser = user?.firstName || "US";
    let lastName = user?.lastName || " ";
    nameUser = nameUser.substring(0, 1).toUpperCase();
    lastName = lastName.substring(0, 1).toUpperCase();
    let fullName = nameUser + lastName;
  return (
    <div className={`message-row ${isBot ? 'msg-bot' : 'msg-user'}`}>
      {isBot && <div className="">{/*<img src={logoChatbox} alt="Bot" />*/}</div>}
      <div className="bubble markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
      {!isBot && <ImageUser Initials={fullName} name="UserimgMarketingChat" nameContainer="imgUserMarketingChat" />}
      {/* {!isBot && <div className="avatar user-avatar"><CircleUser size={30} /></div>} */}
    </div>
  );
};

export default MessageBubble;
