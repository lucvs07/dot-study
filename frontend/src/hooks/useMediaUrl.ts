import { useEffect, useState } from "react";
import { useServices } from "@/services/ServicesContext";

export function useMediaUrl(url: string | null) {
  const { media } = useServices();
  const [state, setState] = useState<{ src: string | null; error: unknown }>({ src: null, error: null });
  useEffect(() => {
    let alive = true;
    if (!url) {
      setState({ src: null, error: null });
      return;
    }
    media.resolveUrl(url).then(
      (src) => alive && setState({ src, error: null }),
      (error) => alive && setState({ src: null, error }),
    );
    return () => {
      alive = false;
    };
  }, [url, media]);
  return state;
}
