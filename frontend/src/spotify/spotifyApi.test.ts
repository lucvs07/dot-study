import { describe, expect, it, vi } from "vitest";
import { SpotifyError, exchangeCode, getMyPlaylists } from "./spotifyApi";

const json = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("spotifyApi", () => {
  it("troca o code por token", async () => {
    const fetchFn = vi.fn(() => json(200, { access_token: "tok", expires_in: 3600 }));
    const t = await exchangeCode({
      clientId: "c",
      code: "k",
      verifier: "v",
      redirectUri: "r",
      fetchFn,
      now: () => 1000,
    });
    expect(t).toEqual({ accessToken: "tok", expiresAt: 1000 + 3600_000 });
  });

  it("lista playlists", async () => {
    const fetchFn = vi.fn(() =>
      json(200, { items: [{ id: "1", name: "Foco", uri: "spotify:playlist:1", images: [{ url: "img" }] }] }),
    );
    expect(await getMyPlaylists({ accessToken: "t", expiresAt: Infinity }, fetchFn)).toEqual([
      { id: "1", name: "Foco", uri: "spotify:playlist:1", imageUrl: "img" },
    ]);
  });

  it("403 (fora da allowlist do modo desenvolvedor) vira not_allowed", async () => {
    const fetchFn = vi.fn(() =>
      json(403, { error: { status: 403, message: "User not registered in the Developer Dashboard" } }),
    );
    await expect(getMyPlaylists({ accessToken: "t", expiresAt: Infinity }, fetchFn)).rejects.toMatchObject({
      kind: "not_allowed",
    });
  });

  it("401 vira expired e falha de rede vira network", async () => {
    await expect(
      getMyPlaylists(
        { accessToken: "t", expiresAt: Infinity },
        vi.fn(() => json(401, {})),
      ),
    ).rejects.toMatchObject({
      kind: "expired",
    });
    await expect(
      getMyPlaylists(
        { accessToken: "t", expiresAt: Infinity },
        vi.fn(() => Promise.reject(new TypeError("fail"))),
      ),
    ).rejects.toBeInstanceOf(SpotifyError);
  });
});
