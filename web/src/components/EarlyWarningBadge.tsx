interface Props {
  status: "NORMAL" | "WASPADA" | "TINGGI";
  size?: "sm" | "md";
}

export default function EarlyWarningBadge({ status, size = "md" }: Props) {
  const styles = {
    NORMAL: {
      bg: "bg-status-normal-bg",
      border: "border-status-normal-border",
      text: "text-status-normal",
      dot: "bg-status-normal",
      label: "Harga Stabil",
    },
    WASPADA: {
      bg: "bg-status-warning-bg",
      border: "border-status-warning-border",
      text: "text-status-warning",
      dot: "bg-status-warning",
      label: "Waspada Kenaikan",
    },
    TINGGI: {
      bg: "bg-status-critical-bg",
      border: "border-status-critical-border",
      text: "text-status-critical",
      dot: "bg-status-critical",
      label: "Lonjakan Kritis",
    },
  }[status];

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 gap-1"
      : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-label-caps font-semibold uppercase tracking-wider ${styles.bg} ${styles.border} ${styles.text} ${sizeClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${styles.dot} ${
          status !== "NORMAL" ? "animate-ping" : ""
        }`}
      />
      {styles.label}
    </span>
  );
}
