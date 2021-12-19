function isPromise<T>(obj: unknown): obj is Promise<T> {
  return (
    obj instanceof Promise ||
    (typeof obj === "object" &&
      obj !== null &&
      typeof (obj as { then?: unknown }).then === "function")
  );
}

type Result<L, R> = { ok: true; value: R } | { ok: false; error: L };

export function catcher<T>(fn: () => Promise<T>): Promise<Result<unknown, T>>;
export function catcher<T>(fn: () => T): Result<unknown, T>;
export function catcher<T>(
  fn: () => T | Promise<T>,
): Result<unknown, T> | Promise<Result<unknown, T>> {
  try {
    const value = fn();

    if (isPromise(value)) {
      return value
        .then((v) => {
          return {
            ok: true,
            value: v,
          } as const;
        })
        .catch((e) => {
          return {
            ok: false,
            error: e as unknown,
          };
        });
    }

    return {
      ok: true,
      value,
    };
  } catch (e) {
    return {
      ok: false,
      error: e,
    };
  }
}
