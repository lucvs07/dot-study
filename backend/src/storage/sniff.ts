export type Container = "webm" | "mp4" | "ogg" | "mpeg" | "wav";

export function sniffContainer(head: Buffer): Container | null {
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "webm";
  if (head.length >= 8 && head.toString("ascii", 4, 8) === "ftyp") return "mp4";
  if (head.length >= 4 && head.toString("ascii", 0, 4) === "OggS") return "ogg";
  if (head.length >= 3 && head.toString("ascii", 0, 3) === "ID3") return "mpeg";
  if (head.length >= 2 && head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return "mpeg";
  if (head.length >= 12 && head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WAVE")
    return "wav";
  return null;
}

export const ALLOWED: Record<"audio" | "video", Container[]> = {
  audio: ["webm", "ogg", "mp4", "mpeg", "wav"],
  video: ["webm", "mp4"],
};

export const EXTENSION: Record<Container, string> = { webm: "webm", mp4: "mp4", ogg: "ogg", mpeg: "mp3", wav: "wav" };
