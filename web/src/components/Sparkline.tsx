import { useId } from "react";

interface Props {
  data: number[];
  status?: "NORMAL" | "WASPADA" | "TINGGI";
  height?: number;
  width?: number;
}

export default function Sparkline({
  data,
  status = "NORMAL",
  height = 36,
  width = 120,
}: Props) {
  const reactId = useId();
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const colors = {
    NORMAL: { stroke: "#16A34A", fill: "#16A34A" },
    WASPADA: { stroke: "#D97706", fill: "#D97706" },
    TINGGI: { stroke: "#DC2626", fill: "#DC2626" },
  }[status];

  const gradientId = `spark-grad-${status}-${reactId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      style={{ width: "100%", height: `${height}px` }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.fill} stopOpacity="0.25" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={colors.stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
