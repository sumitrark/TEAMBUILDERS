"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bot,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  Users,
  Trophy,
  FolderGit2,
  UserCircle,
  X,
} from "lucide-react";

import {
  askHelpCenter,
  clearHelpCenterHistory,
  getHelpCenterHistory,
  HelpCenterMessage,
} from "@/services/helpCenter";


interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  category?: string;
  created_at?: string;
}


const QUICK_QUESTIONS = [
  {
    title: "Create a team",
    question: "How do I create a team?",
    icon: Users,
  },
  {
    title: "Join a hackathon",
    question: "How do I join a hackathon?",
    icon: Trophy,
  },
  {
    title: "Invite a teammate",
    question: "How do I invite a teammate?",
    icon: UserCircle,
  },
  {
    title: "Create a project",
    question: "How do I create a project?",
    icon: FolderGit2,
  },
];


function convertHistory(
  history: HelpCenterMessage[]
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  history.forEach((item) => {
    messages.push({
      id: `${item.id}-question`,
      role: "user",
      content: item.question,
      created_at: item.created_at,
    });

    messages.push({
      id: `${item.id}-answer`,
      role: "assistant",
      content: item.answer,
      category: item.category,
      created_at: item.created_at,
    });
  });

  return messages;
}


function formatTime(
  dateString?: string
) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}


