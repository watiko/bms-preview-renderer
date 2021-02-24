export async function first<T>(
  it: AsyncIterableIterator<T>,
): Promise<T | undefined> {
  const result = await it.next();
  return result.done ? undefined : result.value;
}
