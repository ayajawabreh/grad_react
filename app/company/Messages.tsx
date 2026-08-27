import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";

import {
  Search,
  Send,
  Paperclip,
  Mic,
  MoreHorizontal,
  Ban,
  Flag,
  Trash2,
  FileText,
  Image as ImageIcon,
  X,
  Square,
  Plus,
  ArrowLeft,
} from "lucide-react-native";

import * as DocumentPicker from "expo-document-picker";
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
} from "expo-audio";

import { C, F } from "../../constants/tokens";
import { resolveMediaUrl } from "../../imports/api";
import { useSyncRefresh } from "../../context/SyncContext";

import {
  getCurrentUser,
  getConversations,
  getConversation,
  sendMessage,
  findUserByEmail,
  deleteConversation,
  blockUser,
  reportUser,
  ApiConversation,
  ApiChatMessage,
  formatConversationTimestamp,
} from "../../imports/messages";

import { supabase } from "../../lib/supabase";

interface MessagesViewProps {
  meInitials?: string;
  meAvatar?: string;
  onUnreadCountChange?: (count: number) => void;
}

type ConfirmType = "delete" | "block" | "report";

function fallbackAvatar(name: string) {
  return `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
    name
  )}`;
}

function avatarUrl(value: string | null | undefined, name: string) {
  return resolveMediaUrl(value) || fallbackAvatar(name);
}

function normalizeFileUrl(url: string | null) {
  if (!url) return null;

  const markdownMatch = url.match(/^\[.*?\]\((.*?)\)$/);

  if (markdownMatch) {
    return markdownMatch[1];
  }

  return url;
}

