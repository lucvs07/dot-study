import type { MediaService } from "@/services/contracts";
import type { HttpClient } from "./http";

function extensionOf(type: string): string {
  if (type.includes("mp4")) return "mp4";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("wav")) return "wav";
  return "webm";
}

export function createApiMediaService(http: HttpClient): MediaService {
  return {
    async upload(blob, kind, durationSec) {
      const form = new FormData();
      form.append("kind", kind);
      form.append("durationSec", String(durationSec));
      form.append("file", blob, `gravacao.${extensionOf(blob.type)}`);
      return http.request<{ url: string; durationSec: number }>("POST", "/uploads", { form });
    },
    async resolveUrl(url) {
      return url.startsWith("/") ? `${http.baseUrl}${url}` : url;
    },
  };
}
