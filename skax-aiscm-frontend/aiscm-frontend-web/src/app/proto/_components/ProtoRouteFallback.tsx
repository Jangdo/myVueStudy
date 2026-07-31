interface ProtoRouteFallbackProps {
  label?: string;
}

export default function ProtoRouteFallback({ label = "불러오는 중…" }: ProtoRouteFallbackProps) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="loading-overlay__spinner" aria-hidden />
      <p className="loading-overlay__label">{label}</p>
    </div>
  );
}
