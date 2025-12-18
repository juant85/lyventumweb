// src/components/ChatPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useEventData } from '../contexts/EventDataContext';
import { PaperAirplaneIcon, XMarkIcon } from './Icons';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { localeKeys } from '../i18n/locales';

export const ChatPanel: React.FC = () => {
  const {
    isPanelOpen, closeChatPanel, conversations, sendMessage, chatMode,
    activeConversationId, setActiveConversationId, unreadCounts, markConversationAsRead,
    boothDeviceId
  } = useChat();
  const { getBoothById } = useEventData();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationList = Array.from(conversations.keys()).map(bId => {
    const lastMessage = conversations.get(bId)?.slice(-1)[0];
    const booth = getBoothById(bId);
    return {
        boothId: bId,
        boothName: booth ? `${booth.companyName} (${booth.physicalId})` : `Booth ${bId.slice(0, 6)}`,
        lastMessage: lastMessage?.content || t(localeKeys.chatNoMessages),
        timestamp: lastMessage?.createdAt,
        unreadCount: unreadCounts.get(bId) || 0
    };
  }).sort((a,b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId]);
  
  const handleSelectConversation = (boothId: string) => {
    setActiveConversationId(boothId);
    markConversationAsRead(boothId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessage(messageContent);
    setMessageContent('');
  };

  if (!isPanelOpen) return null;

  const currentMessages = activeConversationId ? conversations.get(activeConversationId) || [] : [];
  const activeBooth = activeConversationId ? getBoothById(activeConversationId) : null;
  const activeBoothName = activeBooth 
      ? `${activeBooth.companyName} (${activeBooth.physicalId})` 
      : t(localeKeys.chatSelectConversation);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={closeChatPanel}>
      <div className="flex h-[80vh] w-[90vw] max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Conversation List (Dashboard only) */}
        {chatMode === 'dashboard' && (
          <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex-col hidden md:flex">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-montserrat">{t(localeKeys.chatConversations)}</h2>
            </div>
            <div className="overflow-y-auto flex-grow">
              {conversationList.length > 0 ? conversationList.map(convo => (
                <button key={convo.boothId} onClick={() => handleSelectConversation(convo.boothId)}
                  className={`w-full text-left p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${activeConversationId === convo.boothId ? 'bg-primary-50 dark:bg-primary-900/40' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{convo.boothName}</p>
                    {convo.unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{convo.unreadCount}</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{convo.lastMessage}</p>
                </button>
              )) : <p className="p-4 text-sm text-slate-500">{t(localeKeys.chatNoActiveConversations)}</p>}
            </div>
          </div>
        )}

        {/* Message Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeBoothName || 'Chat'}</h3>
            <button onClick={closeChatPanel} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><XMarkIcon className="w-5 h-5"/></button>
          </div>
          
          <div className="flex-grow p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 space-y-4">
            {!activeConversationId ? (
                 <div className="flex items-center justify-center h-full text-slate-500">{t(localeKeys.chatSelectConversation)}.</div>
            ) : (
                currentMessages.map(msg => {
                    const isMe = msg.senderId === boothDeviceId || (currentUser && msg.senderId === currentUser.id);
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-br-lg' : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-bl-lg'}`}>
                                <p className="text-xs font-bold mb-1 opacity-80">{msg.senderName}</p>
                                <p className="text-sm break-words">{msg.content}</p>
                                <p className="text-[10px] text-right mt-1.5 opacity-70">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                           </div>
                        </div>
                    )
                })
            )}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <input type="text" placeholder={t(localeKeys.chatTypeMessage)} value={messageContent} onChange={e => setMessageContent(e.target.value)}
                className="flex-grow bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!activeConversationId}
              />
              <Button type="submit" variant="primary" className="!rounded-full !p-3" disabled={!activeConversationId || !messageContent.trim()}>
                <PaperAirplaneIcon className="w-5 h-5"/>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};