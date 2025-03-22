
import React, { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, Message } from '@/contexts/ChatContext';
import { Button, TextArea } from 'devextreme-react';
import { MessageSquare, Plus, Send, Menu, LogOut, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const Chat = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { 
    conversations, 
    currentConversation, 
    isLoading, 
    isTyping,
    createConversation, 
    selectConversation, 
    sendMessage,
    deleteConversation
  } = useChat();
  
  const [inputMessage, setInputMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // Auto-hide sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    } else {
      setShowSidebar(true);
    }
  }, [isMobile]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, isTyping]);

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      await sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-20 h-full w-72 bg-sidebar border-r border-sidebar-border 
        transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
          <h1 className="text-xl font-semibold">ChatterAI</h1>
          {isMobile && (
            <Button
              icon="close"
              stylingMode="text"
              onClick={toggleSidebar}
              className="md:hidden"
            />
          )}
        </div>
        
        {/* New Chat Button */}
        <div className="p-4">
          <Button
            icon="plus"
            text="New Chat"
            onClick={createConversation}
            width="100%"
            stylingMode="contained"
          />
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conversation) => (
            <div 
              key={conversation.id}
              className={`conversation-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
              onClick={() => selectConversation(conversation.id)}
            >
              <MessageSquare className="h-5 w-5 text-sidebar-foreground/70" />
              <div className="flex-1 truncate">
                <p className="text-sm">{conversation.title || 'New Chat'}</p>
                {conversation.lastMessage && (
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {conversation.lastMessage}
                  </p>
                )}
              </div>
              <Button
                icon="trash"
                stylingMode="text"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conversation.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium truncate">{user?.username}</span>
            </div>
            <Button
              icon="export"
              stylingMode="text"
              onClick={logout}
              hint="Logout"
            />
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button
              icon="menu"
              stylingMode="text"
              onClick={toggleSidebar}
              className="md:hidden mr-2"
            />
            <h2 className="text-lg font-medium">
              {currentConversation?.title || 'New Chat'}
            </h2>
          </div>
        </header>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {currentConversation?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Start a new conversation</h3>
              <p className="text-muted-foreground max-w-md">
                Ask a question or start a conversation with ChatterAI.
              </p>
            </div>
          ) : (
            currentConversation?.messages.map((message) => (
              <div key={message.id} className="chat-message-container">
                <div
                  className={`chat-message ${
                    message.role === 'user' ? 'chat-message-user' : 'chat-message-ai'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="chat-message-container">
              <div className="typing-indicator">
                <span className="typing-indicator-dot animate-pulse delay-0"></span>
                <span className="typing-indicator-dot animate-pulse delay-150"></span>
                <span className="typing-indicator-dot animate-pulse delay-300"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <div className="border-t border-border p-4">
          <div className="flex items-end space-x-2">
            <TextArea
              value={inputMessage}
              onValueChanged={(e) => setInputMessage(e.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              autoResizeEnabled={true}
              minHeight={40}
              maxHeight={120}
              stylingMode="filled"
              className="flex-1"
            />
            <Button
              icon="send"
              stylingMode="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
