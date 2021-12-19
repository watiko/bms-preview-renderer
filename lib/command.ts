import * as log from "@std/log/mod.ts";
import { resolve } from "@std/path/mod.ts";
import { Semaphore } from "semaphore/mod.ts";

import { findBmsDirs } from "./find.ts";
import { bms2preview, ResultType } from "./usecase.ts";
import { catcher } from "./utils/catcher.ts";

export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

async function ensureDir(path: string): Promise<string> {
  const statResult = await catcher(() => Deno.lstat(path));
  if (!statResult.ok) {
    if (statResult.error instanceof Deno.errors.NotFound) {
      throw new CommandError(`${path} does not exist.`);
    }
    throw statResult.error;
  }

  if (!statResult.value.isDirectory) {
    throw new CommandError(`${path} is not directory.`);
  }

  return resolve(path);
}

export async function bms2previewCommand(bmsDir: string) {
  bmsDir = await ensureDir(bmsDir);

  log.info(`start: ${bmsDir}`);
  const result = await bms2preview(bmsDir);
  switch (result.type) {
    case ResultType.BmsFileNotFound:
      log.error(`No BMS file was found: ${bmsDir}`);
      return;
    case ResultType.PreviewFileFound:
      log.info(`The preview file was found: ${bmsDir}`);
      return;
    case ResultType.ConvertFailed:
      log.error(`Failed to convert: ${bmsDir}`);
      return;
    case ResultType.Success:
      log.info(`done: ${bmsDir}`);
      return;
    default: {
      const _: never = result;
      throw new CommandError("unreachable");
    }
  }
}

export async function bms2previewRecursivelyCommand(
  rootDir: string,
  parallelism: number,
) {
  if (parallelism < 1) {
    throw new CommandError(`parallelism should be greater than 0`);
  }

  rootDir = await ensureDir(rootDir);

  const semaphore = new Semaphore(parallelism);
  const runTask = async (bmsDir: string, release: () => void) => {
    // without this runtime's tick is not progress?
    const reportHandler = setInterval(() => {
      log.debug(`Processing: ${bmsDir}`);
    }, 2000);
    try {
      await bms2previewCommand(bmsDir);
    } catch (e) {
      log.error(`Failed to runTask with dir(${bmsDir}): ${e}`);
    } finally {
      clearInterval(reportHandler);
      release();
    }
  };

  log.debug(`root: ${rootDir}`);
  for await (const bmsDir of findBmsDirs(rootDir)) {
    log.debug(`walk: ${bmsDir}`);

    const release = await semaphore.acquire();
    runTask(bmsDir, release);
  }
}
