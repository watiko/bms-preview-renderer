import * as log from "https://deno.land/std@0.88.0/log/mod.ts";
import * as path from "https://deno.land/std@0.88.0/path/mod.ts";

import { withTempFile } from "./utils/fs.ts";
import { findAudioFiles } from "./find.ts";

async function runCmd(
  cmd: string[],
): Promise<{ status: Deno.ProcessStatus; stdout: string; stderr: string }> {
  const process = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });
  const [status, rawStdout, rawStderr] = await Promise.all([
    process.status(),
    process.output(),
    process.stderrOutput(),
  ]);

  const stdout = new TextDecoder().decode(rawStdout);
  const stderr = new TextDecoder().decode(rawStderr);

  return {
    status,
    stdout,
    stderr,
  };
}

export class ConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export async function bms2wav(
  bmsPath: string,
  outputWavPath: string,
): Promise<void> {
  const { status, stderr } = await runCmd([
    "bms-renderer",
    bmsPath,
    outputWavPath,
  ]);

  if (!status.success) {
    throw new ConvertError(`bms-renderer was failed: ${stderr}`);
  }
}

export async function createPreview(
  wavPath: string,
  outputPreviewPath: string,
): Promise<void> {
  const cmd = [
    "sox",
    // in
    wavPath,
    // quality
    "-C",
    "5",
    // out
    outputPreviewPath,
    // remove silent section
    "vad",
    // trim
    "trim",
    "0",
    "10",
  ];

  log.debug(`Creating a preview...: ${JSON.stringify(cmd)}`);
  const { status, stderr } = await runCmd(cmd);

  if (!status.success) {
    throw new ConvertError(`sox was failed to create preview: ${stderr}`);
  }
}

async function readSampleRate(audioPath: string): Promise<number> {
  const { status, stdout, stderr } = await runCmd([
    "sox",
    "--i",
    "-r",
    audioPath,
  ]);

  if (!status.success) {
    throw new ConvertError(`sox was failed to read sample rate: ${stderr}`);
  }

  return parseInt(stdout, 10);
}

async function readChannelsNumber(audioPath: string): Promise<number> {
  const { status, stdout, stderr } = await runCmd([
    "sox",
    "--i",
    "-c",
    audioPath,
  ]);

  if (!status.success) {
    throw new ConvertError(
      `sox was failed to read number of channels: ${stderr}`,
    );
  }

  return parseInt(stdout, 10);
}

async function resampleAs44100(audioPath: string): Promise<void> {
  if ((await readSampleRate(audioPath)) === 44100) {
    return;
  }

  const ext = path.extname(audioPath);
  await withTempFile({ suffix: `.${ext}` }, async (tmpPath) => {
    const { status, stderr } = await runCmd([
      "sox",
      audioPath,
      "-r",
      "44100",
      tmpPath,
    ]);

    if (!status.success) {
      throw new ConvertError(`sox was failed to resample: ${stderr}`);
    }

    await Deno.copyFile(tmpPath, audioPath);
  });
}

async function mono2stereo(audioPath: string): Promise<void> {
  if ((await readChannelsNumber(audioPath)) === 2) {
    return;
  }

  const ext = path.extname(audioPath);
  await withTempFile({ suffix: `.${ext}` }, async (tmpPath) => {
    const { status, stderr } = await runCmd([
      "sox",
      audioPath,
      "-c",
      "2",
      tmpPath,
    ]);

    if (!status.success) {
      throw new ConvertError(`sox was failed to mono2stereo: ${stderr}`);
    }

    await Deno.copyFile(tmpPath, audioPath);
  });
}

export async function makeAllAudioFilesAcceptable(
  bmsDir: string,
): Promise<void> {
  for await (const entry of findAudioFiles(bmsDir)) {
    await resampleAs44100(entry.path);
    await mono2stereo(entry.path);
  }
}
