// src/contexts/ChatContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useSelectedEvent } from './SelectedEventContext';
import { useAuth } from './AuthContext';
import { useEventData } from './EventDataContext';
import { Message } from '../types';
import { Database } from '../database.types';
import { toast } from 'react-hot-toast';
import { ChatBubbleLeftRightIcon } from '../components/Icons';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ConversationMap = Map<string, Message[]>;
type ChatMode = 'dashboard' | 'booth' | 'attendee';

interface OpenPanelOptions {
    boothId: string;
    deviceId?: string;
    isAttendee?: boolean;
}

interface ChatContextType {
  conversations: ConversationMap;
  unreadCounts: Map<string, number>;
  totalUnreadCount: number;
  isPanelOpen: boolean;
  chatMode: ChatMode;
  activeConversationId: string | null;
  boothDeviceId: string | null;
  openChatPanel: (options?: OpenPanelOptions) => void;
  closeChatPanel: () => void;
  setActiveConversationId: (boothId: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  markConversationAsRead: (boothId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
type MessageRow = Database['public']['Tables']['messages']['Row'];

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedEventId } = useSelectedEvent();
  const { currentUser } = useAuth();
  const { getBoothById } = useEventData();

  const [conversations, setConversations] = useState<ConversationMap>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('dashboard');
  const [boothDeviceId, setBoothDeviceId] = useState<string | null>(null);

  const chatChannelRef = useRef<RealtimeChannel | null>(null);
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const markConversationAsRead = useCallback(async (boothId: string) => {
    setUnreadCounts(prev => {
        if (!prev.has(boothId) || prev.get(boothId) === 0) return prev;
        const newMap = new Map(prev);
        newMap.set(boothId, 0);
        return newMap;
    });
    
    const payload: Database['public']['Tables']['messages']['Update'] = { is_read: true };
    await (supabase.from('messages') as any)
        .update(payload)
        .eq('event_id', selectedEventId)
        .eq('booth_id', boothId)
        .eq('is_read', false);
  }, [selectedEventId]);

  const openChatPanel = useCallback((options?: OpenPanelOptions) => {
    if (options) {
        setActiveConversationId(options.boothId);
        markConversationAsRead(options.boothId);
        if (options.deviceId) {
            setChatMode('booth');
            setBoothDeviceId(options.deviceId);
        } else if (options.isAttendee) {
            setChatMode('attendee');
            setBoothDeviceId(null);
        }
    } else {
        setChatMode('dashboard');
    }
    setIsPanelOpen(true);
  }, [markConversationAsRead]);

  // This ref holds ALL dependencies needed by the message handler.
  const handlerDependencies = useRef({
    isPanelOpen,
    activeConversationId,
    currentUser,
    boothDeviceId,
    chatMode,
    getBoothById,
    openChatPanel,
    markConversationAsRead,
    setConversations,
    setUnreadCounts,
    chatAudioRef,
    setActiveConversationId
  });

  // Keep the ref updated with the latest state and functions
  useEffect(() => {
    handlerDependencies.current = {
      isPanelOpen,
      activeConversationId,
      currentUser,
      boothDeviceId,
      chatMode,
      getBoothById,
      openChatPanel,
      markConversationAsRead,
      setConversations,
      setUnreadCounts,
      chatAudioRef,
      setActiveConversationId
    };
  }, [
    isPanelOpen, activeConversationId, currentUser, boothDeviceId, chatMode,
    getBoothById, openChatPanel, markConversationAsRead, setConversations, setUnreadCounts, setActiveConversationId
  ]);

  useEffect(() => {
    if (typeof Audio !== "undefined") {
      chatAudioRef.current = new Audio('/sounds/message.mp3');
      chatAudioRef.current.load();
    }
  }, []);

  const handleNewMessage = useCallback((payload: RealtimePostgresChangesPayload<MessageRow>) => {
        const deps = handlerDependencies.current;

        if (payload.eventType !== 'INSERT' || !payload.new) return;
        const newMessageRow = payload.new;
        const message: Message = {
            id: newMessageRow.id,
            eventId: newMessageRow.event_id,
            boothId: newMessageRow.booth_id,
            senderId: newMessageRow.sender_id,
            senderName: newMessageRow.sender_name,
            senderType: newMessageRow.sender_type as Message['senderType'],
            content: newMessageRow.content,
            isRead: newMessageRow.is_read,
            createdAt: newMessageRow.created_at,
        };

        deps.setConversations(prev => {
            const newMap = new Map(prev);
            const currentConvo: Message[] = newMap.get(message.boothId) || [];
            if (currentConvo.some(m => m.id === message.id)) return prev; // Already have this message
            
            const updatedConvo = [...currentConvo, message].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            newMap.set(message.boothId, updatedConvo);
            return newMap;
        });
        
        const isFromSupervisor = message.senderType === 'supervisor';
        const isFromAttendee = message.senderType === 'attendee';
        const isOwnMessage = (isFromSupervisor && message.senderId === deps.currentUser?.id) ||
                             (isFromAttendee && message.senderId === deps.currentUser?.id) ||
                             (!isFromSupervisor && !isFromAttendee && message.senderId === deps.boothDeviceId);
        
        if (!isOwnMessage && (!deps.isPanelOpen || deps.activeConversationId !== message.boothId)) {
            deps.setUnreadCounts(prev => new Map(prev).set(message.boothId, (prev.get(message.boothId) || 0) + 1));
            
            deps.chatAudioRef.current?.play().catch(e => console.warn("Chat audio playback failed.", e));
            
            const booth = deps.getBoothById(message.boothId);
            const senderName = isFromSupervisor ? 'Supervisor' : message.senderName;
            
            toast.custom(
                (t) => (
                    <div
                      className={`${
                        t.visible ? 'animate-enter' : 'animate-leave'
                      } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10`}
                    >
                      <div className="flex-1 w-0 p-4 cursor-pointer" onClick={() => {
                          if (handlerDependencies.current.chatMode === 'dashboard') {
                            deps.openChatPanel();
                            deps.setActiveConversationId(message.boothId);
                            deps.markConversationAsRead(message.boothId);
                          }
                          toast.dismiss(t.id);
                      }}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <div className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/50 flex items-center justify-center">
                               <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{senderName}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{message.content}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-l border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                ),
                { duration: 8000 }
            );
        }
  }, []); // Empty dependency array is correct because all dependencies are read from the ref.

  const fetchInitialMessages = useCallback(async () => {
    if (!selectedEventId) {
      setConversations(new Map());
      return;
    }
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('event_id', selectedEventId)
      .order('created_at', { ascending: true })
      .returns<MessageRow[]>();

    if (error) {
      console.error("Chat Error: Failed to fetch messages", error);
      return;
    }
    
    const newConversations: ConversationMap = new Map();
    if (data) {
        for (const msg of data) {
            const message: Message = {
                id: msg.id,
                eventId: msg.event_id,
                boothId: msg.booth_id,
                senderId: msg.sender_id,
                senderName: msg.sender_name,
                senderType: msg.sender_type as Message['senderType'],
                content: msg.content,
                isRead: msg.is_read,
                createdAt: msg.created_at,
            };
          if (!newConversations.has(message.boothId)) {
            newConversations.set(message.boothId, []);
          }
          newConversations.get(message.boothId)!.push(message);
        }
    }

    setConversations(newConversations);
  }, [selectedEventId]);

  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  useEffect(() => {
    if (!selectedEventId) {
        if (chatChannelRef.current) {
            supabase.removeChannel(chatChannelRef.current);
            chatChannelRef.current = null;
        }
        return;
    }
    
    const channelName = `chat-messages-${selectedEventId}`;
    if (chatChannelRef.current?.topic === channelName) return;

    if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);

    chatChannelRef.current = supabase.channel(channelName, { config: { broadcast: { self: true } } });
    
    chatChannelRef.current
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `event_id=eq.${selectedEventId}` }, handleNewMessage)
        .subscribe((status: string, err: any) => {
            if (status === 'SUBSCRIBED') console.log(`ChatContext: Subscribed to Realtime for event '${selectedEventId}'`);
            if (err) console.error('Chat subscription error:', err);
        });

