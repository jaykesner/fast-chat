"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDisplayName, setDisplayName } from "@/lib/displayName";
import {
  createRoom,
  isValidRoomId,
  normalizeRoomId,
  roomExists,
} from "@/lib/rooms";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    const saved = getDisplayName();
    if (saved) setName(saved);
  }, []);

  function requireName(): string | null {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Pick a display name first.");
      return null;
    }
    setDisplayName(trimmed);
    return trimmed;
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const displayName = requireName();
    if (!displayName) return;

    setBusy("create");
    try {
      const roomId = await createRoom(displayName);
      router.push(`/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room.");
      setBusy(null);
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const displayName = requireName();
    if (!displayName) return;

    const roomId = normalizeRoomId(joinCode);
    if (!isValidRoomId(roomId)) {
      setError("Room codes are 5 characters (A–Z and 0–9).");
      return;
    }

    setBusy("join");
    try {
      const exists = await roomExists(roomId);
      if (!exists) {
        setError("Room not found. Check the code and try again.");
        setBusy(null);
        return;
      }
      router.push(`/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room.");
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Fast Chat</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a name, create a room, share the code.
        </p>

        <label className="mt-6 block text-sm font-medium" htmlFor="display-name">
          Display name
        </label>
        <input
          id="display-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Any name"
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent"
          autoComplete="nickname"
        />

        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleCreate} className="mt-6">
          <button
            type="submit"
            disabled={busy !== null}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {busy === "create" ? "Creating…" : "Create room"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          or join
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="XY1B2"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono uppercase tracking-widest outline-none focus:border-accent"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background disabled:opacity-60"
          >
            {busy === "join" ? "…" : "Join"}
          </button>
        </form>
      </div>
    </main>
  );
}
