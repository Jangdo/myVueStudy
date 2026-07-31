"use client";

import { useEffect, useRef, useState } from "react";

type Option = { id: number; name: string };

type Props = {
  label: string;
  dropdownTitle: string;
  options: Option[];
  selectedId: string;
  onSelect: (id: string) => void;
  emptyMessage?: string;
};

/** prototype `ScopingProjectDropdown` */
export function ProtoScopingProjectDropdown({
  label,
  dropdownTitle,
  options,
  selectedId,
  onSelect,
  emptyMessage = "표시할 프로젝트가 없습니다.",
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => String(o.id) === selectedId);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="proj-dropdown-wrap" ref={wrapRef}>
      <div className="proj-dropdown-label">{label}</div>
      <button type="button" className="proj-selector" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span style={{ fontSize: 14 }}>📋</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{selected.name}</div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text3)" }}>{emptyMessage}</div>
          )}
        </div>
        <span style={{ color: "var(--text3)", fontSize: 11, marginLeft: 4 }}>{open ? "▴" : "▾"}</span>
      </button>

      <div className={"proj-dropdown" + (open ? " open" : "")}>
        <div className="proj-dropdown-head">
          <div className="proj-dropdown-head-title">{dropdownTitle}</div>
        </div>
        <div>
          {options.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: "var(--text3)" }}>{emptyMessage}</div>
          ) : (
            options.map((o) => {
              const sel = String(o.id) === selectedId;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={"proj-opt" + (sel ? " proj-opt-selected" : "")}
                  onClick={() => {
                    onSelect(String(o.id));
                    setOpen(false);
                  }}
                >
                  <div className="proj-opt-inner">
                    <div>
                      <div className="proj-opt-name" style={sel ? { color: "var(--accent2)" } : undefined}>
                        {o.name}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
