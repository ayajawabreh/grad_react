
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  Paperclip,
  Mic,
  MoreHorizontal,
  Video,
  Loader2,
  Ban,
  Flag,
  Trash2,
  FileText,
  Image as ImageIcon,
  X,
  Square,
  Plus,
} from "lucide-react";
import { C, F } from "../../constants/tokens";
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

function normalizeFileUrl(url: string | null) {
  if (!url) return null;

  const markdownMatch = url.match(/^\[.*?\]\((.*?)\)$/);

  if (markdownMatch) {
    return markdownMatch[1];
  }

  return url;
}

const confirmContent: Record<
  ConfirmType,
  {
    icon: any;
    title: string;
    message: string;
    confirmLabel: string;
  }
> = {
  delete: {
    icon: Trash2,
    title: "Delete Conversation",
    message:
      "Are you sure you want to delete this conversation? You will not be able to recover it.",
    confirmLabel: "Delete",
  },
  block: {
    icon: Ban,
    title: "Block User",
    message:
      "Are you sure you want to block this user? You will not be able to receive messages from this user.",
    confirmLabel: "Block",
  },
  report: {
    icon: Flag,
    title: "Report User",
    message: "Are you sure you want to report this user?",
    confirmLabel: "Report",
  },
};

export function MessagesView({
  meInitials = "MC",
  meAvatar,
  onUnreadCountChange,
}: MessagesViewProps) {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [, setError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState("");

  const [recipientUser, setRecipientUser] = useState<{
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmType | null>(null);

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: "",
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const currentUserIdRef = useRef<number | null>(null);
  const activeUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  const totalUnreadMessages = conversations.reduce(
    (total, conversation) => total + (conversation.unread || 0),
    0
  );

  useEffect(() => {
    onUnreadCountChange?.(totalUnreadMessages);
  }, [totalUnreadMessages, onUnreadCountChange]);

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

        if (id) {
          setCurrentUserId(id);
          currentUserIdRef.current = id;
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
  }, []);

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
          const receiverId = Number(newMessage.receiver_id);
          const messageId = Number(newMessage.message_id);

          const userId = currentUserIdRef.current;
          const activeId = activeUserIdRef.current;

          if (!userId) {
            return;
          }

          const isIncomingMessage =
            receiverId === userId && senderId !== userId;

          const isOutgoingMessage =
            senderId === userId && receiverId !== userId;

          if (!isIncomingMessage && !isOutgoingMessage) {
            return;
          }

          const conversationUserId = isIncomingMessage
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
              ? `📎 ${newMessage.file_name || "File"}`
              : "Attachment");

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
              file_name: newMessage.file_name || null,
              file_type: newMessage.file_type || null,
              created_at: newMessage.created_at,
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
                  (message) => message.id === messageId
                )
              ) {
                return prev;
              }

              return [...prev, incomingMessage];
            });
          }

          setConversations((prev) => {
            const existingConversation = prev.find(
              (conversation) =>
                conversation.user_id === conversationUserId
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
                  unread: shouldIncreaseUnread
                    ? (conversation.unread || 0) + 1
                    : conversation.unread || 0,
                };
              })
              .sort((a, b) => {
                if (
                  a.user_id === conversationUserId &&
                  b.user_id !== conversationUserId
                ) {
                  return -1;
                }

                if (
                  b.user_id === conversationUserId &&
                  a.user_id !== conversationUserId
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingConvos(true);
      setError(null);

      try {
        const data = await getConversations();

        if (cancelled) return;

        const convos = Array.isArray(data)
          ? data
          : (data as any)?.data ?? [];

        setConversations(convos);

        if (convos.length > 0) {
          setActiveUserId(convos[0].user_id);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load conversations");
        }
      } finally {
        if (!cancelled) {
          setLoadingConvos(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeUserId == null) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingMessages(true);

      try {
        const res = await getConversation(activeUserId);

        if (!cancelled) {
          const messageList = Array.isArray(res)
            ? res
            : (res as any).data;

          const normalizedMessages = (
            messageList ?? []
          ).map((message: ApiChatMessage) => ({
            ...message,
            file_url: normalizeFileUrl(message.file_url),
          }));

          setMessages(normalizedMessages);

          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.user_id === activeUserId
                ? {
                    ...conversation,
                    unread: 0,
                  }
                : conversation
            )
          );
        }
      } catch {
        if (!cancelled) {
          setError("Could not load messages");
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  useEffect(() => {
    let cancelled = false;

    const refreshConversations = async () => {
      try {
        const data = await getConversations();
        if (cancelled) return;
        const convos = Array.isArray(data) ? data : (data as any)?.data ?? [];
        setConversations(convos.map((conversation: ApiConversation) =>
          conversation.user_id === activeUserIdRef.current
            ? { ...conversation, unread: 0 }
            : conversation
        ));
      } catch {
        // Keep the last successful state during background refreshes.
      }
    };

    const interval = window.setInterval(refreshConversations, 5000);
    window.addEventListener("focus", refreshConversations);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshConversations);
    };
  }, []);

  useEffect(() => {
    if (activeUserId == null) return;
    let cancelled = false;

    const refreshActiveMessages = async () => {
      try {
        const response = await getConversation(activeUserId);
        if (cancelled) return;
        const list = Array.isArray(response) ? response : (response as any)?.data ?? [];
        const normalized = list.map((message: ApiChatMessage) => ({
          ...message,
          file_url: normalizeFileUrl(message.file_url),
        }));

        setMessages((current) => {
          const currentLast = current[current.length - 1]?.id;
          const nextLast = normalized[normalized.length - 1]?.id;
          return current.length === normalized.length && currentLast === nextLast
            ? current
            : normalized;
        });
      } catch {
        // Realtime remains primary; polling is a silent fallback.
      }
    };

    const interval = window.setInterval(refreshActiveMessages, 2500);
    window.addEventListener("focus", refreshActiveMessages);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshActiveMessages);
    };
  }, [activeUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const activeConvo = conversations.find(
    (c) => c.user_id === activeUserId
  );

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const showToastMessage = (message: string) => {
    setToast({
      show: true,
      message,
    });

    setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        show: false,
      }));
    }, 3500);
  };

  const handleOpenConversation = (userId: number) => {
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

  const closeConversation = () => {
    setShowMenu(false);
    setActiveUserId(null);
    activeUserIdRef.current = null;
    setMessages([]);
    setMsg("");
    setSelectedFile(null);
    setShowAttachmentMenu(false);
    setRecording(false);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setShowAttachmentMenu(false);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const refreshMessages = async () => {
    if (activeUserId == null) return;

    const res = await getConversation(activeUserId);

    const messageList = Array.isArray(res)
      ? res
      : (res as any).data;

    const normalizedMessages = (messageList ?? []).map(
      (message: ApiChatMessage) => ({
        ...message,
        file_url: normalizeFileUrl(message.file_url),
      })
    );

    setMessages(normalizedMessages);

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.user_id === activeUserId
          ? {
              ...conversation,
              unread: 0,
            }
          : conversation
      )
    );
  };

  const openNewMessage = () => {
    setRecipientEmail("");
    setRecipientUser(null);
    setRecipientError("");
    setShowNewMessage(true);
  };

  const closeNewMessage = () => {
    if (recipientLoading) return;

    setShowNewMessage(false);
    setRecipientEmail("");
    setRecipientUser(null);
    setRecipientError("");
  };

  const findRecipient = async () => {
    const email = recipientEmail.trim();

    if (!email) {
      setRecipientError("Please enter an email address.");
      setRecipientUser(null);
      return;
    }

    setRecipientLoading(true);
    setRecipientError("");
    setRecipientUser(null);

    try {
      const user = await findUserByEmail(email);

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

  const startNewConversation = async () => {
    if (!recipientUser) return;

    setShowNewMessage(false);
    setRecipientEmail("");
    setRecipientError("");

    const existingConversation = conversations.find(
      (c) => c.user_id === recipientUser.id
    );

    if (!existingConversation) {
      setConversations((prev) => [
        {
          user_id: recipientUser.id,
          name: recipientUser.name,
          avatar: recipientUser.avatar ?? null,
          last_message: "",
          last_time: "Now",
          unread: 0,
        },
        ...prev,
      ]);
    }

    setActiveUserId(recipientUser.id);
    activeUserIdRef.current = recipientUser.id;
    setMessages([]);
  };

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

      const type = file.type.startsWith("image/")
        ? "image"
        : "file";

      await sendMessage(
        activeUserId,
        "",
        type,
        file
      );

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user_id === activeUserId
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
    } catch {
      setError("Could not send attachment");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (recording) return;

    if (activeUserId == null) {
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(
          audioChunksRef.current,
          {
            type: "audio/webm",
          }
        );

        stream
          .getTracks()
          .forEach((track) => track.stop());

        const audioFile = new File(
          [audioBlob],
          `voice-${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );

        setSending(true);
        setError(null);

        try {
          await sendMessage(
            activeUserId,
            "",
            "audio",
            audioFile
          );

          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.user_id === activeUserId
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
          setError("Could not send voice message");
        } finally {
          setSending(false);
        }
      };

      mediaRecorderRef.current = recorder;

      recorder.start();

      setRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current =
        window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
    } catch {
      setError("Microphone permission is required");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();

    mediaRecorderRef.current = null;

    setRecording(false);

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  };

  async function handleSend() {
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
        const updated = prev.map((conversation) =>
          conversation.user_id === activeUserId
            ? {
                ...conversation,
                last_message: text,
                last_time: "Now",
              }
            : conversation
        );

        const activeConversation = updated.find(
          (conversation) =>
            conversation.user_id === activeUserId
        );

        const otherConversations = updated.filter(
          (conversation) =>
            conversation.user_id !== activeUserId
        );

        return activeConversation
          ? [
              activeConversation,
              ...otherConversations,
            ]
          : updated;
      });

      await refreshMessages();
    } catch {
      setError("Could not send message");
      setMsg(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent
  ) {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      handleSend();
    }
  }

  const openConfirm = (type: ConfirmType) => {
    setShowMenu(false);
    setConfirmError("");
    if (type === "report") setReportReason("");
    setConfirmDialog(type);
  };

  const closeConfirmDialog = () => {
    if (confirmLoading) return;

    setConfirmDialog(null);
    setConfirmError("");
    setReportReason("");
  };

  const handleDeleteConversation = () => {
    openConfirm("delete");
  };

  const handleBlock = () => {
    openConfirm("block");
  };

  const handleReport = () => {
    openConfirm("report");
  };

  const executeConfirm = async () => {
    if (
      !confirmDialog ||
      activeUserId == null
    ) {
      return;
    }

    if (
      confirmDialog === "report" &&
      reportReason.trim().length < 5
    ) {
      setConfirmError(
        "Please write a clear reason (at least 5 characters)."
      );
      return;
    }

    setConfirmError("");
    setConfirmLoading(true);

    try {
      if (confirmDialog === "delete") {
        await deleteConversation(activeUserId);

        setConversations((prev) =>
          prev.filter(
            (conversation) =>
              conversation.user_id !== activeUserId
          )
        );

        setActiveUserId(null);
        activeUserIdRef.current = null;
        setMessages([]);
        setConfirmDialog(null);
      } else if (confirmDialog === "block") {
        await blockUser(activeUserId);

        setConversations((prev) =>
          prev.filter(
            (conversation) =>
              conversation.user_id !== activeUserId
          )
        );

        setActiveUserId(null);
        activeUserIdRef.current = null;
        setMessages([]);
        setConfirmDialog(null);
      } else if (confirmDialog === "report") {
        const reportedMessage = [...messages]
          .reverse()
          .find((message) => message.from === "them");

        if (!reportedMessage) {
          setConfirmError(
            "There is no received message in this conversation to report."
          );
          return;
        }

        const response = await reportUser(
          reportedMessage.id,
          reportReason.trim()
        );

        setConfirmDialog(null);
        setReportReason("");
        sessionStorage.removeItem("careerbridge:admin-reports");

        showToastMessage(
          response?.message || "User reported successfully."
        );
      }
    } catch (requestError: any) {
      if (confirmDialog === "delete") {
        setError(
          "Could not delete conversation."
        );
      } else if (confirmDialog === "block") {
        setError(
          "Could not block user."
        );
      } else {
        setConfirmError(
          requestError?.response?.data?.message ||
            "Could not submit the report. Please try again."
        );
      }

      if (confirmDialog !== "report") {
        setConfirmDialog(null);
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loadingConvos) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100vh - 120px)",
        }}
      >
        <Loader2
          size={20}
          className="animate-spin"
          style={{
            color: C.textMuted,
          }}
        />
      </div>
    );
  }

  const activeConfirm = confirmDialog
    ? confirmContent[confirmDialog]
    : null;

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 120px)",
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        background: C.surface,
        position: "relative",
      }}
    >
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "14px 20px",
            borderRadius: 12,
            boxShadow:
              "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
            maxWidth: 400,
            fontFamily: F,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {toast.message}
          </span>

          <button
            onClick={() =>
              setToast((prev) => ({
                ...prev,
                show: false,
              }))
            }
            style={{
              background: "none",
              border: "none",
              color: "#166534",
              cursor: "pointer",
              marginLeft: 8,
              padding: 0,
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {confirmDialog && activeConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeConfirmDialog();
            }
          }}
        >
          <div
            style={{
              width: 380,
              maxWidth: "calc(100% - 32px)",
              background: C.surface,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.18)",
              padding: 22,
              fontFamily: F,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  color: "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <activeConfirm.icon size={18} />
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.text,
                }}
              >
                {activeConfirm.title}
              </h3>
            </div>

            <p
              style={{
                color: C.textSec,
                fontSize: 13,
                margin: "0 0 22px",
                lineHeight: 1.5,
              }}
            >
              {activeConfirm.message}
            </p>

            {confirmDialog === "report" && (
              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="report-reason"
                  style={{
                    display: "block",
                    color: C.text,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 7,
                  }}
                >
                  Reason for reporting
                </label>
                <textarea
                  id="report-reason"
                  value={reportReason}
                  onChange={(event) => {
                    setReportReason(event.target.value);
                    if (confirmError) setConfirmError("");
                  }}
                  disabled={confirmLoading}
                  maxLength={1000}
                  rows={4}
                  placeholder="Describe what happened..."
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    resize: "vertical",
                    border: `1px solid ${confirmError ? "#ef4444" : C.border}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: C.text,
                    background: C.surface,
                    fontFamily: F,
                    fontSize: 13,
                    lineHeight: 1.5,
                    outline: "none",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 5,
                  }}
                >
                  {confirmError && (
                    <span style={{ color: "#dc2626", fontSize: 12 }}>
                      {confirmError}
                    </span>
                  )}
                  <span
                    style={{
                      color: C.textSec,
                      fontSize: 11,
                      marginLeft: "auto",
                    }}
                  >
                    {reportReason.length}/1000
                  </span>
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={closeConfirmDialog}
                disabled={confirmLoading}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: confirmLoading
                    ? "default"
                    : "pointer",
                  opacity: confirmLoading
                    ? 0.6
                    : 1,
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: F,
                }}
              >
                Cancel
              </button>

              <button
                onClick={executeConfirm}
                disabled={confirmLoading}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 8,
                  cursor: confirmLoading
                    ? "default"
                    : "pointer",
                  opacity: confirmLoading
                    ? 0.7
                    : 1,
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: F,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {confirmLoading && (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                )}
                {activeConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewMessage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeNewMessage();
            }
          }}
        >
          <div
            style={{
              width: 400,
              maxWidth: "calc(100% - 32px)",
              background: C.surface,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.18)",
              padding: 22,
              fontFamily: F,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  New Message
                </p>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 11,
                    color: C.textMuted,
                  }}
                >
                  Start a conversation with a
                  student or company.
                </p>
              </div>

              <button
                onClick={closeNewMessage}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: C.bg,
                  color: C.textMuted,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={15} />
              </button>
            </div>

            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: C.text,
                marginBottom: 7,
              }}
            >
              To
            </label>

            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              <input
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(
                    e.target.value
                  );
                  setRecipientError("");
                  setRecipientUser(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    findRecipient();
                  }
                }}
                placeholder="Enter email address..."
                type="email"
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  outline: "none",
                  padding: "0 12px",
                  fontSize: 12,
                  color: C.text,
                  background: C.bg,
                  fontFamily: F,
                }}
              />

              <button
                onClick={findRecipient}
                disabled={
                  recipientLoading ||
                  !recipientEmail.trim()
                }
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "none",
                  background: C.accent,
                  color: "#fff",
                  cursor:
                    recipientLoading ||
                    !recipientEmail.trim()
                      ? "default"
                      : "pointer",
                  opacity:
                    recipientLoading ||
                    !recipientEmail.trim()
                      ? 0.6
                      : 1,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: F,
                }}
              >
                {recipientLoading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  "Find"
                )}
              </button>
            </div>

            {recipientError && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 11,
                  color: "#EF4444",
                  fontFamily: F,
                }}
              >
                {recipientError}
              </p>
            )}

            {recipientUser && (
              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <img
                  src={
                    recipientUser.avatar ||
                    fallbackAvatar(
                      recipientUser.name
                    )
                  }
                  alt={recipientUser.name}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    {recipientUser.name}
                  </p>

                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11,
                      color: C.textMuted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {recipientUser.email}
                  </p>

                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 5,
                      fontSize: 9,
                      fontWeight: 700,
                      color: C.accent,
                      background: C.accentLight,
                      padding: "3px 7px",
                      borderRadius: 6,
                    }}
                  >
                    {recipientUser.role}
                  </span>
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 20,
              }}
            >
              <button
                onClick={closeNewMessage}
                style={{
                  height: 38,
                  padding: "0 15px",
                  borderRadius: 9,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.textSec,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: F,
                }}
              >
                Cancel
              </button>

              <button
                onClick={startNewConversation}
                disabled={!recipientUser}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 9,
                  border: "none",
                  background: C.accent,
                  color: "#fff",
                  cursor: recipientUser
                    ? "pointer"
                    : "default",
                  opacity: recipientUser ? 1 : 0.5,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: F,
                }}
              >
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          width: 280,
          borderRight: `1px solid ${C.border}`,
          background: C.surface,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: `1px solid ${C.divider}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.text,
                  margin: 0,
                  fontFamily: F,
                }}
              >
                Messages
              </p>

              {totalUnreadMessages > 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: C.accent,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: F,
                  }}
                >
                  {totalUnreadMessages}
                </span>
              )}
            </div>

            <button
              onClick={openNewMessage}
              title="New message"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "none",
                background: C.accent,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 10,
              background: C.bg,
            }}
          >
            <Search
              size={13}
              style={{
                color: C.textMuted,
              }}
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 12,
                color: C.text,
                background: "transparent",
                fontFamily: F,
              }}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: "auto",
          }}
        >
          {filteredConversations.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  padding: 0,
                  fontSize: 12,
                  color: C.textMuted,
                  fontFamily: F,
                  margin: "0 0 12px",
                }}
              >
                No conversations yet
              </p>

              <button
                onClick={openNewMessage}
                style={{
                  border: "none",
                  background: C.accentLight,
                  color: C.accent,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: F,
                }}
              >
                Start a conversation
              </button>
            </div>
          )}

          {filteredConversations.map((c) => (
            <button
              key={c.user_id}
              onClick={() =>
                handleOpenConversation(
                  c.user_id
                )
              }
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                border: "none",
                cursor: "pointer",
                background:
                  activeUserId === c.user_id
                    ? C.accentLight
                    : "transparent",
                borderBottom: `1px solid ${C.divider}`,
                transition: "background 0.1s",
              }}
            >
              <img
                src={
                  c.avatar ||
                  fallbackAvatar(c.name)
                }
                alt={c.name}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  flex: 1,
                  textAlign: "left",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.text,
                      fontFamily: F,
                    }}
                  >
                    {c.name}
                  </span>

                  <span
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      fontFamily: F,
                    }}
                  >
                    {c.last_time}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: 11,
                    color: C.textSec,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: F,
                    fontWeight:
                      c.unread > 0
                        ? 600
                        : 400,
                  }}
                >
                  {c.last_message ||
                    "New conversation"}
                </p>
              </div>

              {c.unread > 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    padding: "0 4px",
                    borderRadius: "50%",
                    background: C.accent,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontFamily: F,
                  }}
                >
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: C.bg,
        }}
      >
        {!activeConvo ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: C.textMuted,
                  fontFamily: F,
                  margin: "0 0 12px",
                }}
              >
                Select a conversation to start
              </p>

              <button
                onClick={openNewMessage}
                style={{
                  border: "none",
                  background: C.accent,
                  color: "#fff",
                  borderRadius: 9,
                  padding: "9px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: F,
                }}
              >
                New Message
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "12px 20px",
                borderBottom: `1px solid ${C.border}`,
                background: C.surface,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <img
                src={
                  activeConvo.avatar ||
                  fallbackAvatar(
                    activeConvo.name
                  )
                }
                alt={activeConvo.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />

              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.text,
                    margin: 0,
                    fontFamily: F,
                  }}
                >
                  {activeConvo.name}
                </p>
              </div>

              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: 6,
                  position: "relative",
                }}
              >
                <button
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: C.divider,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.textSec,
                  }}
                >
                  <Video size={14} />
                </button>

                <button
                  onClick={() =>
                    setShowMenu((prev) => !prev)
                  }
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: C.divider,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.textSec,
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>

                <button
                  onClick={closeConversation}
                  title="Close conversation"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    background: C.divider,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.textSec,
                  }}
                >
                  <X size={14} />
                </button>

                {showMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: 40,
                      right: 38,
                      width: 180,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 6,
                      boxShadow:
                        "0 10px 30px rgba(0,0,0,0.12)",
                      zIndex: 20,
                    }}
                  >
                    <button
                      onClick={closeConversation}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "9px 10px",
                        border: "none",
                        borderRadius: 8,
                        background: "transparent",
                        color: C.text,
                        cursor: "pointer",
                        fontFamily: F,
                        fontSize: 12,
                        textAlign: "left",
                      }}
                    >
                      <X size={14} />
                      Close Conversation
                    </button>

                    <button
                      onClick={handleBlock}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "9px 10px",
                        border: "none",
                        borderRadius: 8,
                        background: "transparent",
                        color: C.text,
                        cursor: "pointer",
                        fontFamily: F,
                        fontSize: 12,
                        textAlign: "left",
                      }}
                    >
                      <Ban size={14} />
                      Block User
                    </button>

                    <button
                      onClick={handleReport}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "9px 10px",
                        border: "none",
                        borderRadius: 8,
                        background: "transparent",
                        color: C.text,
                        cursor: "pointer",
                        fontFamily: F,
                        fontSize: 12,
                        textAlign: "left",
                      }}
                    >
                      <Flag size={14} />
                      Report User
                    </button>

                    <button
                      onClick={
                        handleDeleteConversation
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "9px 10px",
                        border: "none",
                        borderRadius: 8,
                        background: "transparent",
                        color: "#EF4444",
                        cursor: "pointer",
                        fontFamily: F,
                        fontSize: 12,
                        textAlign: "left",
                      }}
                    >
                      <Trash2 size={14} />
                      Delete Conversation
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {loadingMessages ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{
                      color: C.textMuted,
                    }}
                  />
                </div>
              ) : messages.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: C.textMuted,
                    fontFamily: F,
                    marginTop: 20,
                  }}
                >
                  Start the conversation
                </p>
              ) : (
                messages.map((m: any) => {
                  const fileUrl =
                    normalizeFileUrl(
                      m.file_url
                    );

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        gap: 8,
                        flexDirection:
                          m.from === "me"
                            ? "row-reverse"
                            : "row",
                      }}
                    >
                      {m.from === "them" ? (
                        <img
                          src={
                            activeConvo.avatar ||
                            fallbackAvatar(
                              activeConvo.name
                            )
                          }
                          alt=""
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                            alignSelf: "flex-end",
                          }}
                        />
                      ) : meAvatar ? (
                        <img
                          src={meAvatar}
                          alt=""
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                            alignSelf: "flex-end",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: C.dark,
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                            flexShrink: 0,
                            alignSelf: "flex-end",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "#fff",
                              fontWeight: 700,
                            }}
                          >
                            {meInitials}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          maxWidth: "65%",
                          padding:
                            m.type === "audio"
                              ? "8px 12px"
                              : "10px 14px",
                          borderRadius: 16,
                          background:
                            m.from === "me"
                              ? C.accent
                              : C.surface,
                          color:
                            m.from === "me"
                              ? "#fff"
                              : C.text,
                          fontSize: 13,
                          fontFamily: F,
                          boxShadow:
                            "0 1px 3px rgba(0,0,0,0.06)",
                          lineHeight: 1.5,
                        }}
                      >
                        {m.type === "image" &&
                        fileUrl ? (
                          <img
                            src={fileUrl}
                            alt={
                              m.file_name ||
                              "Image"
                            }
                            style={{
                              maxWidth: 240,
                              maxHeight: 260,
                              borderRadius: 10,
                              display: "block",
                              objectFit: "cover",
                            }}
                          />
                        ) : m.type === "audio" &&
                          fileUrl ? (
                          <audio
                            controls
                            src={fileUrl}
                            style={{
                              width: 230,
                              maxWidth: "100%",
                            }}
                          />
                        ) : fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: 8,
                              color:
                                m.from === "me"
                                  ? "#fff"
                                  : C.accent,
                              textDecoration:
                                "none",
                              fontWeight: 600,
                            }}
                          >
                            <FileText
                              size={18}
                            />
                            {m.file_name ||
                              "Download file"}
                          </a>
                        ) : (
                          m.text
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={bottomRef} />
            </div>

            {selectedFile && (
              <div
                style={{
                  padding: "8px 16px",
                  borderTop: `1px solid ${C.border}`,
                  background: C.surface,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {selectedFile.type.startsWith(
                  "image/"
                ) ? (
                  <ImageIcon
                    size={16}
                    style={{
                      color: C.accent,
                    }}
                  />
                ) : (
                  <FileText
                    size={16}
                    style={{
                      color: C.accent,
                    }}
                  />
                )}

                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: C.text,
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: F,
                  }}
                >
                  {selectedFile.name}
                </span>

                <button
                  onClick={removeSelectedFile}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: C.textMuted,
                    display: "flex",
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <div
              style={{
                padding: "12px 16px",
                borderTop: `1px solid ${C.border}`,
                background: C.surface,
                display: "flex",
                gap: 8,
                alignItems: "center",
                position: "relative",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                onChange={handleFileSelect}
                style={{
                  display: "none",
                }}
              />

              <button
                onClick={() =>
                  setShowAttachmentMenu(
                    (prev) => !prev
                  )
                }
                style={{
                  color: C.textSec,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <Paperclip size={16} />
              </button>

              {showAttachmentMenu && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 58,
                    left: 14,
                    width: 170,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: 6,
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,0.12)",
                    zIndex: 20,
                  }}
                >
                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 9,
                      padding: "9px 10px",
                      border: "none",
                      borderRadius: 8,
                      background:
                        "transparent",
                      color: C.text,
                      cursor: "pointer",
                      fontFamily: F,
                      fontSize: 12,
                      textAlign: "left",
                    }}
                  >
                    <ImageIcon size={15} />
                    Photo or File
                  </button>
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 12,
                  border: `1px solid ${
                    recording
                      ? C.accent
                      : C.border
                  }`,
                }}
              >
                {recording ? (
                  <>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: C.accent,
                        animation:
                          "pulse 1s infinite",
                      }}
                    />

                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: C.accent,
                        fontFamily: F,
                      }}
                    >
                      Recording{" "}
                      {formatRecordingTime(
                        recordingTime
                      )}
                    </span>
                  </>
                ) : (
                  <input
                    value={msg}
                    onChange={(e) =>
                      setMsg(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={sending}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      color: C.text,
                      background:
                        "transparent",
                      fontFamily: F,
                    }}
                  />
                )}

                <button
                  onClick={
                    recording
                      ? stopRecording
                      : startRecording
                  }
                  disabled={sending}
                  style={{
                    color: recording
                      ? C.accent
                      : C.textMuted,
                    background: "none",
                    border: "none",
                    cursor: sending
                      ? "default"
                      : "pointer",
                    display: "flex",
                  }}
                >
                  {recording ? (
                    <Square size={14} />
                  ) : (
                    <Mic size={14} />
                  )}
                </button>
              </div>

              <button
                onClick={handleSend}
                disabled={
                  (!msg.trim() &&
                    !selectedFile) ||
                  sending ||
                  recording
                }
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background:
                    msg.trim() ||
                    selectedFile
                      ? C.accent
                      : C.divider,
                  border: "none",
                  cursor:
                    msg.trim() ||
                    selectedFile
                      ? "pointer"
                      : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                }}
              >
                {sending ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                    style={{
                      color: "#fff",
                    }}
                  />
                ) : (
                  <Send
                    size={14}
                    style={{
                      color:
                        msg.trim() ||
                        selectedFile
                          ? "#fff"
                          : C.textMuted,
                    }}
                  />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

