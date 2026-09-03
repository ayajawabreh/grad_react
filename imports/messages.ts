import { API } from "./api";

export type MessageType =
  | "text"
  | "image"
  | "file"
  | "audio";

export interface ApiConversation {
  id?: number;
  conversation_id?: number;
  user_id: number;
  name: string;
  avatar: string | null;
  last_message: string;
  last_time: string;
  unread: number;
  last_message_at?: string | null;
  participant_email?: string | null;
}

const conversationAvatarCache = new Map<number, string | null>();

export function formatConversationTimestamp(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const now = new Date();
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (seconds < 60) return `${Math.max(1, seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round(
    (today.getTime() - messageDay.getTime()) / 86400000,
  );

  if (dayDifference === 0) return `${Math.floor(seconds / 3600)}h`;
  if (dayDifference === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

export interface CreatedConversation {
  id: number;
  conversation_id?: number;
  participant?: MessageRecipient;
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

export interface NativeFile {
  uri: string;
  name: string;
  type: string;
}

let conversationsEndpointUnavailable = false;

export const getCurrentUser =
  async (): Promise<CurrentUser> => {
    const response =
      await API.get<CurrentUser>("/user");

    return response.data;
  };

export const getConversations =
  async (): Promise<ApiConversation[]> => {
    if (conversationsEndpointUnavailable) {
      return [];
    }

    let response;
    try {
      response = await API.get("/conversations");
    } catch (error: any) {
      if (error?.response?.status === 404) {
        conversationsEndpointUnavailable = true;
        return [];
      }
      throw error;
    }
    const payload = response.data;
    const list = Array.isArray(payload)
      ? payload
      : (payload?.conversations ?? payload?.data ?? []);

    const conversations = list.map((conversation: any): ApiConversation => {
      const participant =
        conversation.participant ??
        conversation.other_user ??
        conversation.user ??
        {};
      const participantStudent = participant.student ?? {};
      const participantCompany = participant.company ?? {};
      const id = Number(conversation.id ?? conversation.conversation_id);
      const lastMessageRecord = conversation.last_message;
      const lastMessage =
        typeof lastMessageRecord === "string"
          ? lastMessageRecord
          : lastMessageRecord?.message ||
            (lastMessageRecord?.type === "image"
              ? "📷 Image"
              : lastMessageRecord?.type === "audio"
                ? "🎤 Voice message"
                : lastMessageRecord?.type === "file"
                  ? `📎 ${lastMessageRecord?.file_name || "File"}`
                  : "");

      const lastMessageAt =
        conversation.last_message_at ??
        lastMessageRecord?.created_at ??
        conversation.updated_at ??
        null;

      return {
        ...conversation,
        id,
        conversation_id: id,
        user_id: Number(
          conversation.user_id ??
            conversation.recipient_id ??
            participant.id,
        ),
        name: conversation.name ?? participant.name ?? "User",
        participant_email: participant.email ?? conversation.email ?? null,
        avatar:
          conversation.avatar ??
          conversation.avatar_url ??
          conversation.profile_photo ??
          participant.avatar ??
          participant.avatar_url ??
          participant.profile_photo ??
          participant.profile_photo_url ??
          participant.profile_picture ??
          participantStudent.avatar ??
          participantStudent.profile_photo ??
          participantStudent.profile_photo_url ??
          participantStudent.profile_picture ??
          participantCompany.avatar ??
          participantCompany.logo ??
          participantCompany.logo_url ??
          null,
        last_message: lastMessage,
        last_time: lastMessageAt ?? conversation.last_time ?? "",
        last_message_at: lastMessageAt,
        unread: Number(
          conversation.unread ?? conversation.unread_count ?? 0,
        ),
      };
    })
      .filter((conversation: ApiConversation) => Boolean(conversation.last_message))
      .sort((a: ApiConversation, b: ApiConversation) => {
        const aTime = new Date(a.last_message_at ?? a.last_time ?? 0).getTime();
        const bTime = new Date(b.last_message_at ?? b.last_time ?? 0).getTime();
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
      });

    return Promise.all(
      conversations.map(async (conversation: ApiConversation) => {
        if (conversation.avatar || !conversation.participant_email) {
          return conversation;
        }

        if (conversationAvatarCache.has(conversation.user_id)) {
          return {
            ...conversation,
            avatar: conversationAvatarCache.get(conversation.user_id) ?? null,
          };
        }

        try {
          const avatarResponse = await API.get("/messages/search-recipient", {
            params: { email: conversation.participant_email },
          });
          const avatar = avatarResponse.data?.user?.avatar ?? null;
          conversationAvatarCache.set(conversation.user_id, avatar);
          return { ...conversation, avatar };
        } catch {
          conversationAvatarCache.set(conversation.user_id, null);
          return conversation;
        }
      }),
    );
  };

export const createConversation = async (
  recipientId: number,
): Promise<CreatedConversation> => {
  const response = await API.post(
    "/conversations",
    { recipient_id: recipientId },
  );

  const payload = response.data;
  const conversation =
    payload?.conversation ??
    payload?.data?.conversation ??
    payload?.data;
  const conversationId = Number(
    conversation?.id ?? conversation?.conversation_id,
  );

  console.log("START CONVERSATION STATUS:", response.status);
  console.log("START CONVERSATION RESPONSE:", payload);
  console.log("START CONVERSATION ID:", conversationId);

  if (!conversationId) {
    console.log("Unexpected conversation response:", payload);
    throw new Error("The server did not return a conversation ID.");
  }

  return {
    ...conversation,
    id: conversationId,
  };
};

export const findUserByEmail =
  async (
    email: string
  ): Promise<MessageRecipient> => {
    const response =
      await API.get<{
        success: boolean;
        user: MessageRecipient;
      }>(
        "/messages/search-recipient",
        {
          params: {
            email,
          },
        }
      );

    return response.data.user;
  };

export const searchMessageRecipient =
  findUserByEmail;

export const getConversation =
  async (
    userId: number
  ): Promise<ApiChatMessage[]> => {
    const response =
      await API.get<ApiChatMessage[]>(
        `/messages/${userId}`
      );

    return response.data;
  };

export const sendMessage =
  async (
    receiverId: number,
    message: string,
    type: MessageType = "text",
    file?: NativeFile
  ): Promise<SendMessageResponse> => {
    if (file) {
      const formData = new FormData();

      formData.append(
        "receiver_id",
        String(receiverId)
      );

      formData.append(
        "message",
        message || ""
      );

      formData.append(
        "type",
        type
      );

      formData.append(
        "file",
        {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any
      );

      const response =
        await API.post<SendMessageResponse>(
          "/messages",
          formData,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      return response.data;
    }

    const text = message.trim();

    if (!text) {
      throw new Error(
        "Message cannot be empty"
      );
    }

    const response =
      await API.post<SendMessageResponse>(
        "/messages",
        {
          receiver_id: receiverId,
          message: text,
          type,
        }
      );

    return response.data;
  };

export const deleteConversation =
  async (userId: number) => {
    const response =
      await API.delete(
        `/messages/${userId}`
      );

    return response.data;
  };

export const blockUser =
  async (userId: number) => {
    const response =
      await API.post(
        `/messages/${userId}/block`
      );

    return response.data;
  };

export const reportUser =
  async (
    userId: number,
    reason: string
  ) => {
    const response =
      await API.post(
        `/messages/${userId}/report`,
        {
          reason,
        }
      );

    return response.data;
  };
