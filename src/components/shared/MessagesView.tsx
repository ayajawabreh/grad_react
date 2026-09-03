import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import {
  Search,
  Send,
  Paperclip,
  Mic,
  MoreHorizontal,
  Video,
  Ban,
  Flag,
  Trash2,
  FileText,
  Image as ImageIcon,
  X,
  Square,
  Plus,
  Download,
} from "lucide-react-native";

import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "expo-router/react-navigation";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { C, F } from "../../../constants/tokens";
import { resolveMediaUrl } from "../../../imports/api";
import { useSyncRefresh } from "../../../context/SyncContext";
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
} from "../../../imports/messages";

import { supabase } from "../../../lib/supabase";

interface MessagesViewProps {
  meInitials?: string;
  meAvatar?: string;
  onUnreadCountChange?: (count: number) => void;
}

type ConfirmType = "delete" | "block" | "report";

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface RecipientUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

function fallbackAvatar(name: string) {
  return `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(
    name
  )}`;
}

function avatarUrl(value: string | null | undefined, name: string) {
  return resolveMediaUrl(value) || fallbackAvatar(name);
}

function normalizeFileUrl(url: string | null | undefined) {
  if (!url) return null;

  const markdownMatch = url.match(/^\[.*?\]\((.*?)\)$/);

  if (markdownMatch) {
    return resolveMediaUrl(markdownMatch[1]);
  }

  return resolveMediaUrl(url);
}