export function MessagesView({
  meInitials = "MC",
  meAvatar,
  onUnreadCountChange,
}: MessagesViewProps) {
  const [conversations, setConversations] = useState<
    ApiConversation[]
  >([]);

  const [activeUserId, setActiveUserId] =
    useState<number | null>(null);
  const [draftConversation, setDraftConversation] =
    useState<ApiConversation | null>(null);

  const [messages, setMessages] = useState<
    ApiChatMessage[]
  >([]);
  const [syncRevision, setSyncRevision] = useState(0);
  useSyncRefresh(["messages", "conversations"], () =>
    setSyncRevision((value) => value + 1)
  );

  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] =
    useState<string | null>(meAvatar ?? null);
  const [currentUserInitials, setCurrentUserInitials] =
    useState(meInitials);

  const [loadingConvos, setLoadingConvos] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  const [selectedFile, setSelectedFile] =
    useState<any>(null);

  const [showAttachmentMenu, setShowAttachmentMenu] =
    useState(false);

  const [showNewMessage, setShowNewMessage] =
    useState(false);

  const [recipientEmail, setRecipientEmail] =
    useState("");

  const [recipientLoading, setRecipientLoading] =
    useState(false);

  const [recipientError, setRecipientError] =
    useState("");

  const [recipientUser, setRecipientUser] =
    useState<{
      id: number;
      name: string;
      email: string;
      role: string;
      avatar?: string | null;
    } | null>(null);

  const [recording, setRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmType | null>(null);

  const [confirmLoading, setConfirmLoading] =
    useState(false);

  const recordingTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const currentUserIdRef =
    useRef<number | null>(null);

  const activeUserIdRef =
    useRef<number | null>(null);

  const audioRecorder =
    useAudioRecorder(
      RecordingPresets.HIGH_QUALITY
    );

  /* -----------------------------
     Refs
  ----------------------------- */

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  /* -----------------------------
     Unread
  ----------------------------- */

  const totalUnreadMessages =
    conversations.reduce(
      (total, conversation) =>
        total + (conversation.unread || 0),
      0
    );

  useEffect(() => {
    onUnreadCountChange?.(
      totalUnreadMessages
    );
  }, [
    totalUnreadMessages,
    onUnreadCountChange,
  ]);

  /* -----------------------------
     Current User
  ----------------------------- */

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const response =
          await getCurrentUser();

        if (cancelled) return;

        const user = Array.isArray(response)
          ? null
          : (response as any)?.data ??
            response;

        const id = Number(user?.id);
        const profile = user?.company ?? user?.student ?? {};
        const userAvatar =
          user?.avatar ??
          user?.avatar_url ??
          user?.profile_photo_url ??
          user?.profile_photo ??
          profile?.avatar ??
          profile?.logo_url ??
          profile?.logo ??
          profile?.profile_photo_url ??
          null;
        const userName = String(user?.name ?? profile?.name ?? "Me");

        if (id) {
          setCurrentUserId(id);
          currentUserIdRef.current = id;
          setCurrentUserAvatar(userAvatar);
          setCurrentUserInitials(
            userName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || "ME",
          );
        }
      } catch {
        setCurrentUserId(null);
        currentUserIdRef.current = null;
      }
    };

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [syncRevision]);

  /* -----------------------------
     Supabase Realtime
  ----------------------------- */

  useEffect(() => {
    if (currentUserId == null) {
      return;
    }

    const channel = supabase
      .channel(
        `message_events_channel_${currentUserId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_events",
        },
        (payload) => {
          const newMessage =
            payload.new as any;

          const senderId = Number(
            newMessage.sender_id
          );

          const receiverId = Number(
            newMessage.receiver_id
          );

          const messageId = Number(
            newMessage.message_id
          );

          const userId =
            currentUserIdRef.current;

          const activeId =
            activeUserIdRef.current;

          if (!userId) return;

          const incoming =
            receiverId === userId &&
            senderId !== userId;

          const outgoing =
            senderId === userId &&
            receiverId !== userId;

          if (!incoming && !outgoing) {
            return;
          }

          const conversationUserId =
            incoming ? senderId : receiverId;

          const isActive =
            activeId ===
            conversationUserId;

          const fileUrl =
            normalizeFileUrl(
              newMessage.file_url || null
            );

          if (
            incoming &&
            isActive
          ) {
            const incomingMessage: ApiChatMessage =
              {
                id: messageId,
                from: "them",
                text:
                  newMessage.message ||
                  null,
                type:
                  newMessage.type ||
                  "text",
                file_url: fileUrl,
                file_name:
                  newMessage.file_name ||
                  null,
                file_type:
                  newMessage.file_type ||
                  null,
                created_at:
                  newMessage.created_at,
                time: new Date(
                  newMessage.created_at
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };

            setMessages((prev) => {
              if (
                prev.some(
                  (m) =>
                    m.id === messageId
                )
              ) {
                return prev;
              }

              return [
                ...prev,
                incomingMessage,
              ];
            });
          }

          const lastMessage =
            newMessage.message ||
            (newMessage.type ===
            "image"
              ? "📷 Image"
              : newMessage.type ===
                "audio"
              ? "🎤 Voice message"
              : newMessage.type ===
                "file"
              ? `📎 ${
                  newMessage.file_name ||
                  "File"
                }`
              : "Attachment");

          setConversations(
            (prev) =>
              prev
                .map((conversation) => {
                  if (
                    conversation.user_id !==
                    conversationUserId
                  ) {
                    return conversation;
                  }

                  const increaseUnread =
                    incoming &&
                    !isActive;

                  return {
                    ...conversation,
                    last_message:
                      lastMessage,
                    last_time: "Now",
                    unread:
                      increaseUnread
                        ? (conversation.unread ||
                            0) + 1
                        : conversation.unread ||
                          0,
                  };
                })
                .sort((a, b) => {
                  if (
                    a.user_id ===
                      conversationUserId &&
                    b.user_id !==
                      conversationUserId
                  )
                    return -1;

                  if (
                    b.user_id ===
                      conversationUserId &&
                    a.user_id !==
                      conversationUserId
                  )
                    return 1;

                  return 0;
                })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [currentUserId]);

  /* -----------------------------
     Load conversations
  ----------------------------- */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingConvos(true);

      try {
        const data =
          await getConversations();

        if (cancelled) return;

        const convos =
          Array.isArray(data)
            ? data
            : (data as any)?.data ??
              [];

        setConversations(convos);

      } catch {
        Alert.alert(
          "Error",
          "Could not load conversations."
        );
      } finally {
        if (!cancelled) {
          setLoadingConvos(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [syncRevision]);

  /* -----------------------------
     Load messages
  ----------------------------- */

  useEffect(() => {
    if (activeUserId == null) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setLoadingMessages(true);

      try {
        const res =
          await getConversation(
            activeUserId
          );

        if (cancelled) return;

        const messageList =
          Array.isArray(res)
            ? res
            : (res as any).data;

        const normalized =
          (messageList ?? []).map(
            (message: ApiChatMessage) => ({
              ...message,
              file_url:
                normalizeFileUrl(
                  message.file_url
                ),
            })
          );

        setMessages(normalized);

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.user_id ===
            activeUserId
              ? {
                  ...conversation,
                  unread: 0,
                }
              : conversation
          )
        );
      } catch {
        Alert.alert(
          "Error",
          "Could not load messages."
        );
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeUserId, syncRevision]);

  /* -----------------------------
     Recording timer
  ----------------------------- */

  useEffect(() => {
    return () => {
      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );
      }
    };
  }, []);

  /* -----------------------------
     Helpers
  ----------------------------- */

  const activeConvo =
    conversations.find((c) => c.user_id === activeUserId) ??
    (draftConversation?.user_id === activeUserId
      ? draftConversation
      : undefined);

  const filteredConversations =
    conversations.filter((c) =>
      c.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  /* -----------------------------
     Conversation
  ----------------------------- */

  const handleOpenConversation = (
    userId: number
  ) => {
    setDraftConversation(null);
    setActiveUserId(userId);
    activeUserIdRef.current =
      userId;

    setShowMenu(false);

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.user_id ===
        userId
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation
      )
    );
  };

  const closeConversation = () => {
    setShowMenu(false);
    setDraftConversation(null);
    setActiveUserId(null);
    activeUserIdRef.current = null;
    setMessages([]);
    setMsg("");
    setSelectedFile(null);
    setShowAttachmentMenu(false);
    setRecording(false);
  };

  /* -----------------------------
     File
  ----------------------------- */

  const pickFile = async () => {
    setShowAttachmentMenu(false);

    try {
      const result =
        await DocumentPicker.getDocumentAsync(
          {
            type: [
              "image/*",
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.ms-excel",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "text/plain",
              "application/zip",
              "application/x-rar-compressed",
            ],
            copyToCacheDirectory: true,
          }
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const asset = result.assets[0];

      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        type:
          asset.mimeType ||
          "application/octet-stream",
      });
    } catch {
      Alert.alert(
        "Error",
        "Could not select file."
      );
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  /* -----------------------------
     Refresh
  ----------------------------- */

  const refreshMessages = async () => {
    if (activeUserId == null)
      return;

    try {
      const res =
        await getConversation(
          activeUserId
        );

      const messageList =
        Array.isArray(res)
          ? res
          : (res as any).data;

      const normalized =
        (messageList ?? []).map(
          (message: ApiChatMessage) => ({
            ...message,
            file_url:
              normalizeFileUrl(
                message.file_url
              ),
          })
        );

      setMessages(normalized);

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user_id ===
          activeUserId
            ? {
                ...conversation,
                unread: 0,
              }
            : conversation
        )
      );
    } catch {}
  };

  useEffect(() => {
    const syncConversations = async () => {
      try {
        const data = await getConversations();
        const convos = Array.isArray(data) ? data : (data as any)?.data ?? [];
        setConversations(convos);
      } catch {
        // A later realtime event or polling cycle will retry.
      }
    };

    const syncAll = async () => {
      await Promise.all([syncConversations(), refreshMessages()]);
    };

    const channel = supabase
      .channel(`company-message-full-sync-${currentUserId ?? "unknown"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_events" },
        () => void syncAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => void syncConversations(),
      )
      .subscribe();

    const conversationInterval = setInterval(
      () => void refreshMessages(),
      2500,
    );
    const conversationsInterval = setInterval(
      () => void syncConversations(),
      5000,
    );
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncAll();
    });

    return () => {
      clearInterval(conversationInterval);
      clearInterval(conversationsInterval);
      subscription.remove();
      void supabase.removeChannel(channel);
    };
  }, [activeUserId, currentUserId]);

  /* -----------------------------
     New Message
  ----------------------------- */

  const openNewMessage = () => {
    setRecipientEmail("");
    setRecipientUser(null);
    setRecipientError("");
    setShowNewMessage(true);
  };

  const closeNewMessage = () => {
    if (recipientLoading)
      return;

    setShowNewMessage(false);
    setRecipientEmail("");
    setRecipientUser(null);
    setRecipientError("");
  };

  const findRecipient =
    async () => {
      const email =
        recipientEmail.trim();

      if (!email) {
        setRecipientError(
          "Please enter an email address."
        );
        return;
      }

      setRecipientLoading(true);
      setRecipientError("");
      setRecipientUser(null);

      try {
        const user =
          await findUserByEmail(
            email
          );

        if (!user) {
          setRecipientError(
            "No student or company found with this email."
          );
          return;
        }

        setRecipientUser(user);
      } catch {
        setRecipientError(
          "No student or company found with this email."
        );
      } finally {
        setRecipientLoading(false);
      }
    };

  const startNewConversation =
    async () => {
      if (!recipientUser)
        return;

      const draft: ApiConversation = {
        user_id: recipientUser.id,
        name: recipientUser.name,
        avatar: recipientUser.avatar ?? null,
        last_message: "",
        last_time: "",
        unread: 0,
      };

      setDraftConversation(draft);
      setShowNewMessage(false);
      setRecipientEmail("");
      setRecipientError("");
      setActiveUserId(recipientUser.id);
      activeUserIdRef.current = recipientUser.id;
      setMessages([]);
    };

  /* -----------------------------
     Send Attachment
  ----------------------------- */

  const sendAttachment =
    async () => {
      if (
        !selectedFile ||
        activeUserId == null ||
        sending
      ) {
        return;
      }

      setSending(true);

      try {
        const type =
          selectedFile.type?.startsWith(
            "image/"
          )
            ? "image"
            : "file";

        await sendMessage(
          activeUserId,
          "",
          type,
          selectedFile
        );

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.user_id ===
            activeUserId
              ? {
                  ...conversation,
                  last_message:
                    type === "image"
                      ? "📷 Image"
                      : `📎 ${selectedFile.name}`,
                  last_time: "Now",
                }
              : conversation
          )
        );

        setSelectedFile(null);

        await refreshMessages();
      } catch {
        Alert.alert(
          "Error",
          "Could not send attachment."
        );
      } finally {
        setSending(false);
      }
    };

  /* -----------------------------
     Voice Recording
  ----------------------------- */

  const startRecording =
    async () => {
      if (
        recording ||
        activeUserId == null
      ) {
        return;
      }

      try {
        const permission =
          await AudioModule.requestRecordingPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Microphone permission is required."
          );
          return;
        }

        await audioRecorder.prepareToRecordAsync();

        audioRecorder.record();

        setRecording(true);
        setRecordingTime(0);

        recordingTimerRef.current =
          setInterval(() => {
            setRecordingTime(
              (prev) => prev + 1
            );
          }, 1000);
      } catch {
        Alert.alert(
          "Error",
          "Could not start recording."
        );
      }
    };

  const stopRecording =
    async () => {
      if (!recording) return;

      try {
        await audioRecorder.stop();

        const uri =
          audioRecorder.uri;

        setRecording(false);

        if (
          recordingTimerRef.current
        ) {
          clearInterval(
            recordingTimerRef.current
          );

          recordingTimerRef.current =
            null;
        }

        if (
          !uri ||
          activeUserId == null
        ) {
          return;
        }

        const audioFile = {
          uri,
          name: `voice-${Date.now()}.m4a`,
          type: "audio/m4a",
        };

        setSending(true);

        await sendMessage(
          activeUserId,
          "",
          "audio",
          audioFile as any
        );

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.user_id ===
            activeUserId
              ? {
                  ...conversation,
                  last_message:
                    "🎤 Voice message",
                  last_time: "Now",
                }
              : conversation
          )
        );

        await refreshMessages();
      } catch {
        Alert.alert(
          "Error",
          "Could not send voice message."
        );
      } finally {
        setSending(false);
      }
    };

  const formatRecordingTime = (
    seconds: number
  ) => {
    const minutes = Math.floor(
      seconds / 60
    )
      .toString()
      .padStart(2, "0");

    const secs = (
      seconds % 60
    )
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  };

  /* -----------------------------
     Send Text
  ----------------------------- */

  const handleSend = async () => {
    if (
      (!msg.trim() &&
        !selectedFile) ||
      activeUserId == null ||
      sending ||
      recording
    ) {
      return;
    }

    if (selectedFile) {
      await sendAttachment();
      return;
    }

    const text = msg.trim();

    if (!text) return;

    setMsg("");
    setSending(true);

    try {
      await sendMessage(
        activeUserId,
        text,
        "text"
      );

      setConversations((prev) => {
        const updated =
          prev.map(
            (conversation) =>
              conversation.user_id ===
              activeUserId
                ? {
                    ...conversation,
                    last_message:
                      text,
                    last_time:
                      "Now",
                  }
                : conversation
          );

        const active =
          updated.find(
            (c) =>
              c.user_id ===
              activeUserId
          );

        const others =
          updated.filter(
            (c) =>
              c.user_id !==
              activeUserId
          );

        return active
          ? [active, ...others]
          : updated;
      });

      await refreshMessages();
    } catch {
      setMsg(text);

      Alert.alert(
        "Error",
        "Could not send message."
      );
    } finally {
      setSending(false);
    }
  };

  /* -----------------------------
     Actions
  ----------------------------- */

  const executeConfirm =
    async () => {
      if (
        !confirmDialog ||
        activeUserId == null
      ) {
        return;
      }

      setConfirmLoading(true);

      try {
        if (
          confirmDialog ===
          "delete"
        ) {
          await deleteConversation(
            activeUserId
          );

          setConversations((prev) =>
            prev.filter(
              (c) =>
                c.user_id !==
                activeUserId
            )
          );

          const refreshed = await getConversations();
          setConversations(
            Array.isArray(refreshed)
              ? refreshed
              : (refreshed as any)?.data ?? [],
          );

          closeConversation();
        }

        if (
          confirmDialog === "block"
        ) {
          await blockUser(
            activeUserId
          );

          setConversations((prev) =>
            prev.filter(
              (c) =>
                c.user_id !==
                activeUserId
            )
          );

          closeConversation();
        }

        if (
          confirmDialog === "report"
        ) {
          await reportUser(
            activeUserId,
            "Reported from conversation"
          );

          Alert.alert(
            "Success",
            "User reported successfully."
          );
        }

        setConfirmDialog(null);
      } catch {
        Alert.alert(
          "Error",
          `Could not ${confirmDialog} user.`
        );
      } finally {
        setConfirmLoading(false);
      }
    };

  /* -----------------------------
     Loading
  ----------------------------- */

  if (loadingConvos) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="small"
          color={C.accent}
        />
      </SafeAreaView>
    );
  }

  /* =====================================================
     MOBILE UI
  ===================================================== */

  return (
    <SafeAreaView
      style={styles.container}
    >
      {!activeConvo ? (
        /* ============================
           CONVERSATIONS LIST
        ============================ */

        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <View
              style={styles.titleRow}
            >
              <Text style={styles.title}>
                Messages
              </Text>

              {totalUnreadMessages >
                0 && (
                <View
                  style={styles.unreadBadge}
                >
                  <Text
                    style={
                      styles.unreadText
                    }
                  >
                    {
                      totalUnreadMessages
                    }
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={
                  openNewMessage
                }
                style={
                  styles.newButton
                }
              >
                <Plus
                  size={19}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <View
              style={styles.searchBox}
            >
              <Search
                size={17}
                color={C.textMuted}
              />

              <TextInput
                value={search}
                onChangeText={
                  setSearch
                }
                placeholder="Search..."
                placeholderTextColor={
                  C.textMuted
                }
                style={
                  styles.searchInput
                }
              />
            </View>
          </View>

          {filteredConversations.length ===
          0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={
                  styles.emptyText
                }
              >
                No conversations yet
              </Text>

              <TouchableOpacity
                onPress={
                  openNewMessage
                }
                style={
                  styles.startButton
                }
              >
                <Text
                  style={
                    styles.startButtonText
                  }
                >
                  Start a conversation
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={
                filteredConversations
              }
              keyExtractor={(item) =>
                String(item.user_id)
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({
                item,
              }) => (
                <TouchableOpacity
                  onPress={() =>
                    handleOpenConversation(
                      item.user_id
                    )
                  }
                  style={
                    styles.conversationItem
                  }
                >
                  <Image
                    source={{
                      uri:
                        avatarUrl(item.avatar, item.name),
                    }}
                    style={
                      styles.avatar
                    }
                  />

                  <View
                    style={
                      styles.conversationInfo
                    }
                  >
                    <View
                      style={
                        styles.conversationTop
                      }
                    >
                      <Text
                        numberOfLines={
                          1
                        }
                        style={
                          styles.name
                        }
                      >
                        {item.name}
                      </Text>

                      <Text
                        style={
                          styles.time
                        }
                      >
                        {
                          formatConversationTimestamp(item.last_time)
                        }
                      </Text>
                    </View>

                    <Text
                      numberOfLines={
                        1
                      }
                      style={[
                        styles.lastMessage,
                        item.unread >
                          0 &&
                          styles.unreadMessage,
                      ]}
                    >
                      {item.last_message ||
                        "New conversation"}
                    </Text>
                  </View>

                  {item.unread >
                    0 && (
                    <View
                      style={
                        styles.smallUnread
                      }
                    >
                      <Text
                        style={
                          styles.unreadText
                        }
                      >
                        {
                          item.unread
                        }
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        /* ============================
           CHAT
        ============================ */

        <KeyboardAvoidingView
          style={
            styles.chatContainer
          }
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          {/* CHAT HEADER */}

          <View
            style={styles.chatHeader}
          >
            <TouchableOpacity
              onPress={
                closeConversation
              }
              style={
                styles.backButton
              }
            >
              <ArrowLeft
                size={22}
                color={C.text}
              />
            </TouchableOpacity>

            <Image
              source={{
                uri:
                  avatarUrl(activeConvo.avatar, activeConvo.name),
              }}
              style={
                styles.headerAvatar
              }
            />

            <View
              style={
                styles.headerInfo
              }
            >
              <Text
                style={
                  styles.headerName
                }
                numberOfLines={1}
              >
                {activeConvo.name}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                setShowMenu(
                  (prev) => !prev
                )
              }
              style={
                styles.headerIcon
              }
            >
              <MoreHorizontal
                size={21}
                color={C.textSec}
              />
            </TouchableOpacity>

            {showMenu && (
              <View
                style={
                  styles.menu
                }
              >
                <TouchableOpacity
                  style={
                    styles.menuItem
                  }
                  onPress={() => {
                    setShowMenu(
                      false
                    );
                    closeConversation();
                  }}
                >
                  <X
                    size={17}
                    color={C.text}
                  />
                  <Text
                    style={
                      styles.menuText
                    }
                  >
                    Close Conversation
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.menuItem
                  }
                  onPress={() => {
                    setShowMenu(
                      false
                    );
                    setConfirmDialog(
                      "block"
                    );
                  }}
                >
                  <Ban
                    size={17}
                    color={C.text}
                  />
                  <Text
                    style={
                      styles.menuText
                    }
                  >
                    Block User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.menuItem
                  }
                  onPress={() => {
                    setShowMenu(
                      false
                    );
                    setConfirmDialog(
                      "report"
                    );
                  }}
                >
                  <Flag
                    size={17}
                    color={C.text}
                  />
                  <Text
                    style={
                      styles.menuText
                    }
                  >
                    Report User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.menuItem
                  }
                  onPress={() => {
                    setShowMenu(
                      false
                    );
                    setConfirmDialog(
                      "delete"
                    );
                  }}
                >
                  <Trash2
                    size={17}
                    color="#EF4444"
                  />
                  <Text
                    style={[
                      styles.menuText,
                      {
                        color:
                          "#EF4444",
                      },
                    ]}
                  >
                    Delete Conversation
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* MESSAGES */}

          {loadingMessages ? (
            <View
              style={
                styles.messagesLoading
              }
            >
              <ActivityIndicator
                color={C.accent}
              />
            </View>
          ) : messages.length ===
            0 ? (
            <View
              style={
                styles.messagesEmpty
              }
            >
              <Text
                style={
                  styles.emptyText
                }
              >
                Start the conversation
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) =>
                String(item.id)
              }
              contentContainerStyle={
                styles.messagesList
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({
                item,
              }: any) => {
                const fileUrl =
                  normalizeFileUrl(
                    item.file_url
                  );

                const isMe =
                  item.from === "me";

                return (
                  <View
                    style={[
                      styles.messageRow,
                      isMe
                        ? styles.myRow
                        : styles.theirRow,
                    ]}
                  >
                    {!isMe && (
                      <Image
                        source={{
                          uri:
                            avatarUrl(activeConvo.avatar, activeConvo.name),
                        }}
                        style={
                          styles.messageAvatar
                        }
                      />
                    )}

                    {isMe &&
                      (currentUserAvatar ? (
                        <Image
                          source={{
                            uri: avatarUrl(currentUserAvatar, currentUserInitials),
                          }}
                          style={
                            styles.messageAvatar
                          }
                        />
                      ) : (
                        <View
                          style={
                            styles.myAvatar
                          }
                        >
                          <Text
                            style={
                              styles.myAvatarText
                            }
                          >
                            {
                              currentUserInitials
                            }
                          </Text>
                        </View>
                      ))}

                    <View
                      style={[
                        styles.bubble,
                        isMe
                          ? styles.myBubble
                          : styles.theirBubble,
                      ]}
                    >
                      {item.type ===
                        "image" &&
                      fileUrl ? (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              fileUrl
                            )
                          }
                        >
                          <Image
                            source={{
                              uri: fileUrl,
                            }}
                            style={
                              styles.messageImage
                            }
                          />
                        </TouchableOpacity>
                      ) : item.type ===
                          "audio" &&
                        fileUrl ? (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              fileUrl
                            )
                          }
                          style={
                            styles.audioMessage
                          }
                        >
                          <Mic
                            size={18}
                            color={
                              isMe
                                ? "#fff"
                                : C.accent
                            }
                          />

                          <Text
                            style={[
                              styles.audioText,
                              {
                                color:
                                  isMe
                                    ? "#fff"
                                    : C.text,
                              },
                            ]}
                          >
                            Voice message
                          </Text>
                        </TouchableOpacity>
                      ) : fileUrl ? (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(
                              fileUrl
                            )
                          }
                          style={
                            styles.fileMessage
                          }
                        >
                          <FileText
                            size={20}
                            color={
                              isMe
                                ? "#fff"
                                : C.accent
                            }
                          />

                          <Text
                            numberOfLines={
                              2
                            }
                            style={[
                              styles.fileName,
                              {
                                color:
                                  isMe
                                    ? "#fff"
                                    : C.accent,
                              },
                            ]}
                          >
                            {item.file_name ||
                              "Open file"}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text
                          style={[
                            styles.messageText,
                            {
                              color:
                                isMe
                                  ? "#fff"
                                  : C.text,
                            },
                          ]}
                        >
                          {item.text}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}

          {/* SELECTED FILE */}

          {selectedFile && (
            <View
              style={
                styles.selectedFile
              }
            >
              {selectedFile.type?.startsWith(
                "image/"
              ) ? (
                <ImageIcon
                  size={18}
                  color={C.accent}
                />
              ) : (
                <FileText
                  size={18}
                  color={C.accent}
                />
              )}

              <Text
                numberOfLines={1}
                style={
                  styles.selectedFileName
                }
              >
                {selectedFile.name}
              </Text>

              <TouchableOpacity
                onPress={
                  removeSelectedFile
                }
              >
                <X
                  size={18}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* INPUT */}

          <View
            style={
              styles.inputContainer
            }
          >
            <TouchableOpacity
              onPress={() =>
                setShowAttachmentMenu(
                  (prev) => !prev
                )
              }
              style={
                styles.inputIcon
              }
            >
              <Paperclip
                size={20}
                color={C.textSec}
              />
            </TouchableOpacity>

            {showAttachmentMenu && (
              <View
                style={
                  styles.attachmentMenu
                }
              >
                <TouchableOpacity
                  onPress={pickFile}
                  style={
                    styles.attachmentItem
                  }
                >
                  <ImageIcon
                    size={18}
                    color={C.text}
                  />

                  <Text
                    style={
                      styles.menuText
                    }
                  >
                    Photo or File
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View
              style={[
                styles.textInputWrapper,
                recording &&
                  styles.recordingWrapper,
              ]}
            >
              {recording ? (
                <>
                  <View
                    style={
                      styles.recordingDot
                    }
                  />

                  <Text
                    style={
                      styles.recordingText
                    }
                  >
                    Recording{" "}
                    {formatRecordingTime(
                      recordingTime
                    )}
                  </Text>
                </>
              ) : (
                <TextInput
                  value={msg}
                  onChangeText={
                    setMsg
                  }
                  placeholder="Type a message..."
                  placeholderTextColor={
                    C.textMuted
                  }
                  editable={!sending}
                  multiline
                  style={
                    styles.messageInput
                  }
                />
              )}

              <TouchableOpacity
                onPress={
                  recording
                    ? stopRecording
                    : startRecording
                }
                disabled={sending}
              >
                {recording ? (
                  <Square
                    size={17}
                    color={C.accent}
                  />
                ) : (
                  <Mic
                    size={19}
                    color={
                      C.textMuted
                    }
                  />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={
                (!msg.trim() &&
                  !selectedFile) ||
                sending ||
                recording
              }
              style={[
                styles.sendButton,
                (!msg.trim() &&
                  !selectedFile) &&
                  styles.sendDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <Send
                  size={17}
                  color={
                    msg.trim() ||
                    selectedFile
                      ? "#fff"
                      : C.textMuted
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ============================
          NEW MESSAGE MODAL
      ============================ */}

      <Modal
        visible={showNewMessage}
        transparent
        animationType="fade"
        onRequestClose={
          closeNewMessage
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.newMessageModal}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  New Message
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Start a conversation with
                  a student or company.
                </Text>
              </View>

              <TouchableOpacity
                onPress={
                  closeNewMessage
                }
              >
                <X
                  size={20}
                  color={C.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={
                styles.fieldLabel
              }
            >
              To
            </Text>

            <View
              style={
                styles.recipientRow
              }
            >
              <TextInput
                value={recipientEmail}
                onChangeText={(text) => {
                  setRecipientEmail(
                    text
                  );
                  setRecipientError(
                    ""
                  );
                  setRecipientUser(
                    null
                  );
                }}
                placeholder="Enter email address..."
                placeholderTextColor={
                  C.textMuted
                }
                keyboardType="email-address"
                autoCapitalize="none"
                style={
                  styles.recipientInput
                }
              />

              <TouchableOpacity
                onPress={
                  findRecipient
                }
                disabled={
                  recipientLoading ||
                  !recipientEmail.trim()
                }
                style={[
                  styles.findButton,
                  (!recipientEmail.trim() ||
                    recipientLoading) &&
                    styles.disabledButton,
                ]}
              >
                {recipientLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.findButtonText
                    }
                  >
                    Find
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {recipientError !==
              "" && (
              <Text
                style={
                  styles.errorText
                }
              >
                {recipientError}
              </Text>
            )}

            {recipientUser && (
              <View
                style={
                  styles.recipientCard
                }
              >
                <Image
                  source={{
                    uri:
                      avatarUrl(recipientUser.avatar, recipientUser.name),
                  }}
                  style={
                    styles.recipientAvatar
                  }
                />

                <View
                  style={
                    styles.recipientInfo
                  }
                >
                  <Text
                    style={
                      styles.recipientName
                    }
                  >
                    {
                      recipientUser.name
                    }
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={
                      styles.recipientEmail
                    }
                  >
                    {
                      recipientUser.email
                    }
                  </Text>

                  <View
                    style={
                      styles.roleBadge
                    }
                  >
                    <Text
                      style={
                        styles.roleText
                      }
                    >
                      {
                        recipientUser.role
                      }
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View
              style={
                styles.modalActions
              }
            >
              <TouchableOpacity
                onPress={
                  closeNewMessage
                }
                style={
                  styles.cancelButton
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  startNewConversation
                }
                disabled={!recipientUser}
                style={[
                  styles.startConversationButton,
                  !recipientUser &&
                    styles.disabledButton,
                ]}
              >
                <Text
                  style={
                    styles.startConversationText
                  }
                >
                  Start Conversation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================
          CONFIRM DIALOG
      ============================ */}

      <Modal
        visible={
          confirmDialog !== null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setConfirmDialog(null)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.confirmModal}
          >
            <View
              style={
                styles.confirmIcon
              }
            >
              {confirmDialog ===
              "delete" ? (
                <Trash2
                  size={20}
                  color="#EF4444"
                />
              ) : confirmDialog ===
                "block" ? (
                <Ban
                  size={20}
                  color="#EF4444"
                />
              ) : (
                <Flag
                  size={20}
                  color="#EF4444"
                />
              )}
            </View>

            <Text
              style={
                styles.confirmTitle
              }
            >
              {confirmDialog ===
              "delete"
                ? "Delete Conversation"
                : confirmDialog ===
                  "block"
                ? "Block User"
                : "Report User"}
            </Text>

            <Text
              style={
                styles.confirmMessage
              }
            >
              {confirmDialog ===
              "delete"
                ? "Are you sure you want to delete this conversation? You will not be able to recover it."
                : confirmDialog ===
                  "block"
                ? "Are you sure you want to block this user? You will not be able to receive messages from this user."
                : "Are you sure you want to report this user?"}
            </Text>

            <View
              style={
                styles.confirmActions
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setConfirmDialog(
                    null
                  )
                }
                disabled={
                  confirmLoading
                }
                style={
                  styles.cancelButton
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={
                  executeConfirm
                }
                disabled={
                  confirmLoading
                }
                style={
                  styles.deleteButton
                }
              >
                {confirmLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    {confirmDialog ===
                    "delete"
                      ? "Delete"
                      : confirmDialog ===
                        "block"
                      ? "Block"
                      : "Report"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function CompanyMessages() {
  return <MessagesView />;
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  /* LIST */

  listContainer: {
    flex: 1,
    backgroundColor: C.surface,
  },

  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  unreadBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: 7,
  },

  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  newButton: {
    marginLeft: "auto",
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    height: 43,
    borderRadius: 11,
    backgroundColor: C.bg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontFamily: F,
  },

  conversationItem: {
    minHeight: 72,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: 11,
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
  },

  conversationInfo: {
    flex: 1,
    minWidth: 0,
  },

  conversationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
    marginRight: 8,
  },

  time: {
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F,
  },

  lastMessage: {
    fontSize: 12,
    color: C.textSec,
    fontFamily: F,
  },

  unreadMessage: {
    fontWeight: "700",
    color: C.text,
  },

  smallUnread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyText: {
    fontSize: 13,
    color: C.textMuted,
    fontFamily: F,
    textAlign: "center",
  },

  startButton: {
    marginTop: 14,
    backgroundColor: C.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  startButtonText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F,
  },

  /* CHAT */

  chatContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },

  chatHeader: {
    height: 65,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    position: "relative",
    zIndex: 20,
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  headerInfo: {
    flex: 1,
  },

  headerName: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },

  menu: {
    position: "absolute",
    top: 57,
    right: 12,
    width: 210,
    backgroundColor: C.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    padding: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  menuItem: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  menuText: {
    fontSize: 12,
    color: C.text,
    fontFamily: F,
  },

  messagesList: {
    padding: 14,
    paddingBottom: 20,
    gap: 10,
  },

  messagesLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  messagesEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    marginVertical: 2,
  },

  myRow: {
    justifyContent: "flex-end",
  },

  theirRow: {
    justifyContent: "flex-start",
  },

  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  myAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.dark,
    alignItems: "center",
    justifyContent: "center",
  },

  myAvatarText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
  },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 17,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },

  myBubble: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 5,
  },

  theirBubble: {
    backgroundColor: C.surface,
    borderBottomLeftRadius: 5,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: F,
  },

  messageImage: {
    width: 210,
    height: 210,
    borderRadius: 11,
  },

  audioMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minWidth: 150,
  },

  audioText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F,
  },

  fileMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    maxWidth: 220,
  },

  fileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F,
  },

  selectedFile: {
    minHeight: 45,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  selectedFileName: {
    flex: 1,
    fontSize: 12,
    color: C.text,
    fontFamily: F,
  },

  inputContainer: {
    minHeight: 66,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    position: "relative",
  },

  inputIcon: {
    width: 34,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  textInputWrapper: {
    flex: 1,
    minHeight: 43,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  recordingWrapper: {
    borderColor: C.accent,
  },

  messageInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontFamily: F,
    maxHeight: 85,
    paddingVertical: 8,
  },

  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    marginRight: 8,
  },

  recordingText: {
    flex: 1,
    fontSize: 13,
    color: C.accent,
    fontFamily: F,
  },

  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  sendDisabled: {
    backgroundColor: C.divider,
  },

  attachmentMenu: {
    position: "absolute",
    bottom: 62,
    left: 10,
    width: 180,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    zIndex: 30,
  },

  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
  },

  /* NEW MESSAGE */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.48)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  newMessageModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  modalSubtitle: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 5,
    fontFamily: F,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
    marginBottom: 7,
    fontFamily: F,
  },

  recipientRow: {
    flexDirection: "row",
    gap: 8,
  },

  recipientInput: {
    flex: 1,
    height: 43,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: C.text,
    backgroundColor: C.bg,
    fontSize: 12,
    fontFamily: F,
  },

  findButton: {
    height: 43,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  findButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F,
  },

  disabledButton: {
    opacity: 0.5,
  },

  errorText: {
    marginTop: 8,
    fontSize: 11,
    color: "#EF4444",
    fontFamily: F,
  },

  recipientCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  recipientInfo: {
    flex: 1,
  },

  recipientName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  recipientEmail: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 3,
    fontFamily: F,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.accentLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },

  roleText: {
    fontSize: 9,
    fontWeight: "700",
    color: C.accent,
    fontFamily: F,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 20,
  },

  cancelButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: 12,
    color: C.textSec,
    fontFamily: F,
  },

  startConversationButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  startConversationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F,
  },

  /* CONFIRM */

  confirmModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 22,
  },

  confirmIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  confirmTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  confirmMessage: {
    fontSize: 13,
    color: C.textSec,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: F,
  },

  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
    marginTop: 22,
  },

  deleteButton: {
    height: 40,
    paddingHorizontal: 17,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F,
  },
});
