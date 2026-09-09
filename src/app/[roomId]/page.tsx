"use client";

import {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDisplayName, setDisplayName } from "@/lib/displayName";
import {
  isValidRoomId,
  normalizeRoomId,
  roomExists,
  sendMessage,
  subscribeToMessages,
  type ChatMessage,
} from "@/lib/rooms";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = normalizeRoomId(params.roomId ?? "");

  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "missing">(
    "loading",
  );
  const [displayName, setDisplayNameState] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isValidRoomId(roomId)) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const exists = await roomExists(roomId);
        if (cancelled) return;
        if (!exists) {
          setStatus("missing");
          return;
        }
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setError("Could not load this room.");
          setStatus("missing");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const saved = getDisplayName();
    if (saved) {
      setDisplayNameState(saved);
      setNameDraft(saved);
    } else {
      setEditingName(true);
    }
  }, []);

  useEffect(() => {
    if (status !== "ready") return;

    const unsubscribe = subscribeToMessages(
      roomId,
      setMessages,
      (err) => setError(err.message),
    );
    return unsubscribe;
  }, [roomId, status]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const author = displayName.trim();
    if (!author) {
      setEditingName(true);
      setError("Set a display name before chatting.");
      return;
    }

    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await sendMessage(roomId, text, author);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function saveName(event: FormEvent) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    setDisplayNameState(trimmed);
    setEditingName(false);
    setError(null);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy link.");
    }
  }

  if (status === "loading") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4">
        <p className="text-sm text-muted">Loading room…</p>
      </main>
    );
  }

  if (status === "invalid" || status === "missing") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            {status === "invalid" ? "Invalid room code" : "Room not found"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {status === "invalid"
              ? "Room codes are exactly 5 characters (A–Z and 0–9)."
              : "This room does not exist. Create a new one from the home page."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col px-4 py-4">
      <header className="flex shrink-0 items-start justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Room
          </p>
          <p className="font-mono text-2xl font-semibold tracking-widest">
            {roomId}
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-1 text-xs text-accent hover:underline"
          >
            {copied ? "Link copied" : "Copy share link"}
          </button>
        </div>
        <div className="text-right">
          {editingName ? (
            <form onSubmit={saveName} className="flex flex-col items-end gap-1">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={40}
                placeholder="Your name"
                className="w-36 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
                autoFocus
              />
              <button
                type="submit"
                className="text-xs font-medium text-accent hover:underline"
              >
                Save name
              </button>
            </form>
          ) : (
            <>
              <p className="text-sm">
                Chatting as <span className="font-medium">{displayName}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(displayName);
                  setEditingName(true);
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                Change name
              </button>
            </>
          )}
          <div>
            <Link href="/" className="text-xs text-muted hover:text-foreground">
              Leave room
            </Link>
          </div>
        </div>
      </header>

      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet. Say hello.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => {
              const mine =
                displayName &&
                message.author.toLowerCase() === displayName.toLowerCase();
              return (
                <li
                  key={message.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <span className="mb-0.5 text-xs text-muted">
                    {message.author}
                  </span>
                  <span
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "bg-accent text-white"
                        : "bg-background text-foreground"
                    }`}
                  >
                    {message.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="mt-3 flex shrink-0 gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder="Type a message"
          className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2.5 outline-none"
          disabled={!displayName.trim()}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim() || !displayName.trim()}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
