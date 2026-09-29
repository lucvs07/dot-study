import { BRAND } from "@/domain/brand";

export function StudyLogo({
  dotColor = BRAND.teal,
  textColor = BRAND.dark,
  dotSize = 50,
}: {
  dotColor?: string;
  textColor?: string;
  dotSize?: number;
}) {
  return (
    <span
      style={{
        fontFamily: "'Cal Sans', 'Outfit', sans-serif",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "baseline",
      }}
    >
      <span style={{ fontSize: dotSize, color: dotColor, fontWeight: 600 }}>.</span>
      <span style={{ fontSize: dotSize * 0.64, color: textColor, fontWeight: 600 }}>study</span>
    </span>
  );
}
