## Requirements

- bms-renderer:
  - `npm install --global @watiko/bms-renderer`
  - libsndfile: `apt install libsndfile1-dev`
- sox

## Setup

```bash
$ deno install \
  --name bms-preview-renderer \
  --force \
  --allow-all \
  --import-map=https://raw.githubusercontent.com/watiko/bms-preview-renderer/v1.0.3/import_map.json \
  https://raw.githubusercontent.com/watiko/bms-preview-renderer/v1.0.3/cli.ts
```

## Development

```console
$ deno task dev
```

## Links

- https://gist.github.com/watiko/6c69fcd4b6b3d70cdf5af0d84ae31ef0
