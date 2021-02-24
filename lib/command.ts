import * as log from "https://deno.land/std@0.88.0/log/mod.ts";
import { exists } from "https://deno.land/std@0.88.0/fs/mod.ts";
import { Semaphore } from "https://deno.land/x/semaphore@v1.1.0/mod.ts";

import { findBmsDirs } from "./find.ts";
import { bms2preview, ResultType } from "./usecase.ts";

export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export async function bms2previewCommand(bmsDir: string) {
  if (!(await exists(bmsDir))) {
    throw new CommandError(`${bmsDir} does not exist.`);
  }

  const bmsDirInfo = await Deno.lstat(bmsDir);
  if (!bmsDirInfo.isDirectory) {
    throw new CommandError(`${bmsDir} is not directory.`);
  }

  log.info(`start: ${bmsDir}`);
  const result = await bms2preview(bmsDir);
  switch (result) {
    case ResultType.BmsFileNotFound:
      log.error(`No BMS file was found: ${bmsDir}`);
      Deno.exit(1);
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

  const semaphore = new Semaphore(parallelism);

  log.debug(`root: ${rootDir}`);
  for await (const bmsDir of findBmsDirs(rootDir)) {
    log.debug(`walk: ${bmsDir}`);

    const release = await semaphore.acquire();
    try {
      await bms2previewCommand(bmsDir);
    } catch (e) {
      if (e instanceof CommandError) {
        log.error(e);
        continue;
      }
      throw e;
    } finally {
      release();
    }
  }
}
