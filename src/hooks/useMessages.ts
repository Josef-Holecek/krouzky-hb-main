'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  or,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  trainerId: string;
  trainerName: string;
  subject: string;
  message: string;
  read: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  // Fetch all messages (sent and received)
  useEffect(() => {
    if (!db || !userProfile?.uid) {
      setLoading(false);
      return;
    }

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        or(
          where('toUserId', '==', userProfile.uid),
          where('fromUserId', '==', userProfile.uid)
        )
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messagesData: Message[] = [];
          snapshot.forEach((doc) => {
            messagesData.push({
              id: doc.id,
              ...doc.data(),
            } as Message);
          });
          // Sort by createdAt descending on client side
          messagesData.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
          setMessages(messagesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching messages:', err);
          setError('Chyba při načítání zpráv');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up messages listener:', err);
      setError('Chyba při načítání zpráv');
      setLoading(false);
    }
  }, [userProfile?.uid]);

  // Group messages into conversations
  const conversations = useMemo(() => {
    if (!userProfile?.uid) return [];

    const conversationMap = new Map<string, Conversation>();

    messages.forEach((message) => {
      // Determine the other user in the conversation
      const isReceived = message.toUserId === userProfile.uid;
      const otherUserId = isReceived ? message.fromUserId : message.toUserId;
      const otherUserName = isReceived ? message.fromUserName : message.toUserName;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: message.message,
          lastMessageTime: message.createdAt,
          unreadCount: 0,
          messages: [],
        });
      }

      const conversation = conversationMap.get(otherUserId)!;
      conversation.messages.push(message);

      // Update last message if this one is newer
      const currentLastTime = new Date(conversation.lastMessageTime).getTime();
      const messageTime = new Date(message.createdAt).getTime();
      if (messageTime > currentLastTime) {
        conversation.lastMessage = message.message;
        conversation.lastMessageTime = message.createdAt;
      }

      // Count unread messages (only received messages)
      if (isReceived && !message.read) {
        conversation.unreadCount++;
      }
    });

    // Convert to array and sort by last message time
    return Array.from(conversationMap.values()).sort((a, b) => {
      const dateA = new Date(a.lastMessageTime).getTime();
      const dateB = new Date(b.lastMessageTime).getTime();
      return dateB - dateA;
    });
  }, [messages, userProfile?.uid]);

  // Send a message
  const sendMessage = useCallback(
    async (
      toUserId: string,
      toUserName: string,
      trainerId: string,
      trainerName: string,
      subject: string,
      messageText: string
    ) => {
      if (!db || !userProfile) {
        throw new Error('Musíte být přihlášeni pro odeslání zprávy');
      }

      try {
        const messagesRef = collection(db, 'messages');
        const now = new Date().toISOString();

        const docRef = await addDoc(messagesRef, {
          fromUserId: userProfile.uid,
          fromUserName: userProfile.name,
          toUserId,
          toUserName,
          trainerId,
          trainerName,
          subject,
          message: messageText,
          read: false,
          status: 'sent',
          createdAt: now,
          updatedAt: now,
        });

        return { success: true, messageId: docRef.id };
      } catch (err) {
        console.error('Error sending message:', err);
        throw new Error('Chyba při odesílání zprávy');
      }
    },
    [userProfile]
  );

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!db) return;

    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true,
        status: 'read',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error marking message as read:', err);
      throw new Error('Chyba při označování zprávy jako přečtené');
    }
  }, []);

  // Mark all messages in conversation as read
  const markConversationAsRead = useCallback(async (userId: string) => {
    if (!db || !userProfile?.uid) return;

    try {
      const unreadMessages = messages.filter(
        m => m.fromUserId === userId && m.toUserId === userProfile.uid && !m.read
      );

      // Mark as delivered first for sender's messages that haven't been read
      const deliveredMessages = messages.filter(
        m => m.fromUserId === userProfile.uid && m.toUserId === userId && m.status === 'sent'
      );

      await Promise.all([
        ...unreadMessages.map(message => markAsRead(message.id)),
        ...deliveredMessages.map(async (message) => {
          const messageRef = doc(db, 'messages', message.id);
          await updateDoc(messageRef, {
            status: 'delivered',
            updatedAt: new Date().toISOString(),
          });
        })
      ]);
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  }, [messages, userProfile?.uid, markAsRead]);

  // Get unread count
  const unreadCount = useMemo(() => {
    if (!userProfile?.uid) return 0;
    return messages.filter(m => m.toUserId === userProfile.uid && !m.read).length;
  }, [messages, userProfile?.uid]);

  return {
    messages,
    conversations,
    loading,
    error,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    unreadCount,
  };
};
