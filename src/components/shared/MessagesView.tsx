import { useState, useEffect, useRef } from "react";
import { Search, Send, Paperclip, Mic, MoreHorizontal, Video, Loader2 } from "lucide-react";
import { C, F } from "../../constants/tokens";
import {
  getConversations,
  getConversation,
  sendMessage,
  ApiConversation,
  ApiChatMessage,
} from "../../imports/messages";

import { supabase } from "../../lib/supabase";

interface MessagesViewProps {
  meInitials?: string;
  meAvatar?: string;
}

function fallbackAvatar(name: string) {
  return `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(name)}`;
}

export function MessagesView({ meInitials = "MC", meAvatar }: MessagesViewProps) {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel("message_events_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_events",
        },
        (payload) => {
          console.log("🔥 EVENT:", payload);

          const newMessage = payload.new as any;

          if (
            newMessage.sender_id !== activeUserId &&
            newMessage.receiver_id !== activeUserId
          ) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.message_id)) {
              return prev;
            }

            return [
              ...prev,
              {
                id: newMessage.message_id,
                from: newMessage.sender_id === activeUserId ? "them" : "me",
                text: newMessage.message,
                created_at: newMessage.created_at,
                time: new Date(newMessage.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ];
          });

          setConversations((prev) =>
            prev.map((c) =>
              c.user_id === activeUserId
                ? {
                    ...c,
                    last_message: newMessage.message,
                    last_time: "Now",
                  }
                : c
            )
          );
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeUserId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingConvos(true);
      setError(null);
      try {
        const data = await getConversations();
        if (cancelled) return;
        const convos = Array.isArray(data) ? data : (data as any)?.data ?? [];
        setConversations(convos);
        if (convos.length > 0) {
          setActiveUserId(convos[0].user_id);
        }
      } catch (e) {
        if (!cancelled) setError("Could not load conversations");
      } finally {
        if (!cancelled) setLoadingConvos(false);
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
          const messageList = Array.isArray(res) ? res : res.data;
          setMessages(messageList ?? []);
        }
      } catch (e) {
        if (!cancelled) setError("Could not load messages");
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConvo = conversations.find((c) => c.user_id === activeUserId);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSend() {
    if (!msg.trim() || activeUserId == null || sending) return;

    const text = msg.trim();
    setMsg("");
    setSending(true);

    try {
      await sendMessage(activeUserId, text);
    } catch (e) {
      setError("Could not send message");
      setMsg(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  if (loadingConvos) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 120px)" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: C.textMuted }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ width: 280, borderRight: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.divider}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 10px", fontFamily: F }}>Messages</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: C.bg }}>
            <Search size={13} style={{ color: C.textMuted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 12, color: C.text, background: "transparent", fontFamily: F }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {filteredConversations.length === 0 && (
            <p style={{ padding: 16, fontSize: 12, color: C.textMuted, fontFamily: F, textAlign: "center" }}>
              No conversations yet
            </p>
          )}

          {filteredConversations.map((c) => (
            <button
              key={c.user_id}
              onClick={() => setActiveUserId(c.user_id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                border: "none",
                cursor: "pointer",
                background: activeUserId === c.user_id ? C.accentLight : "transparent",
                borderBottom: `1px solid ${C.divider}`,
                transition: "background 0.1s",
              }}
            >
              <img
                src={c.avatar || fallbackAvatar(c.name)}
                alt={c.name}
                style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: F }}>{c.name}</span>
                  <span style={{ fontSize: 10, color: C.textMuted, fontFamily: F }}>{c.last_time}</span>
                </div>
                <p style={{ fontSize: 11, color: C.textSec, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: F }}>
                  {c.last_message}
                </p>
              </div>
              {c.unread > 0 && (
                <span style={{ minWidth: 18, height: 18, padding: "0 4px", borderRadius: "50%", background: C.accent, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F }}>
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg }}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 13, color: C.textMuted, fontFamily: F }}>Select a conversation to start</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={activeConvo.avatar || fallbackAvatar(activeConvo.name)}
                alt={activeConvo.name}
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0, fontFamily: F }}>{activeConvo.name}</p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {[Video, MoreHorizontal].map((Icon, i) => (
                  <button key={i} style={{ width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", background: C.divider, display: "flex", alignItems: "center", justifyContent: "center", color: C.textSec }}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {loadingMessages ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={18} className="animate-spin" style={{ color: C.textMuted }} />
                </div>
              ) : messages.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: F, marginTop: 20 }}>
                  Start the conversation
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: m.from === "me" ? "row-reverse" : "row" }}>
                    {m.from === "them" ? (
                      <img
                        src={activeConvo.avatar || fallbackAvatar(activeConvo.name)}
                        alt=""
                        style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0, alignSelf: "flex-end" }}
                      />
                    ) : meAvatar ? (
                      <img src={meAvatar} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0, alignSelf: "flex-end" }} />
                    ) : (
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end" }}>
                        <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{meInitials}</span>
                      </div>
                    )}
                    <div style={{ maxWidth: "65%", padding: "10px 14px", borderRadius: 16, background: m.from === "me" ? C.accent : C.surface, color: m.from === "me" ? "#fff" : C.text, fontSize: 13, fontFamily: F, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", lineHeight: 1.5 }}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.surface, display: "flex", gap: 8, alignItems: "center" }}>
              <button style={{ color: C.textSec, background: "none", border: "none", cursor: "pointer" }}>
                <Paperclip size={16} />
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={sending}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: C.text, background: "transparent", fontFamily: F }}
                />
                <button style={{ color: C.textMuted, background: "none", border: "none", cursor: "pointer" }}>
                  <Mic size={14} />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!msg.trim() || sending}
                style={{ width: 36, height: 36, borderRadius: 10, background: msg.trim() ? C.accent : C.divider, border: "none", cursor: msg.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: "#fff" }} />
                ) : (
                  <Send size={14} style={{ color: msg.trim() ? "#fff" : C.textMuted }} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}