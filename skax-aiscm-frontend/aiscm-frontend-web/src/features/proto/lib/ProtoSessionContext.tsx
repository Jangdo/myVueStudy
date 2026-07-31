"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const PROTO_USER_KEY_STORAGE_KEY = "proto-user-key";
export const PROTO_USER_KEY_CHANGED_EVENT = "proto-user-key-changed";

type ProtoSessionContextValue = {
  userKey: string;
  setUserKey: (next: string) => void;
};

const ProtoSessionContext = createContext<ProtoSessionContextValue | null>(null);

function readSessionUserKey(): string {
  try {
    const raw = window.sessionStorage.getItem(PROTO_USER_KEY_STORAGE_KEY);
    return raw != null && raw !== "" ? raw : "am";
  } catch {
    return "am";
  }
}

export function ProtoSessionProvider({ children }: { children: ReactNode }) {
  const [userKey, setUserKeyState] = useState("am");

  const setUserKey = useCallback((next: string) => {
    const normalized = next !== "" ? next : "am";
    setUserKeyState(normalized);
    try {
      window.sessionStorage.setItem(PROTO_USER_KEY_STORAGE_KEY, normalized);
    } catch {
      // no-op
    }
    window.dispatchEvent(new Event(PROTO_USER_KEY_CHANGED_EVENT));
  }, []);

  useEffect(() => {
    setUserKeyState(readSessionUserKey());
  }, []);

  const value = useMemo<ProtoSessionContextValue>(
    () => ({
      userKey,
      setUserKey,
    }),
    [setUserKey, userKey],
  );

  return <ProtoSessionContext.Provider value={value}>{children}</ProtoSessionContext.Provider>;
}

export function useProtoSessionContext(): ProtoSessionContextValue | null {
  return useContext(ProtoSessionContext);
}
