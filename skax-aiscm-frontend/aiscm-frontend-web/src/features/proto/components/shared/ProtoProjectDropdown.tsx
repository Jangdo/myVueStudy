"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type ProtoProjectOption = {
  id: number;
  name: string;
  meta: string;
  badgeLabel: string;
  badgeClass: "orange" | "green" | "blue" | "yellow" | "accent";
};

const BADGE_STYLES: Record<ProtoProjectOption["badgeClass"], CSSProperties> = {
  orange: { background: "var(--orange-light)", color: "var(--orange)" },
  green: { background: "var(--green-light)", color: "var(--green)" },
  blue: { background: "var(--blue-light)", color: "var(--blue)" },
  yellow: { background: "var(--yellow-light)", color: "var(--yellow)" },
  accent: { background: "var(--accent-light)", color: "var(--accent2)" },
};

type Props = {
  label: string;
  dropdownTitle: string;
  options: ProtoProjectOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  showMeta?: boolean;
  showBadge?: boolean;
};

/** prototype `ProjectProtoDropdown` */
export function ProtoProjectDropdown({
  label,
  dropdownTitle,
  options,
  selectedId,
  onSelect,
  emptyMessage = "표시할 프로젝트가 없습니다.",
  showMeta = true,
  showBadge = true,
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

  const badgeStyle = selected ? BADGE_STYLES[selected.badgeClass] : BADGE_STYLES.accent;

  return (
    <div className="proj-dropdown-wrap" ref={wrapRef}>
      <div className="proj-dropdown-label">{label}</div>
      <button type="button" className="proj-selector" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span style={{ fontSize: 14 }}>📋</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{selected.name}</div>
              {showMeta ? <div style={{ fontSize: 11, color: "var(--text3)" }}>{selected.meta}</div> : null}
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text3)" }}>{emptyMessage}</div>
          )}
        </div>
        {selected && showBadge ? (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap", ...badgeStyle }}>
            {selected.badgeLabel}
          </span>
        ) : null}
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
              const st = BADGE_STYLES[o.badgeClass];
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
                      <div className="proj-opt-meta">{o.meta}</div>
                    </div>
                    <span className="proj-opt-badge" style={st}>
                      {o.badgeLabel}
                    </span>
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
