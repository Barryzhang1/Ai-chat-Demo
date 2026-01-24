import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, children }) => {
  return (
    <div
      className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
    >
      <div className="message-content">{message.content}</div>
      {children}
    </div>
  );
};

export default MessageBubble;
