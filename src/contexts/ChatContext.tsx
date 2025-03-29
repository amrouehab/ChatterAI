
import React, { createContext, useContext, useState } from "react";
import { Conversation, Message } from "../types";
import { ChatAPI as ChatAPI } from "../lib/api";
import { useToast } from "../hooks/use-toast";

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sendingMessage: boolean;
  getConversations: () => Promise<void>;
  createConversation: () => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  const getConversations = async () => {
    setLoading(true);
    try {
      const conversationsData = await ChatAPI.getConversations();
      setConversations(conversationsData);
      return conversationsData;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    setLoading(true);
    try {
      if(messages.length ==0 && currentConversation!=null){
        return currentConversation;
      }
      const newConversation = await ChatAPI.createConversation("New Conversation");
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);
      return newConversation;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    setLoading(true);
    try {
      const { conversation, messages: conversationMessages } = await ChatAPI.getConversation(id);
      setCurrentConversation(conversation);
      setMessages(conversationMessages);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentConversation) {
      // Create a new conversation if none is selected
      try {
        const newConversation = await createConversation();
        await sendMessageToConversation(newConversation.id, content);
      } catch (error) {
        console.error("Failed to create conversation and send message:", error);
      }
      return;
    }

    await sendMessageToConversation(currentConversation.id, content);
  };

  const sendMessageToConversation = async (conversationId: string, content: string) => {
    setSendingMessage(true);
    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: "temp_" + Date.now(),
        conversationId,
        content,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, userMessage]);
      
      // Send to API and get AI response
      const assistantMessage = await ChatAPI.sendMessage(conversationId, content);
      
      // Add AI response to messages
      setMessages((prev) => [...prev, assistantMessage]);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        loading,
        sendingMessage,
        getConversations,
        createConversation,
        selectConversation,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
