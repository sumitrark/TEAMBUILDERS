"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

type ChatMessage = {
  id: string;
  team_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
};

export default function TeamChatPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setError("");
      const response = await api.get(`/team-chat/${teamId}/messages`);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not load team messages.");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    void loadMessages();
  }, [teamId, loadMessages]);

  useEffect(() => {
    if (!teamId) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please sign in to open team chat.");
      return;
    }

    const base = api.defaults.baseURL || window.location.origin;
    const wsBase = base.replace(/^http/, "ws").replace(/\/$/, "");
    const socket = new WebSocket(
      `${wsBase}/team-chat/ws/${teamId}?token=${encodeURIComponent(token)}`
    );
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data);
        if (incoming.type === "error") {
          setError(incoming.detail || "Message could not be sent.");
          return;
        }
        if (incoming.id) {
          setMessages((current) =>
            current.some((item) => item.id === incoming.id)
              ? current
              : [...current, incoming as ChatMessage]
          );
        }
      } catch {
        setError("Received an unreadable chat message.");
      }
    };
    socket.onerror = () => setConnected(false);
    socket.onclose = () => setConnected(false);

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ content: trimmed }));
      setContent("");
      return;
    }

    // REST fallback still persists the message if the socket is unavailable.
    try {
      setSending(true);
      const response = await api.post(`/team-chat/${teamId}/messages`, {
        content: trimmed,
      });
      setMessages((current) =>
        current.some((item) => item.id === response.data.id)
          ? current
          : [...current, response.data]
      );
      setContent("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl flex-col p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <button onClick={() => router.push(`/dashboard/teams/${teamId}`)} className="mb-2 text-sm text-violet-700 hover:underline">
            ← Back to team
          </button>
          <h1 className="text-2xl font-bold">Team Workplace Chat</h1>
          <p className="text-sm text-gray-500">Share updates and coordinate with your teammates.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {connected ? "Live" : "Reconnecting / offline"}
        </span>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">Loading messages…</p>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl">💬</div>
              <h2 className="mt-3 font-semibold">Start the team conversation</h2>
              <p className="mt-1 text-sm text-gray-500">Your messages will appear here for all team members.</p>
            </div>
          ) : messages.map((message) => (
            <article key={message.id} className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{message.sender_name}</span>
                <time className="text-xs text-gray-500">{new Date(message.created_at).toLocaleString()}</time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{message.content}</p>
            </article>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p role="alert" className="border-t bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <form onSubmit={sendMessage} className="flex gap-2 border-t p-3 sm:p-4">
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={4000}
            placeholder="Write a message to your team…"
            aria-label="Message"
            className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  );
}