    return () => {
        if (chatChannelRef.current) {
            supabase.removeChannel(chatChannelRef.current);
            chatChannelRef.current = null;
        }
    };
  }, [selectedEventId, handleNewMessage]);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedEventId || !content.trim() || !activeConversationId) return;

    let senderId: string, senderName: string, senderType: 'supervisor' | 'booth' | 'attendee';
    
    // Read from ref to get latest state inside callback
    const deps = handlerDependencies.current;

    if (deps.chatMode === 'dashboard' && deps.currentUser) {
        senderType = 'supervisor';
        senderId = deps.currentUser.id;
        senderName = deps.currentUser.username;
    } else if (deps.chatMode === 'booth' && deps.boothDeviceId) {
        senderType = 'booth';
        senderId = deps.boothDeviceId;
        const booth = deps.getBoothById(activeConversationId);
        senderName = booth ? `${booth.companyName} (${booth.physicalId})` : `Booth ${activeConversationId.slice(0, 6)}`;
    } else if (deps.chatMode === 'attendee' && deps.currentUser) {
        senderType = 'attendee';
        senderId = deps.currentUser.id;
        senderName = deps.currentUser.username;
    } else {
        toast.error("Cannot send message: invalid user or device state.");
        return;
    }

    const messagePayload: Database['public']['Tables']['messages']['Insert'] = {
      event_id: selectedEventId,
      booth_id: activeConversationId,
      content: content.trim(),
      sender_id: senderId,
      sender_name: senderName,
      sender_type: senderType,
      is_read: false
    };

    const { error } = await (supabase.from('messages') as any).insert([messagePayload]);
    if (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message.");
    }
  }, [selectedEventId, activeConversationId]);

  const closeChatPanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const totalUnreadCount = Array.from(unreadCounts.values()).reduce((sum: number, count: number) => sum + count, 0);

  const contextValue = useMemo(() => ({
      conversations,
      unreadCounts,
      totalUnreadCount,
      isPanelOpen,
      chatMode,
      activeConversationId,
      boothDeviceId,
      openChatPanel,
      closeChatPanel,
      setActiveConversationId,
      sendMessage,
      markConversationAsRead
    }), [
      conversations, unreadCounts, totalUnreadCount, isPanelOpen, chatMode, activeConversationId, boothDeviceId,
      openChatPanel, closeChatPanel, setActiveConversationId, sendMessage, markConversationAsRead
    ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
