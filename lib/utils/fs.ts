import * as fs from "https://deno.land/std@0.88.0/fs/mod.ts";
import { join, relative } from "https://deno.land/std@0.88.0/path/mod.ts";

export async function withTempFile<T>(
  options: Deno.MakeTempOptions,
  fn: (tempFilePath: string) => Promise<T>,
): Promise<T> {
  const tmp = await Deno.makeTempFile(options);
  try {
    return fn(tmp);
  } finally {
    await Deno.remove(tmp);
  }
}

export async function withTempDir<T>(
  options: Deno.MakeTempOptions,
  fn: (tempFilePath: string) => Promise<T>,
): Promise<T> {
  const tmp = await Deno.makeTempDir(options);
  try {
    return fn(tmp);
  } finally {
    await Deno.remove(tmp, {
      recursive: true,
    });
  }
}

export async function ensureLinkRecursively(srcRoot: string, destRoot: string) {
  const walker = fs.walk(srcRoot, {
    includeFiles: true,
    includeDirs: false,
  });

  for await (const entry of walker) {
    const relativePath = relative(srcRoot, entry.path);
    const srcPath = join(srcRoot, relativePath);
    const destPath = join(destRoot, relativePath);
    await fs.ensureSymlink(srcPath, destPath);
  }
}

function include(path: string, match: RegExp[]): boolean {
  if (match && !match.some((pattern): boolean => !!path.match(pattern))) {
    return false;
  }
  return true;
}

// treat symlinked file as file
export async function* walkFiles(root: string, opts: {
  match: RegExp[];
}): AsyncIterableIterator<fs.WalkEntry> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);

    if (entry.isSymlink) {
      const realPath = await Deno.realPath(path);
      const info = await Deno.lstat(realPath);
      if (info.isFile) {
        // symlinked file
        if (include(path, opts.match)) {
          yield { path, ...entry };
        }
      }
      continue;
    }

    if (entry.isFile) {
      if (include(path, opts.match)) {
        yield { path, ...entry };
      }
    } else {
      yield* walkFiles(path, opts);
    }
  }
}
