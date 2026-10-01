export interface SaveInput {
  tmpPath: string;
  ext: string;
  mimeType: string;
}

export interface StorageDriver {
  save(input: SaveInput): Promise<{ url: string }>;
}
