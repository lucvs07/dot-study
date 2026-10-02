export function latency(range: [number, number] = [100, 300]): Promise<void> {
  const [min, max] = range;
  if (max <= 0) return Promise.resolve();
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
