import { Blob as NodeBlob } from "node:buffer";
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// O Blob do jsdom não tem arrayBuffer()/text() e não sobrevive ao structuredClone do
// fake-indexeddb; o Blob do Node funciona nos dois ambientes (verificado).
if (typeof Blob === "undefined" || typeof Blob.prototype.arrayBuffer !== "function") {
  globalThis.Blob = NodeBlob as unknown as typeof Blob;
}
