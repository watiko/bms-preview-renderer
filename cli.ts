import * as log from "@std/log/mod.ts";
import { Command, ValidationError } from "cliffy/command/mod.ts";

import {
  bms2previewCommand,
  bms2previewRecursivelyCommand,
  CommandError,
} from "./lib/command.ts";

async function setup(p: { debug: boolean }): Promise<void> {
  const logLevel = p.debug ? "DEBUG" : "INFO";
  await log.setup({
    handlers: {
      default: new log.handlers.ConsoleHandler(logLevel, {
        formatter: "{datetime}: {levelName}: {msg}",
      }),
    },
    loggers: {
      default: {
        level: logLevel,
        handlers: ["default"],
      },
    },
  });
}

async function main() {
  const program = new Command()
    .name("bms2preview")
    .option("--debug", "Set log level to debug.", {
      global: true,
    })
    .action(() => {
      program.showHelp();
    });

  program
    .command(
      "render <dir:string>",
      "Create a preview of the given BMS directory",
    )
    .action(async (p: { debug: boolean }, dir: string) => {
      await setup(p);
      await bms2previewCommand(dir);
    });

  program
    .command(
      "render-recursive <root:string>",
      "Search BMS directories from the given root directory and render all BMS directories",
    )
    .option(
      "--parallelism <parallelism:number>",
      "Number of parallel executions",
      {
        default: 10,
      },
    )
    .action(
      async (p: { debug: boolean; parallelism: number }, root: string) => {
        await setup(p);
        await bms2previewRecursivelyCommand(root, p.parallelism);
      },
    );

  try {
    await program.parse(Deno.args);
  } catch (e) {
    if (e instanceof ValidationError) {
      program.showHelp();
      console.error(e.message);
      Deno.exit(1);
    } else if (e instanceof CommandError) {
      console.error(e.message);
      Deno.exit(1);
    } else {
      throw e;
    }
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}
