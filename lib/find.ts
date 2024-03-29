import { WalkEntry } from "@std/fs/mod.ts";
import { dirname } from "@std/path/mod.ts";

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
    match: [/\.(bme|bms|bml)$/i],
  });
}

export function findPreviewFiles(
  bmsDir: string,
): AsyncIterableIterator<WalkEntry> {
  return walkFiles(bmsDir, {
    match: [/preview.*\.(wav|ogg)$/i],
  });
}

export function findAudioFiles(
  bmsDir: string,
): AsyncIterableIterator<WalkEntry> {
  return walkFiles(bmsDir, {
    match: [/.*\.(wav|ogg)$/i],
  });
}
