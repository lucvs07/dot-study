import { describe, expect, it } from "vitest";
import { buildAuthorizeUrl, challengeFromVerifier, generateVerifier } from "./pkce";

describe("PKCE", () => {
  it("verifier tem 64 caracteres do alfabeto permitido", () => {
    const v = generateVerifier();
    expect(v).toHaveLength(64);
    expect(v).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });
  it("challenge é SHA-256 base64url (vetor do RFC 7636)", async () => {
    expect(await challengeFromVerifier("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
  it("monta a URL de autorização", () => {
    const url = new URL(
      buildAuthorizeUrl({
        clientId: "abc",
        redirectUri: "http://127.0.0.1:8080/spotify/callback",
        challenge: "ch",
        state: "st",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://accounts.spotify.com/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "abc",
      response_type: "code",
      redirect_uri: "http://127.0.0.1:8080/spotify/callback",
      code_challenge_method: "S256",
      code_challenge: "ch",
      state: "st",
      scope: "playlist-read-private",
    });
  });
});