function formatMessageTime(date?: string | null) {
  if (!date) return "";

  try {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function MessagesView({
  meInitials = "MC",
  meAvatar,
  onUnreadCountChange,
}: MessagesViewProps) {
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const [conversations, setConversations] = useState<ApiConversation[]>(
    []
  );

  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [draftConversation, setDraftConversation] =
    useState<ApiConversation | null>(null);

  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [syncRevision, setSyncRevision] = useState(0);
  useSyncRefresh(["messages", "conversations"], () =>
    setSyncRevision((value) => value + 1)
  );

  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(
    meAvatar ?? null,
  );
  const [currentUserInitials, setCurrentUserInitials] = useState(meInitials);

  const [loadingConvos, setLoadingConvos] = useState(true);

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(
    null
  );

  const [recording, setRecording] = useState(false);

  const [recordingTime, setRecordingTime] = useState(0);

  const [showNewMessage, setShowNewMessage] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState("");

  const [recipientLoading, setRecipientLoading] = useState(false);

  const [recipientError, setRecipientError] = useState("");

  const [recipientUser, setRecipientUser] =
    useState<RecipientUser | null>(null);

  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmType | null>(null);

  const [confirmLoading, setConfirmLoading] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const currentUserIdRef = useRef<number | null>(null);

  const activeUserIdRef = useRef<number | null>(null);

  const recordingIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  const listRef = useRef<FlatList<ApiChatMessage> | null>(null);

  const audioRecorder = useAudioRecorder(
    RecordingPresets.HIGH_QUALITY
  );

  const audioRecorderState = useAudioRecorderState(
    audioRecorder,
    200
  );

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce(
      (total, conversation) =>
        total + (conversation.unread || 0),
      0
    );
  }, [conversations]);

  useEffect(() => {
    onUnreadCountChange?.(totalUnreadMessages);
  }, [totalUnreadMessages, onUnreadCountChange]);

  /*
   * ----------------------------------------
   * LOAD CURRENT USER
   * ----------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const response = await getCurrentUser();

        if (cancelled) return;

        const user = Array.isArray(response)
          ? null
          : (response as any)?.data ?? response;

        const id = Number(user?.id);
        const profile = user?.student ?? user?.company ?? {};
        const userAvatar =
          user?.avatar ??
          user?.avatar_url ??
          user?.profile_photo_url ??
          user?.profile_photo ??
          profile?.avatar ??
          profile?.profile_photo_url ??
          profile?.profile_photo ??
          profile?.logo_url ??
          profile?.logo ??
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
        if (!cancelled) {
          setCurrentUserId(null);
          currentUserIdRef.current = null;
        }
      }
    };

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [syncRevision]);

  /*
   * ----------------------------------------
   * SUPABASE REALTIME
   * ----------------------------------------
   */

  useEffect(() => {
    if (currentUserId == null) {
      return;
    }

    const channel = supabase
      .channel(`message_events_channel_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_events",
        },
        (payload) => {
          const newMessage = payload.new as any;

          const senderId = Number(newMessage.sender_id);

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

          if (!userId) {
            return;
          }

          const isIncomingMessage =
            receiverId === userId &&
            senderId !== userId;

          const isOutgoingMessage =
            senderId === userId &&
            receiverId !== userId;

          if (
            !isIncomingMessage &&
            !isOutgoingMessage
          ) {
            return;
          }

          const conversationUserId =
            isIncomingMessage
              ? senderId
              : receiverId;

          const isActiveConversation =
            activeId === conversationUserId;

          const fileUrl = normalizeFileUrl(
            newMessage.file_url || null
          );

          const lastMessage =
            newMessage.message ||
            (newMessage.type === "image"
              ? "📷 Image"
              : newMessage.type === "audio"
              ? "🎤 Voice message"
              : newMessage.type === "file"
              ? `📎 ${
                  newMessage.file_name ||
                  "File"
                }`
              : "Attachment");

          /*
           * Incoming message in currently opened chat
           */

          if (
            isIncomingMessage &&
            isActiveConversation
          ) {
            const incomingMessage: ApiChatMessage = {
              id: messageId,
              from: "them",
              text: newMessage.message || null,
              type: newMessage.type || "text",
              file_url: fileUrl,
              file_name:
                newMessage.file_name || null,
              file_type:
                newMessage.file_type || null,
              created_at:
                newMessage.created_at,
              time: formatMessageTime(
                newMessage.created_at
              ),
            };

            setMessages((prev) => {
              if (
                prev.some(
                  (message) =>
                    message.id === messageId
                )
              ) {
                return prev;
              }

              return [
                ...prev,
                incomingMessage,
              ];
            });

            setTimeout(() => {
              listRef.current?.scrollToEnd({
                animated: true,
              });
            }, 100);
          }

          /*
           * Update conversations
           */

          setConversations((prev) => {
            const existingConversation =
              prev.find(
                (conversation) =>
                  conversation.user_id ===
                  conversationUserId
              );

            if (!existingConversation) {
              return prev;
            }

            return prev
              .map((conversation) => {
                if (
                  conversation.user_id !==
                  conversationUserId
                ) {
                  return conversation;
                }

                const shouldIncreaseUnread =
                  isIncomingMessage &&
                  !isActiveConversation;

                return {
                  ...conversation,

                  last_message: lastMessage,

                  last_time: "Now",

                  unread:
                    shouldIncreaseUnread
                      ? (conversation.unread ||
                          0) + 1
                      : conversation.unread || 0,
                };
              })
              .sort((a, b) => {
                if (
                  a.user_id ===
                    conversationUserId &&
                  b.user_id !==
                    conversationUserId
                ) {
                  return -1;
                }

                if (
                  b.user_id ===
                    conversationUserId &&
                  a.user_id !==
                    conversationUserId
                ) {
                  return 1;
                }

                return 0;
              });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  /*
   * ----------------------------------------
   * LOAD CONVERSATIONS
   * ----------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      setLoadingConvos(true);
      setError(null);

      try {
        const data = await getConversations();

        if (cancelled) return;

        const convos = Array.isArray(data)
          ? data
          : (data as any)?.data ?? [];

        setConversations(convos);

      } catch {
        if (!cancelled) {
          setError(
            "Could not load conversations"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingConvos(false);
        }
      }
    };

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [syncRevision]);

  /*
   * ----------------------------------------
   * LOAD ACTIVE CONVERSATION
   * ----------------------------------------
   */

  useEffect(() => {
    if (activeUserId == null) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError(null);

      try {
        const res = await getConversation(
          activeUserId
        );

        if (!cancelled) {
          const messageList = Array.isArray(res)
            ? res
            : (res as any)?.data ?? [];

          const normalizedMessages =
            messageList.map(
              (message: ApiChatMessage) => ({
                ...message,
                file_url:
                  normalizeFileUrl(
                    message.file_url
                  ),
              })
            );

          setMessages(normalizedMessages);

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

          setTimeout(() => {
            listRef.current?.scrollToEnd({
              animated: false,
            });
          }, 150);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not load messages"
          );
        }
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

  /*
   * ----------------------------------------
   * RECORDING TIMER
   * ----------------------------------------
   */

  useEffect(() => {
    if (recording) {
      recordingIntervalRef.current =
        setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(
          recordingIntervalRef.current
        );

        recordingIntervalRef.current =
          null;
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(
          recordingIntervalRef.current
        );

        recordingIntervalRef.current =
          null;
      }
    };
  }, [recording]);

  /*
   * ----------------------------------------
   * HELPERS
   * ----------------------------------------
   */

  const activeConvo = useMemo(() => {
    return (
      conversations.find(
        (conversation) => conversation.user_id === activeUserId,
      ) ??
      (draftConversation?.user_id === activeUserId
        ? draftConversation
        : undefined)
    );
  }, [conversations, activeUserId, draftConversation]);

  const filteredConversations =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) =>
          conversation.name
            ?.toLowerCase()
            .includes(query)
      );
    }, [conversations, search]);

  const showToastMessage = useCallback(
    (message: string) => {
      setToast(message);

      setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  /*
   * ----------------------------------------
   * OPEN CONVERSATION
   * ----------------------------------------
   */

  const handleOpenConversation = (
    userId: number
  ) => {
    setDraftConversation(null);
    setActiveUserId(userId);

    activeUserIdRef.current = userId;

    setShowMenu(false);

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.user_id === userId
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation
      )
    );
  };

  /*
   * ----------------------------------------
   * CLOSE CONVERSATION
   * ----------------------------------------
   */

  const closeConversation = () => {
    setShowMenu(false);
    setDraftConversation(null);

    setActiveUserId(null);

    activeUserIdRef.current = null;

    setMessages([]);

    setMsg("");

    setSelectedFile(null);

    setShowAttachmentMenu(false);

    if (recording) {
      stopRecording();
    }
  };

  /*
   * ----------------------------------------
   * PICK IMAGE
   * ----------------------------------------
   */

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to your photos."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.9,
          }
        );

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      setSelectedFile({
        uri: asset.uri,
        name:
          asset.fileName ||
          `image-${Date.now()}.jpg`,
        type:
          asset.mimeType ||
          "image/jpeg",
        size: asset.fileSize,
      });

      setShowAttachmentMenu(false);
    } catch {
      Alert.alert(
        "Error",
        "Could not select image."
      );
    }
  };

  /*
   * ----------------------------------------
   * PICK FILE
   * ----------------------------------------
   */

  const pickFile = async () => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type:
          file.mimeType ||
          "application/octet-stream",
        size: file.size,
      });

      setShowAttachmentMenu(false);
    } catch {
      Alert.alert(
        "Error",
        "Could not select file."
      );
    }
  };

  /*
   * ----------------------------------------
   * REMOVE FILE
   * ----------------------------------------
   */

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  /*
   * ----------------------------------------
   * REFRESH MESSAGES
   * ----------------------------------------
   */

  const refreshMessages = async () => {
    if (activeUserId == null) {
      return;
    }

    try {
      const res = await getConversation(
        activeUserId
      );

      const messageList = Array.isArray(res)
        ? res
        : (res as any)?.data ?? [];

      const normalizedMessages =
        messageList.map(
          (message: ApiChatMessage) => ({
            ...message,
            file_url:
              normalizeFileUrl(
                message.file_url
              ),
          })
        );

      setMessages(normalizedMessages);

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

      setTimeout(() => {
        listRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    } catch {
      setError(
        "Could not refresh messages."
      );
    }
  };

  useEffect(() => {
    if (!isFocused) return;

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
      .channel(`student-message-full-sync-${currentUserId ?? "unknown"}`)
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

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncAll();
    });
    const refreshInterval = setInterval(() => void syncAll(), 3000);

    return () => {
      clearInterval(refreshInterval);
      subscription.remove();
      void supabase.removeChannel(channel);
    };
  }, [activeUserId, currentUserId, isFocused]);

  /*
   * ----------------------------------------
   * NEW MESSAGE
   * ----------------------------------------
   */

  const openNewMessage = () => {
    setRecipientEmail("");

    setRecipientUser(null);

    setRecipientError("");

    setShowNewMessage(true);
  };

  const closeNewMessage = () => {
    if (recipientLoading) {
      return;
    }

    setShowNewMessage(false);

    setRecipientEmail("");

    setRecipientUser(null);

    setRecipientError("");
  };

  /*
   * ----------------------------------------
   * FIND RECIPIENT
   * ----------------------------------------
   */

  const findRecipient = async () => {
    const email =
      recipientEmail.trim();

    if (!email) {
      setRecipientError(
        "Please enter an email address."
      );

      setRecipientUser(null);

      return;
    }

    setRecipientLoading(true);

    setRecipientError("");

    setRecipientUser(null);

    try {
      const user =
        await findUserByEmail(email);

      if (!user) {
        setRecipientError(
          "No student or company found with this email."
        );

        return;
      }

      setRecipientUser(user);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "No student or company found with this email.";

      setRecipientError(message);
    } finally {
      setRecipientLoading(false);
    }
  };

  /*
   * ----------------------------------------
   * START NEW CONVERSATION
   * ----------------------------------------
   */

  const startNewConversation =
    async () => {
      if (!recipientUser) {
        return;
      }

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

  /*
   * ----------------------------------------
   * SEND ATTACHMENT
   * ----------------------------------------
   */

  const sendAttachment = async () => {
    if (
      !selectedFile ||
      activeUserId == null ||
      sending
    ) {
      return;
    }

    setSending(true);

    setError(null);

    try {
      const file = selectedFile;

      const type =
        file.type.startsWith("image/")
          ? "image"
          : "file";

      /*
       * React Native file object.
       *
       * Your messages.ts sendMessage
       * must accept:
       *
       * {
       *   uri,
       *   name,
       *   type
       * }
       */

      await sendMessage(
        activeUserId,
        "",
        type,
        file as any
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
                    : `📎 ${file.name}`,

                last_time: "Now",
              }
            : conversation
        )
      );

      removeSelectedFile();

      await refreshMessages();
    } catch (error) {
      console.log(
        "SEND ATTACHMENT ERROR:",
        error
      );

      setError(
        "Could not send attachment."
      );

      Alert.alert(
        "Error",
        "Could not send attachment."
      );
    } finally {
      setSending(false);
    }
  };

  /*
   * ----------------------------------------
   * START RECORDING
   * ----------------------------------------
   */

  const startRecording = async () => {
    if (recording) {
      return;
    }

    if (activeUserId == null) {
      return;
    }

    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Microphone permission is required."
        );

        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await audioRecorder.prepareToRecordAsync();

      audioRecorder.record();

      setRecording(true);

      setRecordingTime(0);
    } catch (error) {
      console.log(
        "START RECORDING ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Could not start recording."
      );
    }
  };

  /*
   * ----------------------------------------
   * STOP RECORDING
   * ----------------------------------------
   */

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      await audioRecorder.stop();

      setRecording(false);

      const uri =
        audioRecorder.uri;

      if (!uri) {
        return;
      }

      const audioFile: SelectedFile = {
        uri,
        name: `voice-${Date.now()}.m4a`,
        type: "audio/m4a",
      };

      if (activeUserId == null) {
        return;
      }

      setSending(true);

      try {
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
      } catch (error) {
        console.log(
          "SEND AUDIO ERROR:",
          error
        );

        Alert.alert(
          "Error",
          "Could not send voice message."
        );
      } finally {
        setSending(false);
      }
    } catch (error) {
      console.log(
        "STOP RECORDING ERROR:",
        error
      );

      setRecording(false);
    }
  };

  /*
   * ----------------------------------------
   * RECORDING TIME
   * ----------------------------------------
   */

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

  /*
   * ----------------------------------------
   * SEND TEXT
   * ----------------------------------------
   */

  const handleSend = async () => {
    if (
      (!msg.trim() && !selectedFile) ||
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

    if (!text) {
      return;
    }

    setMsg("");

    setSending(true);

    setError(null);

    try {
      await sendMessage(
        activeUserId,
        text,
        "text"
      );

      setConversations((prev) => {
        const updated = prev.map(
          (conversation) =>
            conversation.user_id ===
            activeUserId
              ? {
                  ...conversation,

                  last_message: text,

                  last_time: "Now",
                }
              : conversation
        );

        const activeConversation =
          updated.find(
            (conversation) =>
              conversation.user_id ===
              activeUserId
          );

        const otherConversations =
          updated.filter(
            (conversation) =>
              conversation.user_id !==
              activeUserId
          );

        return activeConversation
          ? [
              activeConversation,
              ...otherConversations,
            ]
          : updated;
      });

      await refreshMessages();
    } catch (error) {
      console.log(
        "SEND MESSAGE ERROR:",
        error
      );

      setError(
        "Could not send message."
      );

      setMsg(text);

      Alert.alert(
        "Error",
        "Could not send message."
      );
    } finally {
      setSending(false);
    }
  };

  /*
   * ----------------------------------------
   * CONFIRM ACTIONS
   * ----------------------------------------
   */

  const openConfirm = (
    type: ConfirmType
  ) => {
    setShowMenu(false);

    setConfirmDialog(type);
  };

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
          confirmDialog === "delete"
        ) {
          await deleteConversation(
            activeUserId
          );

          setConversations((prev) =>
            prev.filter(
              (conversation) =>
                conversation.user_id !==
                activeUserId
            )
          );

          setActiveUserId(null);

          activeUserIdRef.current = null;

          setMessages([]);

          const refreshed = await getConversations();
          setConversations(
            Array.isArray(refreshed)
              ? refreshed
              : (refreshed as any)?.data ?? [],
          );

          setConfirmDialog(null);

          showToastMessage(
            "Conversation deleted."
          );
        } else if (
          confirmDialog === "block"
        ) {
          await blockUser(
            activeUserId
          );

          setConversations((prev) =>
            prev.filter(
              (conversation) =>
                conversation.user_id !==
                activeUserId
            )
          );

          setActiveUserId(null);

          activeUserIdRef.current = null;

          setMessages([]);

          setConfirmDialog(null);

          showToastMessage(
            "User blocked successfully."
          );
        } else if (
          confirmDialog === "report"
        ) {
          await reportUser(
            activeUserId,
            "Reported from conversation"
          );

          setConfirmDialog(null);

          showToastMessage(
            "User reported successfully."
          );
        }
      } catch {
        if (
          confirmDialog === "delete"
        ) {
          Alert.alert(
            "Error",
            "Could not delete conversation."
          );
        } else if (
          confirmDialog === "block"
        ) {
          Alert.alert(
            "Error",
            "Could not block user."
          );
        } else {
          Alert.alert(
            "Error",
            "Could not report user."
          );
        }

        setConfirmDialog(null);
      } finally {
        setConfirmLoading(false);
      }
    };

  /*
   * ----------------------------------------
   * CONFIRM DIALOG
   * ----------------------------------------
   */

  const getConfirmContent = () => {
    switch (confirmDialog) {
      case "delete":
        return {
          icon: Trash2,
          title: "Delete Conversation",
          message:
            "Are you sure you want to delete this conversation? You will not be able to recover it.",
          confirmLabel: "Delete",
        };

      case "block":
        return {
          icon: Ban,
          title: "Block User",
          message:
            "Are you sure you want to block this user? You will not be able to receive messages from this user.",
          confirmLabel: "Block",
        };

      case "report":
        return {
          icon: Flag,
          title: "Report User",
          message:
            "Are you sure you want to report this user?",
          confirmLabel: "Report",
        };

      default:
        return null;
    }
  };

  /*
   * ----------------------------------------
   * RENDER MESSAGE
   * ----------------------------------------
   */

  const renderMessage = ({
    item,
  }: {
    item: ApiChatMessage;
  }) => {
    const fileUrl =
      normalizeFileUrl(item.file_url);

    const isMe = item.from === "me";

    return (
      <View
        style={[
          styles.messageRow,
          isMe
            ? styles.messageRowMe
            : styles.messageRowThem,
        ]}
      >
        {!isMe ? (
          <Image
            source={{
              uri:
                avatarUrl(activeConvo?.avatar, activeConvo?.name || "User"),
            }}
            style={styles.messageAvatar}
          />
        ) : currentUserAvatar ? (
          <Image
            source={{
              uri: avatarUrl(currentUserAvatar, currentUserInitials),
            }}
            style={styles.messageAvatar}
          />
        ) : (
          <View
            style={[
              styles.messageAvatar,
              styles.myInitials,
            ]}
          >
            <Text
              style={styles.initialsText}
            >
              {currentUserInitials}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMe
              ? styles.messageBubbleMe
              : styles.messageBubbleThem,
          ]}
        >
          {item.type === "image" &&
          fileUrl ? (
            <Image
              source={{
                uri: fileUrl,
              }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : item.type ===
              "audio" &&
            fileUrl ? (
            <View
              style={
                styles.audioPlaceholder
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
                    color: isMe
                      ? "#fff"
                      : C.text,
                  },
                ]}
              >
                Voice message
              </Text>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Voice Message",
                    "Audio playback can be opened from the message file."
                  );
                }}
              >
                <Download
                  size={17}
                  color={
                    isMe
                      ? "#fff"
                      : C.accent
                  }
                />
              </TouchableOpacity>
            </View>
          ) : fileUrl ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  item.file_name ||
                    "File",
                  "Open this file from the message attachment."
                );
              }}
              style={styles.fileMessage}
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
                numberOfLines={1}
                style={[
                  styles.fileName,
                  {
                    color: isMe
                      ? "#fff"
                      : C.accent,
                  },
                ]}
              >
                {item.file_name ||
                  "Download file"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.messageText,
                {
                  color: isMe
                    ? "#fff"
                    : C.text,
                },
              ]}
            >
              {item.text}
            </Text>
          )}

          {item.type !== "image" &&
            item.type !== "audio" && (
              <Text
                style={[
                  styles.messageTime,
                  {
                    color: isMe
                      ? "rgba(255,255,255,0.7)"
                      : C.textMuted,
                  },
                ]}
              >
                {item.time ||
                  formatMessageTime(
                    item.created_at
                  )}
              </Text>
            )}
        </View>
      </View>
    );
  };

  /*
   * ----------------------------------------
   * CONVERSATION ITEM
   * ----------------------------------------
   */

  const renderConversation = ({
    item,
  }: {
    item: ApiConversation;
  }) => {
    const isActive =
      activeUserId === item.user_id;

    return (
      <TouchableOpacity
        onPress={() =>
          handleOpenConversation(
            item.user_id
          )
        }
        activeOpacity={0.7}
        style={[
          styles.conversationItem,
          isActive &&
            styles.conversationItemActive,
        ]}
      >
        <Image
          source={{
            uri:
              avatarUrl(item.avatar, item.name),
          }}
          style={styles.conversationAvatar}
        />

        <View
          style={styles.conversationInfo}
        >
          <View
            style={
              styles.conversationTopRow
            }
          >
            <Text
              numberOfLines={1}
              style={
                styles.conversationName
              }
            >
              {item.name}
            </Text>

            <Text
              style={
                styles.conversationTime
              }
            >
              {formatConversationTimestamp(item.last_time)}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            style={[
              styles.conversationLastMessage,
              item.unread > 0 &&
                styles.unreadMessage,
            ]}
          >
            {item.last_message ||
              "New conversation"}
          </Text>
        </View>

        {item.unread > 0 && (
          <View
            style={styles.unreadBadge}
          >
            <Text
              style={styles.unreadText}
            >
              {item.unread}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /*
   * ----------------------------------------
   * LOADING
   * ----------------------------------------
   */

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

  const confirmContent =
    getConfirmContent();

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/*
         * ========================================
         * HEADER
         * ========================================
         */}

        {(!isMobile || !activeConvo) && <View
          style={styles.mobileHeader}
        >
          <View style={styles.titleRow}>
            <Text
              style={styles.mobileTitle}
            >
              Messages
            </Text>

            {totalUnreadMessages >
              0 && (
              <View
                style={styles.headerBadge}
              >
                <Text
                  style={
                    styles.headerBadgeText
                  }
                >
                  {totalUnreadMessages}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={
              openNewMessage
            }
            style={styles.addButton}
          >
            <Plus
              size={19}
              color="#fff"
            />
          </TouchableOpacity>
        </View>}

        {/*
         * ========================================
         * SEARCH
         * ========================================
         */}

        {(!isMobile || !activeConvo) && <View
          style={styles.searchContainer}
        >
          <Search
            size={16}
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
            style={styles.searchInput}
          />
        </View>}

        {/*
         * ========================================
         * CONTENT
         * ========================================
         */}

        <View
          style={styles.mainContent}
        >
          {/*
           * CONVERSATIONS
           */}

          <View
            style={[
              styles.conversationsPanel,
              isMobile && styles.mobileFullPanel,
              isMobile && activeConvo && styles.hiddenPanel,
            ]}
          >
            {filteredConversations.length ===
            0 ? (
              <View
                style={
                  styles.emptyConversations
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
                  String(
                    item.user_id
                  )
                }
                renderItem={
                  renderConversation
                }
                showsVerticalScrollIndicator={
                  false
              }
              />
            )}
          </View>

          {/*
           * ========================================
           * ACTIVE CHAT
           * ========================================
           */}

          <View
            style={[
              styles.chatPanel,
              isMobile && !activeConvo && styles.hiddenPanel,
            ]}
          >
            {!activeConvo ? (
              <View
                style={
                  styles.noConversation
                }
              >
                <Text
                  style={
                    styles.noConversationText
                  }
                >
                  Select a conversation to start
                </Text>

                <TouchableOpacity
                  onPress={
                    openNewMessage
                  }
                  style={
                    styles.newMessageButton
                  }
                >
                  <Text
                    style={
                      styles.newMessageButtonText
                    }
                  >
                    New Message
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/*
                 * CHAT HEADER
                 */}

                <View
                  style={
                    styles.chatHeader
                  }
                >
                  {isMobile && (
                    <TouchableOpacity
                      onPress={closeConversation}
                      style={styles.headerIconButton}
                    >
                      <X size={19} color={C.text} />
                    </TouchableOpacity>
                  )}
                  <Image
                    source={{
                      uri: avatarUrl(activeConvo.avatar, activeConvo.name),
                    }}
                    style={
                      styles.chatHeaderAvatar
                    }
                  />

                  <View
                    style={
                      styles.chatHeaderInfo
                    }
                  >
                    <Text
                      style={
                        styles.chatHeaderName
                      }
                    >
                      {activeConvo.name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.headerIconButton
                    }
                    onPress={() =>
                      Alert.alert(
                        "Coming soon",
                        "Video calling will be available soon."
                      )
                    }
                  >
                    <Video
                      size={17}
                      color={
                        C.textSec
                      }
                    />
                  </TouchableOpacity>

                  <View
                    style={
                      styles.menuWrapper
                    }
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setShowMenu(
                          (prev) =>
                            !prev
                        )
                      }
                      style={
                        styles.headerIconButton
                      }
                    >
                      <MoreHorizontal
                        size={18}
                        color={
                          C.textSec
                        }
                      />
                    </TouchableOpacity>

                    {showMenu && (
                      <View
                        style={
                          styles.dropdownMenu
                        }
                      >
                        <TouchableOpacity
                          onPress={
                            closeConversation
                          }
                          style={
                            styles.menuItem
                          }
                        >
                          <X
                            size={15}
                            color={
                              C.text
                            }
                          />

                          <Text
                            style={
                              styles.menuItemText
                            }
                          >
                            Close Conversation
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            openConfirm(
                              "block"
                            )
                          }
                          style={
                            styles.menuItem
                          }
                        >
                          <Ban
                            size={15}
                            color={
                              C.text
                            }
                          />

                          <Text
                            style={
                              styles.menuItemText
                            }
                          >
                            Block User
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            openConfirm(
                              "report"
                            )
                          }
                          style={
                            styles.menuItem
                          }
                        >
                          <Flag
                            size={15}
                            color={
                              C.text
                            }
                          />

                          <Text
                            style={
                              styles.menuItemText
                            }
                          >
                            Report User
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            openConfirm(
                              "delete"
                            )
                          }
                          style={
                            styles.menuItem
                          }
                        >
                          <Trash2
                            size={15}
                            color="#EF4444"
                          />

                          <Text
                            style={[
                              styles.menuItemText,
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

                  <TouchableOpacity
                    onPress={
                      closeConversation
                    }
                    style={
                      styles.headerIconButton
                    }
                  >
                    <X
                      size={17}
                      color={
                        C.textSec
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/*
                 * MESSAGES
                 */}

                {loadingMessages ? (
                  <View
                    style={
                      styles.loadingMessages
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color={
                        C.accent
                      }
                    />
                  </View>
                ) : messages.length ===
                  0 ? (
                  <View
                    style={
                      styles.emptyChat
                    }
                  >
                    <Text
                      style={
                        styles.emptyChatText
                      }
                    >
                      Start the conversation
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(
                      item
                    ) =>
                      String(
                        item.id
                      )
                    }
                    renderItem={
                      renderMessage
                    }
                    contentContainerStyle={
                      styles.messagesList
                    }
                    showsVerticalScrollIndicator={
                      false
                    }
                    onContentSizeChange={() =>
                      listRef.current?.scrollToEnd(
                        {
                          animated:
                            false,
                        }
                      )
                    }
                  />
                )}

                {/*
                 * SELECTED FILE
                 */}

                {selectedFile && (
                  <View
                    style={
                      styles.selectedFileBar
                    }
                  >
                    {selectedFile.type.startsWith(
                      "image/"
                    ) ? (
                      <ImageIcon
                        size={17}
                        color={
                          C.accent
                        }
                      />
                    ) : (
                      <FileText
                        size={17}
                        color={
                          C.accent
                        }
                      />
                    )}

                    <Text
                      numberOfLines={1}
                      style={
                        styles.selectedFileName
                      }
                    >
                      {
                        selectedFile.name
                      }
                    </Text>

                    <TouchableOpacity
                      onPress={
                        removeSelectedFile
                      }
                    >
                      <X
                        size={17}
                        color={
                          C.textMuted
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/*
                 * INPUT
                 */}

                <View
                  style={
                    styles.inputArea
                  }
                >
                  <TouchableOpacity
                    onPress={() =>
                      setShowAttachmentMenu(
                        (prev) =>
                          !prev
                      )
                    }
                    style={
                      styles.inputIconButton
                    }
                  >
                    <Paperclip
                      size={18}
                      color={
                        C.textSec
                      }
                    />
                  </TouchableOpacity>

                  {showAttachmentMenu && (
                    <View
                      style={
                        styles.attachmentMenu
                      }
                    >
                      <TouchableOpacity
                        onPress={
                          pickImage
                        }
                        style={
                          styles.menuItem
                        }
                      >
                        <ImageIcon
                          size={16}
                          color={
                            C.text
                          }
                        />

                        <Text
                          style={
                            styles.menuItemText
                          }
                        >
                          Photo
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={
                          pickFile
                        }
                        style={
                          styles.menuItem
                        }
                      >
                        <FileText
                          size={16}
                          color={
                            C.text
                          }
                        />

                        <Text
                          style={
                            styles.menuItemText
                          }
                        >
                          File
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
                        editable={
                          !sending
                        }
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
                      disabled={
                        sending
                      }
                      style={
                        styles.micButton
                      }
                    >
                      {recording ? (
                        <Square
                          size={15}
                          color={
                            C.accent
                          }
                        />
                      ) : (
                        <Mic
                          size={17}
                          color={
                            C.textMuted
                          }
                        />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={
                      handleSend
                    }
                    disabled={
                      (!msg.trim() &&
                        !selectedFile) ||
                      sending ||
                      recording
                    }
                    style={[
                      styles.sendButton,
                      (msg.trim() ||
                        selectedFile) &&
                        styles.sendButtonActive,
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
              </>
            )}
          </View>
        </View>

        {/*
         * ========================================
         * NEW MESSAGE MODAL
         * ========================================
         */}

        <Modal
          visible={
            showNewMessage
          }
          transparent
          animationType="fade"
          onRequestClose={
            closeNewMessage
          }
        >
          <Pressable
            style={
              styles.modalOverlay
            }
            onPress={
              closeNewMessage
            }
          >
            <Pressable
              style={
                styles.newMessageModal
              }
              onPress={(e) =>
                e.stopPropagation()
              }
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
                  style={
                    styles.modalCloseButton
                  }
                >
                  <X
                    size={16}
                    color={
                      C.textMuted
                    }
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
                  value={
                    recipientEmail
                  }
                  onChangeText={(
                    value
                  ) => {
                    setRecipientEmail(
                      value
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

              {recipientError ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {recipientError}
                </Text>
              ) : null}

              {recipientUser && (
                <View
                  style={
                    styles.recipientCard
                  }
                >
                  <Image
                    source={{
                      uri:
                        recipientUser.avatar ||
                        fallbackAvatar(
                          recipientUser.name
                        ),
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
                          styles.roleBadgeText
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
                      styles.cancelButtonText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={
                    startNewConversation
                  }
                  disabled={
                    !recipientUser
                  }
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
            </Pressable>
          </Pressable>
        </Modal>

        {/*
         * ========================================
         * CONFIRM MODAL
         * ========================================
         */}

        <Modal
          visible={
            !!confirmDialog &&
            !!confirmContent
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setConfirmDialog(null)
          }
        >
          <Pressable
            style={
              styles.modalOverlay
            }
            onPress={() => {
              if (!confirmLoading) {
                setConfirmDialog(
                  null
                );
              }
            }}
          >
            <Pressable
              style={
                styles.confirmModal
              }
              onPress={(e) =>
                e.stopPropagation()
              }
            >
              {confirmContent && (
                <>
                  <View
                    style={
                      styles.confirmHeader
                    }
                  >
                    <View
                      style={
                        styles.confirmIcon
                      }
                    >
                      <confirmContent.icon
                        size={19}
                        color="#EF4444"
                      />
                    </View>

                    <Text
                      style={
                        styles.confirmTitle
                      }
                    >
                      {
                        confirmContent.title
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.confirmMessage
                    }
                  >
                    {
                      confirmContent.message
                    }
                  </Text>

                  <View
                    style={
                      styles.confirmActions
                    }
                  >
                    <TouchableOpacity
                      disabled={
                        confirmLoading
                      }
                      onPress={() =>
                        setConfirmDialog(
                          null
                        )
                      }
                      style={
                        styles.cancelButton
                      }
                    >
                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={
                        confirmLoading
                      }
                      onPress={
                        executeConfirm
                      }
                      style={
                        styles.confirmButton
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
                            styles.confirmButtonText
                          }
                        >
                          {
                            confirmContent.confirmLabel
                          }
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/*
         * ========================================
         * TOAST
         * ========================================
         */}

        {toast && (
          <View
            style={styles.toast}
          >
            <Text
              style={styles.toastText}
            >
              {toast}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setToast(null)
              }
            >
              <X
                size={16}
                color="#166534"
              />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  keyboardContainer: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },

  mobileHeader: {
    height: 62,
    paddingHorizontal: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mobileTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 999,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  headerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  addButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: {
    margin: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontFamily: F,
  },

  mainContent: {
    flex: 1,
    flexDirection: "row",
  },

  conversationsPanel: {
    width: "38%",
    minWidth: 130,
    maxWidth: 300,
    backgroundColor: C.surface,
    borderRightWidth: 1,
    borderRightColor: C.border,
  },

  chatPanel: {
    flex: 1,
    backgroundColor: C.bg,
  },

  mobileFullPanel: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    borderRightWidth: 0,
  },

  hiddenPanel: {
    display: "none",
  },

  conversationItem: {
    minHeight: 66,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  conversationItemActive: {
    backgroundColor: C.accentLight,
  },

  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
  },

  conversationInfo: {
    flex: 1,
    minWidth: 0,
  },

  conversationTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },

  conversationName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  conversationTime: {
    fontSize: 9,
    color: C.textMuted,
    fontFamily: F,
  },

  conversationLastMessage: {
    marginTop: 3,
    fontSize: 10,
    color: C.textSec,
    fontFamily: F,
  },

  unreadMessage: {
    fontWeight: "700",
    color: C.text,
  },

  unreadBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  unreadText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  emptyConversations: {
    padding: 20,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: F,
  },

  startButton: {
    backgroundColor: C.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  startButtonText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: "600",
    fontFamily: F,
  },

  noConversation: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  noConversationText: {
    color: C.textMuted,
    fontSize: 12,
    fontFamily: F,
    marginBottom: 12,
  },

  newMessageButton: {
    backgroundColor: C.accent,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  newMessageButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: F,
  },

  chatHeader: {
    minHeight: 60,
    paddingHorizontal: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  chatHeaderInfo: {
    flex: 1,
  },

  chatHeaderName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },

  menuWrapper: {
    position: "relative",
  },

  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: 38,
    width: 185,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    zIndex: 100,
  },

  menuItem: {
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  menuItemText: {
    flex: 1,
    fontSize: 11,
    color: C.text,
    fontFamily: F,
  },

  messagesList: {
    padding: 14,
    paddingBottom: 20,
    gap: 10,
  },

  messageRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
  },

  messageRowMe: {
    justifyContent: "flex-end",
  },

  messageRowThem: {
    justifyContent: "flex-start",
  },

  messageAvatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
  },

  myInitials: {
    backgroundColor: C.dark,
    alignItems: "center",
    justifyContent: "center",
  },

  initialsText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 1,
  },
  },

  messageBubbleMe: {
    backgroundColor: C.accent,
  },

  messageBubbleThem: {
    backgroundColor: C.surface,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: F,
  },

  messageTime: {
    marginTop: 3,
    fontSize: 8,
    fontFamily: F,
    textAlign: "right",
  },

  messageImage: {
    width: 210,
    height: 230,
    borderRadius: 10,
  },

  fileMessage: {
    maxWidth: 210,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  fileName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: F,
  },

  audioPlaceholder: {
    width: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  audioText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: F,
  },

  loadingMessages: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyChatText: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: F,
  },

  selectedFileBar: {
    minHeight: 42,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  selectedFileName: {
    flex: 1,
    fontSize: 11,
    color: C.text,
    fontFamily: F,
  },

  inputArea: {
    minHeight: 62,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    position: "relative",
  },

  inputIconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  attachmentMenu: {
    position: "absolute",
    left: 8,
    bottom: 58,
    width: 150,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    zIndex: 100,
  },

  textInputWrapper: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  recordingWrapper: {
    borderColor: C.accent,
  },

  messageInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 80,
    paddingVertical: 8,
    fontSize: 13,
    color: C.text,
    fontFamily: F,
  },

  micButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    marginRight: 7,
  },

  recordingText: {
    flex: 1,
    color: C.accent,
    fontSize: 12,
    fontFamily: F,
  },

  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonActive: {
    backgroundColor: C.accent,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  newMessageModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  modalSubtitle: {
    marginTop: 5,
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F,
  },

  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  fieldLabel: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
    fontFamily: F,
  },

  recipientRow: {
    flexDirection: "row",
    gap: 7,
  },

  recipientInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    paddingHorizontal: 12,
    fontSize: 12,
    color: C.text,
    fontFamily: F,
  },

  findButton: {
    height: 42,
    minWidth: 60,
    paddingHorizontal: 12,
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
    color: "#EF4444",
    fontSize: 10,
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
    width: 42,
    height: 42,
    borderRadius: 21,
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
    marginTop: 3,
    fontSize: 10,
    color: C.textMuted,
    fontFamily: F,
  },

  roleBadge: {
    alignSelf: "flex-start",
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: C.accentLight,
  },

  roleBadgeText: {
    color: C.accent,
    fontSize: 8,
    fontWeight: "700",
    fontFamily: F,
  },

  modalActions: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  cancelButton: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: C.textSec,
    fontSize: 11,
    fontFamily: F,
  },

  startConversationButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  startConversationText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: F,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
  },

  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  confirmIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    fontFamily: F,
  },

  confirmMessage: {
    color: C.textSec,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 22,
    fontFamily: F,
  },

  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  confirmButton: {
    minWidth: 70,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: F,
  },

  toast: {
    position: "absolute",
    top: 70,
    right: 14,
    left: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    zIndex: 999,
  },

  toastText: {
    flex: 1,
    color: "#166534",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: F,
  },
});
