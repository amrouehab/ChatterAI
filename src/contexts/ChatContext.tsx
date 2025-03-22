
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  isTyping: boolean;
  createConversation: () => Promise<void>;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { isAuthenticated, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load conversations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
    }
  }, [isAuthenticated]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      // In a real app, we would fetch from the API
      // For now, let's simulate a response with mock data
      
      // Normally: const response = await axios.get('/api/chat');
      // Simulate API response
      const mockConversations: Conversation[] = Array(5).fill(null).map((_, i) => ({
        id: `conv-${i + 1}`,
        title: i === 0 ? 'New Chat' : `Conversation ${i + 1}`,
        lastMessage: i === 0 ? '' : `This is the last message in conversation ${i + 1}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        messages: i === 0 ? [] : [
          {
            id: `msg-${i}-1`,
            content: `Hello! How can I help you today in conversation ${i + 1}?`,
            role: 'assistant',
            timestamp: new Date(Date.now() - i * 3600000 - 60000).toISOString()
          },
          {
            id: `msg-${i}-2`,
            content: `This is a sample message in conversation ${i + 1}`,
            role: 'user',
            timestamp: new Date(Date.now() - i * 3600000).toISOString()
          }
        ]
      }));
      
      setConversations(mockConversations);
      
      // If we have conversations, set the first one as current
      if (mockConversations.length > 0) {
        setCurrentConversation(mockConversations[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load your conversations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = async () => {
    try {
      // Create a new empty conversation
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        title: 'New Chat',
        lastMessage: '',
        timestamp: new Date().toISOString(),
        messages: []
      };
      
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create a new conversation.",
        variant: "destructive",
      });
    }
  };

  const selectConversation = (id: string) => {
    const selected = conversations.find(conv => conv.id === id) || null;
    setCurrentConversation(selected);
  };

  const sendMessage = async (content: string) => {
    if (!currentConversation) {
      await createConversation();
    }
    
    try {
      // Add user message to the current conversation
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        content,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      
      // Update the current conversation with the new message
      const updatedConversation = {
        ...currentConversation!,
        messages: [...currentConversation!.messages, userMessage],
        lastMessage: content,
        timestamp: userMessage.timestamp
      };
      
      setCurrentConversation(updatedConversation);
      
      // Update the conversations list
      setConversations(conversations.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      ));
      
      // Show typing indicator
      setIsTyping(true);
      
      // In a real app, we'd send the message to the API
      // const response = await axios.post('/api/chat', { message: content });
      
      // Simulate AI response after a delay
      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          content: `This is a simulated response to "${content}" from the AI.`,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        // Update with AI response
        const conversationWithResponse = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, aiMessage],
          lastMessage: aiMessage.content,
          title: updatedConversation.title === 'New Chat' 
            ? content.substring(0, 30) + (content.length > 30 ? '...' : '') 
            : updatedConversation.title,
          timestamp: aiMessage.timestamp
        };
        
        setCurrentConversation(conversationWithResponse);
        
        // Update the conversations list
        setConversations(conversations.map(conv => 
          conv.id === conversationWithResponse.id ? conversationWithResponse : conv
        ));
        
        setIsTyping(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast({
        title: "Message Error",
        description: "Failed to send your message.",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      // In a real app, we would call the API to delete the conversation
      // await axios.delete(`/api/chat/${id}`);
      
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);
      
      // If we deleted the current conversation, set a new current
      if (currentConversation?.id === id) {
        setCurrentConversation(updatedConversations.length > 0 ? updatedConversations[0] : null);
      }
      
      toast({
        title: "Conversation Deleted",
        description: "The conversation has been removed.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete the conversation.",
        variant: "destructive",
      });
    }
  };

  const value = {
    conversations,
    currentConversation,
    isLoading,
    isTyping,
    createConversation,
    selectConversation,
    sendMessage,
    deleteConversation
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
