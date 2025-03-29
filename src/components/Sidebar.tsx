
import { useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, PlusCircle, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar: React.FC = () => {
  const { conversations, getConversations, createConversation, selectConversation, currentConversation } = useChat();
  const { user, logout } = useAuth();

  useEffect(() => {
    getConversations();
  }, []);

  const handleNewChat = async () => {
    const newConversation = await createConversation();
    selectConversation(newConversation.id);
  };

  return (
    <div className="w-64 bg-sidebar flex flex-col h-full p-2">
      <div className="flex items-center gap-2 px-3 py-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-sidebar-foreground">ChatterAI</h1>
      </div>
      
      <Button 
        variant="secondary" 
        className="my-2 gap-2 bg-secondary/80 text-sidebar-foreground"
        onClick={handleNewChat}
      >
        <PlusCircle className="h-4 w-4" />
        New Chat
      </Button>
      
      <Separator className="my-2 bg-sidebar-accent" />
      
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="space-y-1 px-1">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <button
                key={conv.id}
                className={cn(
                  "w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  currentConversation?.id === conv.id
                    ? "bg-accent/50 text-sidebar-foreground"
                    : "text-sidebar-foreground/80 hover:bg-accent/20"
                )}
                onClick={() => selectConversation(conv.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{conv.title}</span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-sidebar-foreground/60">
              No conversations yet
            </div>
          )}
        </div>
      </div>
      
      <Separator className="my-2 bg-sidebar-accent" />
      
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="h-4 w-4 text-sidebar-foreground" />
          </div>
          <span className="text-sm text-sidebar-foreground truncate">
            {user?.username || "User"}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-sidebar-foreground/80 hover:text-sidebar-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
