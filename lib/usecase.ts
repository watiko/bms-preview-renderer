import * as log from "https://deno.land/std@0.88.0/log/mod.ts";

import {
  bms2wav,
  ConvertError,
  createPreview,
  resampleAllAudioFiles,
} from "./converter.ts";
import {
  ensureLinkRecursively,
  withTempDir,
  withTempFile,
} from "./utils/fs.ts";
import { first } from "./utils/iterator.ts";
import { findBmsFiles, findPreviewFiles } from "./find.ts";

export enum ResultType {
  BmsFileNotFound,
  PreviewFileFound,
  ConvertFailed,
  Success,
}

export type PreviewResult = {
  type:
    | ResultType.BmsFileNotFound
    | ResultType.PreviewFileFound
    | ResultType.ConvertFailed;
} | {
  type: ResultType.Success;
  previewPath: string;
};

export async function bms2previewWithResample(
  bmsDir: string,
): Promise<PreviewResult> {
  return await withTempDir({}, async (tmpBmsDir) => {
    const previewFileName = "preview_music.ogg";
    const previewFilePath = `${bmsDir}/${previewFileName}`;

    await ensureLinkRecursively(bmsDir, tmpBmsDir);
    await resampleAllAudioFiles(tmpBmsDir);

    const result = await bms2preview({
      bmsDir: tmpBmsDir,
      previewFileName,
    });

    if (result.type !== ResultType.Success) {
      return result;
    }

    await Deno.copyFile(result.previewPath, previewFilePath);

    return {
      type: ResultType.Success,
      previewPath: previewFilePath,
    };
  });
}

export async function bms2preview(p: {
  bmsDir: string;
  previewFileName: string;
}): Promise<PreviewResult> {
  const previewPath = `${p.bmsDir}/${p.previewFileName}`;

  const bmsFileEntry = await first(findBmsFiles(p.bmsDir));
  if (bmsFileEntry === undefined) {
    log.debug(`No BMS file was found: ${p.bmsDir}`);
    return { type: ResultType.BmsFileNotFound };
  }
  const bmsPath = bmsFileEntry.path;

  for await (const _ of findPreviewFiles(p.bmsDir)) {
    log.debug(`The preview file was found: ${p.bmsDir}`);
    return { type: ResultType.PreviewFileFound };
  }

  const result: ResultType.ConvertFailed | undefined = await withTempFile({
    suffix: ".wav",
  }, async (tmpWavPath) => {
    log.debug(`Convert BMS files into a wav file: ${p.bmsDir}`);
    await bms2wav(bmsPath, tmpWavPath);

    log.debug(`Create a preview file from the wav file: ${p.bmsDir}`);
    await createPreview(tmpWavPath, previewPath);

    log.debug(`The preview file was created: ${p.bmsDir}`);

    return undefined;
  }).catch((e) => {
    if (e instanceof ConvertError) {
      log.error(e.message);
      return ResultType.ConvertFailed;
    }
    throw e;
  });

  if (result !== undefined) {
    return { type: result };
  }

  return { type: ResultType.Success, previewPath };
}
