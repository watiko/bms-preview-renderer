import { withTempFile } from "./utils/file.ts";

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
  const status = await Deno.run({
    cmd: ["bms-renderer", bmsPath, outputWavPath],
  }).status();

  if (!status.success) {
    throw new ConvertError("bms-renderer");
  }
}

export async function removeSilentSection(wavPath: string): Promise<void> {
  await withTempFile({ suffix: ".wav" }, async (tmpPath) => {
    const status = await Deno.run({
      cmd: ["sox", wavPath, tmpPath],
    }).status();

    if (!status.success) {
      throw new ConvertError("sox");
    }

    // move
    await Deno.copyFile(tmpPath, wavPath);
  });
}

export async function createPreview(
  wavPath: string,
  outputPreviewPath: string,
): Promise<void> {
  const status = await Deno.run({
    cmd: [
      "ffmpeg",
      "-i",
      wavPath,
      // 10秒で区切る
      // フェードイン・フェードアウトができると良さそうだが…
      "-t",
      "10",
      "-vn",
      "-ab",
      "160k",
      "-acodec",
      "libvorbis",
      "-f",
      "ogg",
      outputPreviewPath,
    ],
  }).status();

  if (!status.success) {
    throw new ConvertError("ffmpeg");
  }
}

async function readSampleRate(audioPath: string): Promise<number> {
  const process = Deno.run({
    cmd: ["sox", "--i", "-r", audioPath],
  });
  const status = await process.status();

  if (!status.success || process.stdout == null) {
    throw new ConvertError("Failed to read sample rate.");
  }

  const rawStdout = await Deno.readAll(process.stdout);
  const stdout = new TextDecoder().decode(rawStdout);
  return parseInt(stdout, 10);
}

export async function resampleAs44100(audioPath: string): Promise<void> {
  if ((await readSampleRate(audioPath)) === 44100) {
    return;
  }

  await withTempFile({ suffix: ".wav" }, async (tmpPath) => {
    const status = await Deno.run({
      cmd: ["sox", audioPath, "-r", "44100", tmpPath],
    }).status();

    if (!status.success) {
      throw new ConvertError("Failed to resample.");
    }

    // move
    await Deno.copyFile(tmpPath, audioPath);
  });
}
