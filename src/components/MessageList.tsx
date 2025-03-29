
import { useEffect, useRef } from "react";
import { Message } from "../types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of message list when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h3 className="mb-2 text-xl font-medium">Welcome to ChatterAI</h3>
          <p className="text-muted-foreground">
            Start a conversation by typing a message below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message) => (
        <div 
          key={message.id}
          className={cn(
            "flex gap-3 p-4 rounded-lg",
            message.role === "user" 
              ? "bg-chat-user" 
              : "bg-chat-assistant border border-muted"
          )}
        >
          <Avatar className={cn(
            "h-8 w-8 rounded-md",
            message.role === "user" ? "bg-primary" : "bg-secondary"
          )}>
            {message.role === "user" ? (
              <User className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Bot className="h-5 w-5 text-secondary-foreground" />
            )}
          </Avatar>
          
          <div className="flex-1 overflow-hidden">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex gap-3 p-4 rounded-lg bg-chat-assistant border border-muted animate-pulse">
          <Avatar className="h-8 w-8 rounded-md bg-secondary">
            <Bot className="h-5 w-5 text-secondary-foreground" />
          </Avatar>
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
