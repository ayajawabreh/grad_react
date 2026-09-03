import apiRequest from "./api";

export type MessageType = "text" | "image" | "file" | "audio";

export interface ApiConversation {
  id?: number;
  conversation_id?: number;
  user_id: number;
  name: string;
  avatar: string | null;
  last_message: string;
  last_time: string;
  activity_at?: string | null;
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

export const getConversations = async () => {
  const conversationResponse = await apiRequest<any>("/conversations", {
    method: "GET",
  });

  const extractConversationList = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.conversations)) return response.conversations;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.conversations)) return response.data.conversations;
    return [];
  };

  const persistentList = extractConversationList(conversationResponse);

  const normalize = (conversation: any): ApiConversation => {
    const participant =
      conversation.participant ??
      conversation.other_user ??
      conversation.user ??
      {};

    const rawConversationId =
      conversation.id ?? conversation.conversation_id;

    return {
      ...conversation,
      id: rawConversationId == null ? undefined : Number(rawConversationId),
      conversation_id:
        rawConversationId == null
          ? undefined
          : Number(rawConversationId),
      user_id: Number(
        conversation.user_id ??
          conversation.recipient_id ??
          participant.id
      ),
      name: conversation.name ?? participant.name ?? "User",
      avatar: conversation.avatar ?? participant.avatar ?? null,
      last_message:
        typeof conversation.last_message === "string"
          ? conversation.last_message
          : conversation.last_message?.message ??
            conversation.last_message?.text ??
            "",
      last_time:
        conversation.last_time ??
        conversation.last_message_at ??
        conversation.updated_at ??
        "",
      activity_at:
        conversation.last_message_at ??
        conversation.updated_at ??
        conversation.created_at ??
        null,
      unread: Number(
        conversation.unread ?? conversation.unread_count ?? 0
      ),
    };
  };

  return persistentList.map(normalize);
};

export const startConversation = (recipientId: number) => {
  return apiRequest<any>("/conversations", {
    method: "POST",
    data: { recipient_id: recipientId },
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

export const getConversation = async (
  otherUserId: number
) => {
  // The backend currently identifies a conversation by the other user's ID.
  return apiRequest<any>(`/conversations/${otherUserId}/messages`, {
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

export const deleteConversation = (conversationId: number) => {
  return apiRequest(`/conversations/${conversationId}`, {
    method: "DELETE",
  });
};

export const blockUser = (conversationId: number) => {
  return apiRequest(`/conversations/${conversationId}/block`, {
    method: "POST",
  });
};

export const reportUser = (messageId: number, reason: string) => {
  return apiRequest("/reports/abuse", {
    method: "POST",
    data: {
      reportable_type: "Message",
      reportable_id: messageId,
      reason,
      description: reason,
    },
  });
};