export default function HelpCenterPage() {
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);


  // ==================================================
  // LOAD CONVERSATION HISTORY
  // ==================================================

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const history =
          await getHelpCenterHistory();

        setMessages(
          convertHistory(history)
        );
      } catch (err: any) {
        console.error(
          "Failed to load Help Center history:",
          err
        );

        if (
          err?.response?.status === 401
        ) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else {
          setError(
            "Unable to load your Help Center conversation."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);


  // ==================================================
  // SCROLL TO LATEST MESSAGE
  // ==================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);


  // ==================================================
  // SEND QUESTION
  // ==================================================

  async function handleSubmit(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const question =
      input.trim();

    if (!question || sending) {
      return;
    }

    setError("");
    setInput("");

    const temporaryMessage: ChatMessage = {
      id: `temporary-${Date.now()}`,
      role: "user",
      content: question,
      created_at: new Date().toISOString(),
    };

    setMessages(
      (previous) => [
        ...previous,
        temporaryMessage,
      ]
    );

    try {
      setSending(true);

      const response =
        await askHelpCenter(
          question
        );

      const assistantMessage: ChatMessage = {
        id: `${response.id}-answer`,
        role: "assistant",
        content: response.answer,
        category: response.category,
        created_at: response.created_at,
      };

      setMessages(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );

    } catch (err: any) {
      console.error(
        "Help Center request failed:",
        err
      );

      let errorMessage =
        "Something went wrong. Please try again.";

      if (
        err?.response?.status === 401
      ) {
        errorMessage =
          "Your session has expired. Please log in again.";
      } else if (
        err?.response?.data?.detail
      ) {
        errorMessage =
          err.response.data.detail;
      }

      setError(errorMessage);

    } finally {
      setSending(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }


  // ==================================================
  // QUICK QUESTION
  // ==================================================

  function askQuickQuestion(
    question: string
  ) {
    setInput(question);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }


  // ==================================================
  // CLEAR HISTORY
  // ==================================================

  async function handleClearHistory() {
    if (
      messages.length === 0 ||
      sending
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Clear your entire Help Center conversation?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await clearHelpCenterHistory();

      setMessages([]);

    } catch (err) {
      console.error(
        "Failed to clear Help Center history:",
        err
      );

      setError(
        "Unable to clear conversation."
      );
    }
  }


  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Sparkles size={20} />
            </div>

            <span className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              TEAMBUILDERS AI
            </span>

          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            AI Help Center
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Get help with teams, hackathons,
            projects, invitations, Matchmaker,
            Content Studio, and other
            TEAMBUILDERS features.
          </p>

        </div>


        {/* Clear conversation */}

        {messages.length > 0 && (
          <button
            type="button"
            onClick={
              handleClearHistory
            }
            disabled={sending}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            Clear Chat
          </button>
        )}

      </div>


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <div className="flex items-center gap-2">
            <X size={17} />
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">

        {/* ==================================================
            LEFT HELP MENU
        ================================================== */}

        <aside className="hidden lg:block">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="mb-4 flex items-center gap-2 px-2">

              <BookOpen
                size={18}
                className="text-violet-600"
              />

              <h2 className="font-bold text-slate-800">
                Help Topics
              </h2>

            </div>


            <div className="space-y-1">

              {[
                "Teams",
                "Hackathons",
                "Projects",
                "Invitations",
                "AI Matchmaker",
                "AI Content Studio",
                "Profile & Settings",
              ].map(
                (topic) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                  >
                    <span>
                      {topic}
                    </span>

                    <ChevronRight
                      size={15}
                    />
                  </div>
                )
              )}

            </div>

          </div>


          {/* AI status */}

          <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-sm">

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Bot size={19} />
              </div>

              <span className="font-semibold">
                AI Assistant
              </span>

            </div>

            <p className="mt-4 text-sm leading-6 text-violet-100">
              Ask questions naturally and
              get guidance based on the
              TEAMBUILDERS platform.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs text-violet-100">

              <span className="h-2 w-2 rounded-full bg-green-400" />

              Assistant available

            </div>

          </div>

        </aside>


        {/* ==================================================
            CHAT
        ================================================== */}

        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Chat header */}

          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm">
                <Bot size={23} />
              </div>

              <div>

                <h2 className="font-bold text-slate-900">
                  TEAMBUILDERS Assistant
                </h2>

                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">

                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  Ready to help

                </div>

              </div>

            </div>


            <div className="hidden items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 sm:flex">

              <HelpCircle
                size={14}
              />

              Ask anything

            </div>

          </div>


          {/* ==================================================
              MESSAGES
          ================================================== */}

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">

            {loading ? (

              <div className="flex min-h-[450px] items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">

                    <Loader2
                      size={23}
                      className="animate-spin"
                    />

                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Loading your conversation...
                  </p>

                </div>

              </div>

            ) : messages.length === 0 ? (

              <div className="flex min-h-[450px] flex-col items-center justify-center text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">

                  <Bot size={38} />

                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-900">
                  Hi! How can I help?
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Ask me anything about
                  TEAMBUILDERS. I can guide you
                  through teams, hackathons,
                  projects, invitations, and
                  our AI-powered features.
                </p>


                {/* Quick questions */}

                <div className="mt-7 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">

                  {QUICK_QUESTIONS.map(
                    (item) => {

                      const Icon =
                        item.icon;

                      return (
                        <button
                          key={
                            item.question
                          }
                          type="button"
                          onClick={() =>
                            askQuickQuestion(
                              item.question
                            )
                          }
                          className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50"
                        >

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-violet-100 group-hover:text-violet-600">

                            <Icon
                              size={18}
                            />

                          </div>

                          <div className="min-w-0">

                            <p className="text-sm font-semibold text-slate-800">
                              {item.title}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              Ask the assistant
                            </p>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

            ) : (

              <div className="mx-auto max-w-4xl space-y-6">

                {messages.map(
                  (message) => {

                    const isUser =
                      message.role ===
                      "user";

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        {!isUser && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">

                            <Bot
                              size={18}
                            />

                          </div>
                        )}


                        <div
                          className={`max-w-[80%] ${
                            isUser
                              ? "items-end"
                              : "items-start"
                          }`}
                        >

                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isUser
                                ? "rounded-br-md bg-violet-600 text-white"
                                : "rounded-bl-md bg-slate-100 text-slate-800"
                            }`}
                          >

                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {
                                message.content
                              }
                            </p>

                          </div>


                          <div
                            className={`mt-1 flex items-center gap-2 text-[10px] text-slate-400 ${
                              isUser
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >

                            {!isUser &&
                              message.category && (
                                <span className="capitalize">
                                  {message.category.replace(
                                    /_/g,
                                    " "
                                  )}
                                </span>
                              )}

                            {message.created_at && (
                              <span>
                                {formatTime(
                                  message.created_at
                                )}
                              </span>
                            )}

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}


                {/* Sending indicator */}

                {sending && (
                  <div className="flex gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">

                      <Bot
                        size={18}
                      />

                    </div>

                    <div className="rounded-2xl rounded-bl-md bg-slate-100 px-5 py-3">

                      <div className="flex items-center gap-1">

                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                          style={{
                            animationDelay:
                              "150ms",
                          }}
                        />

                        <span
                          className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                          style={{
                            animationDelay:
                              "300ms",
                          }}
                        />

                      </div>

                    </div>

                  </div>
                )}

                <div
                  ref={messagesEndRef}
                />

              </div>
            )}

          </div>


          {/* ==================================================
              INPUT
          ================================================== */}

          <div className="border-t border-slate-100 bg-white p-4 sm:p-5">

            <form
              onSubmit={
                handleSubmit
              }
              className="mx-auto max-w-4xl"
            >

              <div className="relative rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-500/10">

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) =>
                    setInput(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key === "Enter" &&
                      !e.shiftKey
                    ) {
                      e.preventDefault();

                      handleSubmit();
                    }

                  }}
                  placeholder="Ask anything about TEAMBUILDERS..."
                  rows={2}
                  maxLength={2000}
                  disabled={sending}
                  className="w-full resize-none bg-transparent px-4 pb-12 pt-4 pr-14 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />


                {/* Character count */}

                <div className="absolute bottom-3 left-4 text-[10px] text-slate-400">
                  {input.length}/2000
                </div>


                {/* Send */}

                <button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    sending
                  }
                  className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Send message"
                >

                  {sending ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send
                      size={17}
                    />
                  )}

                </button>

              </div>


              <div className="mt-2 flex items-center justify-between px-1">

                <p className="text-[11px] text-slate-400">
                  Press Enter to send • Shift +
                  Enter for a new line
                </p>

                <div className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">

                  <MessageCircle
                    size={12}
                  />

                  Your conversations are
                  private

                </div>

              </div>

            </form>

          </div>

        </section>

      </div>

    </div>
  );
}