
import { useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";

const Chat = () => {
  const { messages, sendMessage, sendingMessage } = useChat();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList 
          messages={messages} 
          loading={sendingMessage} 
        />
        <MessageInput 
          onSendMessage={sendMessage} 
          disabled={sendingMessage} 
        />
      </div>
    </div>
  );
};

export default Chat;
