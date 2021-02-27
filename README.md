## Requirements

- bms-renderer:
  - `npm install --global @watiko/bms-renderer`
  - libsndfile: `apt install libsndfile1-dev`
- sox

## Setup

```bash
$ deno install \
  --allow-read \
  --allow-write \
  --allow-env \
  --allow-run \
  --unstable \
  --name bms-preview-renderer \
  --force \
  https://raw.githubusercontent.com/watiko/bms-preview-renderer/v1.0.2/cli.ts
```

## Links

- https://gist.github.com/watiko/6c69fcd4b6b3d70cdf5af0d84ae31ef0
