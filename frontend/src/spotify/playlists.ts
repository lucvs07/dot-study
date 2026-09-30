// Playlists de foco públicas, curadas pelo dot.study (verificadas via oEmbed do Spotify).
export interface CuratedPlaylist {
  id: string;
  name: string;
  spotifyUri: string;
}

export const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  { id: "peaceful-piano", name: "Peaceful Piano", spotifyUri: "spotify:playlist:1u4F50HA53L3Jwxbnk9IeO" },
  { id: "lofi-deep-focus", name: "LoFi Deep Focus", spotifyUri: "spotify:playlist:0EAo4yaK5HfxrsQXAqaOLz" },
  { id: "lofi-study", name: "Lofi Study", spotifyUri: "spotify:playlist:10M75TUt3X1qbBhpuEw6el" },
];
