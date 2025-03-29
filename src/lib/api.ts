import { User, Conversation, Message } from "../types";
import { toast } from "../hooks/use-toast";

// Base API URL - replace this with your actual backend URL
const API_URL = "http://localhost:3000/api";

// Helper function for making API requests
async function fetchApi(
  endpoint: string,
  method: string = "GET",
  data?: any
): Promise<any> {
  try {
    const token = localStorage.getItem("auth_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong");
    }

    return result;
  } catch (error: any) {
    console.error("API Error:", error);
    toast({
      title: "Error",
      description: error.message || "An error occurred",
      variant: "destructive",
    });
    throw error;
  }
}

// Auth API
export async function login(username: string, password: string): Promise<{ user: User; token: string }> {
  const result = await fetchApi("/auth/login", "POST", { username, password });
  localStorage.setItem("auth_token", result.token);
  return result;
}

export async function signup(username: string, password: string): Promise<{ user: User; token: string }> {
  const result = await fetchApi("/auth/signup", "POST", { username, password });
  localStorage.setItem("auth_token", result.token);
  return result;
}

export async function logout(): Promise<void> {
  localStorage.removeItem("auth_token");
}

// Conversation API
export async function getConversations(): Promise<Conversation[]> {
  return fetchApi("/conversations");
}

export async function createConversation(title: string = "New Conversation"): Promise<Conversation> {
  return fetchApi("/conversations", "POST", { title });
}

export async function getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
  return fetchApi(`/conversations/${id}`);
}

// Messages API
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  return fetchApi(`/conversations/${conversationId}/messages`, "POST", { content });
}

export const ChatAPI = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    return login(username, password);
  },

  signup: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    return signup(username, password);
  },

  getConversations: async (): Promise<Conversation[]> => {
    return getConversations();
  },

  createConversation: async (title: string): Promise<Conversation> => {
    return createConversation(title);
  },

  getConversation: async (id: string): Promise<{ conversation: Conversation; messages: Message[] }> => {
    return getConversation(id);
  },

  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    return sendMessage(conversationId, content);
  }
};
