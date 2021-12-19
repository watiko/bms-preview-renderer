import { assertEquals } from "@std/testing/asserts.ts";

import { catcher } from "./catcher.ts";

Deno.test("catcher: sync value", () => {
  assertEquals(
    catcher(() => 1),
    {
      ok: true,
      value: 1,
    },
  );
});

Deno.test("catcher: sync error", () => {
  const error = new Error("test");

  const result = catcher(() => {
    throw error;
  });

  assertEquals(result, {
    ok: false,
    error,
  });
});

Deno.test("catcher: async value", async () => {
  assertEquals(
    await catcher(() => Promise.resolve(100)),
    { ok: true, value: 100 },
  );
});

Deno.test("catcher: async error", async () => {
  const error = new Error("test");
  // deno-lint-ignore require-await
  async function testFn() {
    throw error;
  }

  assertEquals(await catcher(() => testFn()), { ok: false, error });
});
