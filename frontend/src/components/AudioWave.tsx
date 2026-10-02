export function AudioWave({ heights, color, dim }: { heights: number[]; color: string; dim?: boolean }) {
  return (
    <div className="flex items-center gap-[3px] w-full" style={{ height: 56 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all duration-100"
          style={{ height: `${h}%`, background: color, opacity: dim ? 0.4 : 0.85 }}
        />
      ))}
    </div>
  );
}
