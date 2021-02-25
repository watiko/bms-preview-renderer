import { WalkEntry } from "https://deno.land/std@0.88.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.88.0/path/mod.ts";

import { walkFiles } from "./utils/fs.ts";

export async function* findBmsDirs(root: string): AsyncGenerator<string> {
  const emitted = new Set();
  for await (const bmsFile of findBmsFiles(root)) {
    const bmsDir = dirname(bmsFile.path);
    if (emitted.has(bmsDir)) {
      continue;
    }

    yield bmsDir;
    emitted.add(bmsDir);
  }
}

export function findBmsFiles(bmsDir: string): AsyncIterableIterator<WalkEntry> {
  return walkFiles(bmsDir, {
    match: [/\.(bme|bms|bml)$/],
  });
}

export function findPreviewFiles(
  bmsDir: string,
): AsyncIterableIterator<WalkEntry> {
  return walkFiles(bmsDir, {
    match: [/preview.*\.(wav|ogg)$/],
  });
}

export function findAudioFiles(
  bmsDir: string,
): AsyncIterableIterator<WalkEntry> {
  return walkFiles(bmsDir, {
    match: [/.*\.(wav|ogg)$/],
  });
}
