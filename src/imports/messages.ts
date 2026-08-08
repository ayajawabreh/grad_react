import apiRequest from "./api";

export type MessageType = "text" | "image" | "file" | "audio";

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
  text: string | null;
  type: MessageType;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  time: string;
  created_at: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string | null;
    type: MessageType;
    file_url: string | null;
    file_name: string | null;
    file_type: string | null;
    created_at: string;
    updated_at: string;
  };
}

export interface MessageRecipient {
  id: number;
  name: string;
  email: string;
  role: "Student" | "Company";
  avatar: string | null;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const getCurrentUser = () => {
  return apiRequest<CurrentUser>("/user", {
    method: "GET",
  });
};

export const getConversations = () => {
  return apiRequest<ApiConversation[]>("/messages", {
    method: "GET",
  });
};

export const findUserByEmail = async (email: string) => {
  const response = await apiRequest<{
    success: boolean;
    user: MessageRecipient;
  }>("/messages/search-recipient", {
    method: "GET",
    params: {
      email,
    },
  });

  return response.data.user;
};

export const searchMessageRecipient = findUserByEmail;

export const getConversation = (userId: number) => {
  return apiRequest<ApiChatMessage[]>(`/messages/${userId}`, {
    method: "GET",
  });
};

export const sendMessage = async (
  receiverId: number,
  message: string,
  type: MessageType = "text",
  file?: File
) => {
  if (file) {
    const formData = new FormData();

    formData.append("receiver_id", String(receiverId));
    formData.append("message", message || "");
    formData.append("type", type);
    formData.append("file", file);

    return apiRequest<SendMessageResponse>("/messages", {
      method: "POST",
      data: formData,
    });
  }

  const text = message.trim();

  if (!text) {
    throw new Error("Message cannot be empty");
  }

  return apiRequest<SendMessageResponse>("/messages", {
    method: "POST",
    data: {
      receiver_id: receiverId,
      message: text,
      type,
    },
  });
};

export const deleteConversation = (userId: number) => {
  return apiRequest(`/messages/${userId}`, {
    method: "DELETE",
  });
};

export const blockUser = (userId: number) => {
  return apiRequest(`/messages/${userId}/block`, {
    method: "POST",
  });
};

export const reportUser = (userId: number, reason: string) => {
  return apiRequest(`/messages/${userId}/report`, {
    method: "POST",
    data: {
      reason,
    },
  });
};