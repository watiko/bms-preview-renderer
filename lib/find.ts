import {
  expandGlob,
  walk,
  WalkEntry,
} from "https://deno.land/std@0.88.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.88.0/path/mod.ts";

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

export const expandGlob2 = expandGlob;

export function findBmsFiles(bmsDir: string): AsyncIterableIterator<WalkEntry> {
  return walk(bmsDir, {
    includeDirs: false,
    includeFiles: true,
    match: [/\.(bme|bms|bml)$/],
  });
}

export function findPreviewFiles(
  bmsDir: string,
): AsyncIterableIterator<WalkEntry> {
  return walk(bmsDir, {
    includeDirs: false,
    includeFiles: true,
    match: [/preview.*\.(wav|ogg)$/],
  });
}
