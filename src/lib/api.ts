
import { User, Conversation, Message } from "../types";
import { toast } from "../hooks/use-toast";
import { GoogleGenAI } from "@google/genai";

// Base API URL - this would be replaced with your actual backend URL
const API_URL = "http://localhost:3000/api";
const ai = new GoogleGenAI({ apiKey: "AIzaSyAiLZIFlmBF3iJX_z6WG6bbX0581HzouLQ" });

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

// For demonstration, we'll simulate the API responses
// This would be removed in a real application with a backend
export const ChatAPI = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simple validation
    if (!username || !password) {
      throw new Error("Username and password are required");
    }
    
    // In a real app, this would check against the database
    if (password.length < 6) {
      throw new Error("Invalid username or password");
    }
    
    // Create a fake user and token
    const user = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      username
    };
    
    const token = "fake_token_" + Math.random().toString(36).substring(2, 15);
    
    return { user, token };
  },
  
  signup: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simple validation
    if (!username || !password) {
      throw new Error("Username and password are required");
    }
    
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    
    // Create a fake user and token
    const user = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      username
    };
    
    const token = "fake_token_" + Math.random().toString(36).substring(2, 15);
    
    return { user, token };
  },
  
  getConversations: async (): Promise<Conversation[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: "conv_1",
        userId: "user_1",
        title: "About AI ethics",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "conv_2",
        userId: "user_1",
        title: "Learning JavaScript",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "conv_3",
        userId: "user_1",
        title: "Travel recommendations",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },
  
  createConversation: async (title: string): Promise<Conversation> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      id: "conv_" + Math.random().toString(36).substring(2, 9),
      userId: "user_1",
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  
  getConversation: async (id: string): Promise<{ conversation: Conversation; messages: Message[] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let messages: Message[] = [];
    let title = "New Conversation";
    
    switch (id) {
      case "conv_1":
        title = "About AI ethics";
        messages = [
          {
            id: "msg_1",
            conversationId: id,
            content: "What are the main ethical concerns with AI development?",
            role: "user",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "msg_2",
            conversationId: id,
            content: "The main ethical concerns with AI development include issues of privacy, bias and fairness, transparency, accountability, job displacement, security, and autonomy. AI systems often require vast amounts of data, raising privacy concerns. They can perpetuate or amplify existing biases in data. Many AI systems operate as 'black boxes,' making it difficult to understand their decisions. As AI systems become more autonomous, questions arise about who is responsible for their actions. There are concerns about AI replacing human jobs. Powerful AI tools could be misused or have unintended consequences. And as AI systems become more advanced, questions about the appropriate level of autonomy for AI become increasingly important.",
            role: "assistant",
            createdAt: new Date(Date.now() - 3580000).toISOString(),
          }
        ];
        break;
      case "conv_2":
        title = "Learning JavaScript";
        messages = [
          {
            id: "msg_3",
            conversationId: id,
            content: "What's the best way to learn JavaScript in 2023?",
            role: "user",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: "msg_4",
            conversationId: id,
            content: "The best way to learn JavaScript in 2023 involves a combination of structured learning and practical application. Start with fundamentals through interactive platforms like freeCodeCamp, Codecademy, or MDN Web Docs. Build small projects to apply what you're learning - personal websites, calculators, or simple games. Use modern tools like VS Code with extensions for JavaScript development. Join communities like Stack Overflow, Reddit's r/javascript, or Discord coding servers to ask questions and share your progress. Consider frameworks like React, Vue, or Angular once you're comfortable with vanilla JavaScript. Look into newer JavaScript features (ES6+) and explore Node.js for backend development. Consistent practice is key - aim to code regularly and continuously challenge yourself with new concepts and projects.",
            role: "assistant",
            createdAt: new Date(Date.now() - 7180000).toISOString(),
          }
        ];
        break;
      case "conv_3":
        title = "Travel recommendations";
        messages = [
          {
            id: "msg_5",
            conversationId: id,
            content: "What are the best places to visit in Europe for a summer vacation?",
            role: "user",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
          },
          {
            id: "msg_6",
            conversationId: id,
            content: "Europe offers numerous spectacular destinations for summer vacations. For beach lovers, consider the Greek Islands (Santorini, Mykonos), the Amalfi Coast in Italy, or the Croatian coastline. For cultural experiences, major cities like Paris, Rome, Barcelona, and Vienna shine in summer with longer days and outdoor events. If you prefer cooler temperatures, consider Scandinavia (Stockholm, Copenhagen, Norwegian fjords) where you can experience the midnight sun. For natural beauty, the Swiss Alps, Scottish Highlands, and the Azores in Portugal offer stunning landscapes. Eastern European cities like Prague, Budapest, and Krakow provide rich history and are typically more affordable. The best time to visit is May through September, though August can be very crowded as many Europeans take their vacations then. Consider your interests, budget, and tolerance for crowds when planning your ideal European summer adventure.",
            role: "assistant",
            createdAt: new Date(Date.now() - 1780000).toISOString(),
          }
        ];
        break;
      default:
        messages = [];
    }
    
    return {
      conversation: {
        id,
        userId: "user_1",
        title,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      messages
    };
  },
  
  sendMessage: async (conversationId: string, content: string): Promise<Message> => {

    // Create a user message
    const userMessage: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      conversationId,
      content,
      role: "user",
      createdAt: new Date().toISOString(),
    };
  
    // Simulate assistant response delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create assistant response
    // In a real app, this would come from the LLM API
      var AIResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: content,
    });
    let response :string;
    if(AIResponse.text){
      response=AIResponse.text;
    }
    else {
      response="Sorry i cant answer your question at the moment please try again later";
    }
    const assistantMessage: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      conversationId,
      content: response,
      role: "assistant",
      createdAt: new Date().toISOString(),
    };
    
    return assistantMessage;
  }
};
