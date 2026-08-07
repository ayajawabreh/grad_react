import apiRequest from "./api"; 


export interface ApiConversation {
  user_id: number;
  name: string;
  avatar: string | null;
  last_message: string;
  last_time: string; 
  unread: number;
}

export interface ApiChatMessage {
  id: number;
  from: "me" | "them";
  text: string;
  time: string; // e.g. "07:15 AM"
  created_at: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    created_at: string;
    updated_at: string;
  };
}


export const getConversations = () => {
  return apiRequest<ApiConversation[]>("/messages", { method: "GET" });
};

export const getConversation = (userId: number) => {
  return apiRequest<ApiChatMessage[]>(`/messages/${userId}`, { method: "GET" });
};

export const sendMessage = (receiverId: number, message: string) => {
  return apiRequest<SendMessageResponse>("/messages", {
    method: "POST",
    data: {
      receiver_id: receiverId,
      message,
    },
  });
};