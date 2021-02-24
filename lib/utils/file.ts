export async function withTempFile<T>(
  options: Deno.MakeTempOptions,
  fn: (tempFilePath: string) => Promise<T>,
): Promise<T> {
  const tmp = await Deno.makeTempFile(options);
  const result = await fn(tmp);
  await Deno.remove(tmp);
  return result;
}
