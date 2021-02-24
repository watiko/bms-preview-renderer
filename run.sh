exec deno run \
  --allow-read \
  --allow-write \
  --allow-env \
  --allow-run \
  --unstable \
  cli.ts "$@"
