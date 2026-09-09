import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "./firebase";

export const ROOM_ID_PATTERN = /^[A-Z0-9]{5}$/;

const ROOM_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export type ChatMessage = {
  id: string;
  text: string;
  author: string;
  createdAt: Timestamp | null;
};

export function isValidRoomId(roomId: string): boolean {
  return ROOM_ID_PATTERN.test(roomId);
}

export function normalizeRoomId(input: string): string {
  return input.trim().toUpperCase();
}

function generateRoomId(): string {
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)];
  }
  return id;
}

export async function roomExists(roomId: string): Promise<boolean> {
  const snap = await getDoc(doc(getDb(), "rooms", roomId));
  return snap.exists();
}

export async function createRoom(createdBy: string): Promise<string> {
  const db = getDb();
  for (let attempt = 0; attempt < 10; attempt++) {
    const roomId = generateRoomId();
    const roomRef = doc(db, "rooms", roomId);
    const existing = await getDoc(roomRef);
    if (existing.exists()) continue;

    await setDoc(roomRef, {
      createdAt: serverTimestamp(),
      createdBy: createdBy.trim(),
    });
    return roomId;
  }
  throw new Error("Could not generate a unique room code. Try again.");
}

export async function sendMessage(
  roomId: string,
  text: string,
  author: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(getDb(), "rooms", roomId, "messages"), {
    text: trimmed,
    author: author.trim(),
    createdAt: serverTimestamp(),
  });
}

export function subscribeToMessages(
  roomId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const messagesQuery = query(
    collection(getDb(), "rooms", roomId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((messageDoc) => {
        const data = messageDoc.data();
        return {
          id: messageDoc.id,
          text: data.text as string,
          author: data.author as string,
          createdAt: (data.createdAt as Timestamp | null) ?? null,
        };
      });
      onMessages(messages);
    },
    (error) => {
      onError?.(error);
    },
  );
}
