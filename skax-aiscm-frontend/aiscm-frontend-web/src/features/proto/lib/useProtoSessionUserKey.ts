"use client";

import { useEffect, useState } from "react";
import {
  PROTO_USER_KEY_CHANGED_EVENT,
  PROTO_USER_KEY_STORAGE_KEY,
  useProtoSessionContext,
} from "@/features/proto/lib/ProtoSessionContext";

function readStorageKey(): string {
  try {
    const v = window.sessionStorage.getItem(PROTO_USER_KEY_STORAGE_KEY);
    return v != null && v !== "" ? v : "am";
  } catch {
    return "am";
  }
}

/** `ProtoShellLayout` 과 동일한 세션 사용자 키 (기본 `am`) */
export function useProtoSessionUserKey(): string {
  const session = useProtoSessionContext();
  const [fallbackKey, setFallbackKey] = useState("am");

  useEffect(() => {
    if (session != null) return;

    const read = (): void => {
      setFallbackKey(readStorageKey());
    };
    const onKeyChanged = (): void => {
      read();
    };
    read();
    window.addEventListener("focus", read);
    window.addEventListener(PROTO_USER_KEY_CHANGED_EVENT, onKeyChanged);
    return () => {
      window.removeEventListener("focus", read);
      window.removeEventListener(PROTO_USER_KEY_CHANGED_EVENT, onKeyChanged);
    };
  }, [session]);

  if (session != null) {
    return session.userKey;
  }
  return fallbackKey;
}
