import * as log from "https://deno.land/std@0.88.0/log/mod.ts";

import {
  bms2wav,
  ConvertError,
  createPreview,
  removeSilentSection,
} from "./converter.ts";
import { withTempFile } from "./utils/file.ts";
import { first } from "./utils/iterator.ts";
import { findBmsFiles, findPreviewFiles } from "./find.ts";

export enum ResultType {
  BmsFileNotFound,
  PreviewFileFound,
  ConvertFailed,
  Success,
}

export async function bms2preview(bmsDir: string): Promise<ResultType> {
  const bmsFileEntry = await first(findBmsFiles(bmsDir));
  if (bmsFileEntry === undefined) {
    log.debug(`No BMS file was found: ${bmsDir}`);
    return ResultType.BmsFileNotFound;
  }
  const bmsPath = bmsFileEntry.path;

  for await (const _ of findPreviewFiles(bmsDir)) {
    log.debug(`The preview file was found: ${bmsDir}`);
    return ResultType.PreviewFileFound;
  }

  const result = await withTempFile({ suffix: ".wav" }, async (tmpWavPath) => {
    const previewPath = `${bmsDir}/preview_music.ogg`;

    log.debug(`Convert BMS files into a wav file: ${bmsDir}`);
    await bms2wav(bmsPath, tmpWavPath);

    log.debug(`Remove a silent section from the wav file: ${bmsDir}`);
    await removeSilentSection(tmpWavPath);

    log.debug(`Create a preview file from the wav file: ${bmsDir}`);
    await createPreview(tmpWavPath, previewPath);

    log.debug(`The preview file was created: ${bmsDir}`);
  }).catch((e) => {
    if (e instanceof ConvertError) {
      return ResultType.ConvertFailed;
    }
    throw e;
  });

  if (result !== undefined) {
    return result;
  }

  return ResultType.Success;
}
