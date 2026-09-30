// Wrapper fino sobre o iFrame API do Spotify (https://open.spotify.com/embed/iframe-api/v1).
// Carrega o script uma única vez e expõe um controller por elemento do DOM.
export interface EmbedController {
  loadUri(uri: string): void;
  togglePlay(): void;
  addListener(event: "playback_update", cb: (e: { data: { isPaused: boolean } }) => void): void;
  destroy(): void;
}
interface IFrameAPI {
  createController(
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: number },
    cb: (c: EmbedController) => void,
  ): void;
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

let apiPromise: Promise<IFrameAPI> | null = null;

export function loadIframeApi(): Promise<IFrameAPI> {
  apiPromise ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Não foi possível carregar o player do Spotify."));
    };
    document.body.appendChild(script);
  });
  return apiPromise;
}

export async function createController(el: HTMLElement, uri: string): Promise<EmbedController> {
  const api = await loadIframeApi();
  return new Promise((resolve) => api.createController(el, { uri, width: "100%", height: 80 }, resolve));
}
