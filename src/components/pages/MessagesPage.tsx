'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMessages, type Conversation, type Message } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Mail, Clock, Search, Send, ArrowLeft, Filter, Check, CheckCheck } from 'lucide-react';

const MessagesPageComponent = () => {
  const router = useRouter();
  const { conversations, loading: messagesLoading, error, sendMessage, markConversationAsRead, unreadCount } = useMessages();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread'>('all');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleOpenConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    if (conversation.unreadCount > 0) {
      try {
        await markConversationAsRead(conversation.userId);
      } catch (err) {
        console.error('Error marking conversation as read:', err);
      }
    }
  };

  // Redirect to homepage when user logs out
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  // Update selected conversation when conversations change
  useEffect(() => {
    if (selectedConversation) {
      const updatedConversation = conversations.find(
        (c) => c.userId === selectedConversation.userId
      );
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      }
    }
  }, [conversations, selectedConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages, optimisticMessages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !userProfile) return;

    if (!messageText.trim()) {
      toast({
        title: 'Zpráva je prázdná',
        description: 'Napište nějakou zprávu.',
        variant: 'destructive',
      });
      return;
    }

    const messageToSend = messageText.trim();
    const lastMessage = selectedConversation.messages[0];

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      fromUserId: userProfile.uid,
      fromUserName: userProfile.name,
      toUserId: selectedConversation.userId,
      toUserName: selectedConversation.userName,
      trainerId: lastMessage.trainerId,
      trainerName: lastMessage.trainerName,
      subject: lastMessage.subject || 'Konverzace',
      message: messageToSend,
      read: false,
      status: 'sending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Clear input immediately
    setMessageText('');
    
    // Add optimistic message
    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    // Scroll to bottom after a short delay to ensure the message is rendered
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);

    try {
      setIsSending(true);
      const result = await sendMessage(
        selectedConversation.userId,
        selectedConversation.userName,
        lastMessage.trainerId,
        lastMessage.trainerName,
        lastMessage.subject || 'Konverzace',
        messageToSend
      );

      // Remove optimistic message after successful send
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Mark optimistic message as failed
      setOptimisticMessages(prev => 
        prev.map(m => m.id === optimisticMessage.id ? { ...m, status: 'sending' as const } : m)
      );
      
      toast({
        title: 'Chyba při odesílání',
        description: 'Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.',
        variant: 'destructive',
      });
      
      // Restore the message to input on error
      setMessageText(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.fromUserId !== userProfile?.uid) return null;
    
    const status = message.status || 'sent';
    
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return new Intl.DateTimeFormat('cs-CZ', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } else if (diffInDays === 1) {
      return 'Včera';
    } else if (diffInDays < 7) {
      return new Intl.DateTimeFormat('cs-CZ', {
        weekday: 'short',
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Filter by read status
    if (filterStatus === 'unread') {
      result = result.filter(c => c.unreadCount > 0);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.userName.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query)
      );
    }

    return result;
  }, [conversations, filterStatus, searchQuery]);

  if (authLoading || messagesLoading) {
    return (
      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Načítání zpráv...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <section className="py-12">
        <div className="container max-w-4xl">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-900">{error}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-gradient-to-r from-brand-navy to-brand-teal text-white py-8">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Zprávy</h1>
              <p className="text-white/80">
                {unreadCount > 0
                  ? `Máte ${unreadCount} ${
                      unreadCount === 1 ? 'nepřečtenou zprávu' : 'nepřečtené zprávy'
                    }`
                  : 'Všechny zprávy jsou přečtené'}
              </p>
            </div>
            <MessageSquare className="h-16 w-16 opacity-50" />
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 280px)' }}>
            {/* Conversations List */}
            <div className="md:col-span-1 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-lg">Konverzace</CardTitle>
                  {/* Search and Filter */}
                  <div className="space-y-3 mt-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Hledat konverzace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={(value: 'all' | 'unread') => setFilterStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Všechny</SelectItem>
                        <SelectItem value="unread">Nepřečtené</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <Mail className="h-12 w-12 mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        {conversations.length === 0 
                          ? 'Zatím nemáte žádné konverzace'
                          : 'Žádné konverzace neodpovídají filtru'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.userId}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedConversation?.userId === conversation.userId ? 'bg-muted' : ''
                          } ${conversation.unreadCount > 0 ? 'bg-primary/5' : ''}`}
                          onClick={() => handleOpenConversation(conversation)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="bg-primary text-white">
                                {conversation.userName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-semibold text-sm truncate">
                                  {conversation.userName}
                                </p>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatDate(conversation.lastMessageTime)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {conversation.lastMessage}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center shrink-0">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 h-full">
              {selectedConversation ? (
                <Card className="h-full flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          {selectedConversation.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedConversation.userName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.messages.length} {selectedConversation.messages.length === 1 ? 'zpráva' : 'zpráv'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <div ref={messagesContainerRef} className="overflow-y-auto p-4 space-y-4" style={{ flex: '1 1 0', minHeight: 0 }}>
                    {[...selectedConversation.messages, ...optimisticMessages]
                      .filter(m => 
                        m.fromUserId === userProfile?.uid || 
                        m.toUserId === userProfile?.uid ||
                        m.fromUserId === selectedConversation.userId ||
                        m.toUserId === selectedConversation.userId
                      )
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((message) => {
                        const isOwn = message.fromUserId === userProfile?.uid;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-line break-words">{message.message}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                <span className="text-xs">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                  <span className="ml-1">
                                    {getMessageStatus(message)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-background" style={{ flex: '0 0 auto' }}>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Napište zprávu..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={2}
                        className="resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !messageText.trim()}
                        size="icon"
                        className="shrink-0 h-auto"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Stiskněte Enter pro odeslání, Shift+Enter pro nový řádek
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Vyberte konverzaci</h3>
                    <p className="text-muted-foreground">
                      Klikněte na konverzaci pro zobrazení zpráv
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export function MessagesPage() {
  return <MessagesPageComponent />;
}
