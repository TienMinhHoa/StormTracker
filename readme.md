# StormTracker

Quick instructions to install dependencies and run with pnpm.

## Prerequisites

- Node.js (LTS recommended)
- pnpm (install via npm or corepack)
  - npm: `npm install -g pnpm`
  - corepack (Node >=16.10): `corepack enable && corepack prepare pnpm@latest --activate`

## Install project dependencies

```bash
cd /D:/pypy/Procon/StormTracker
pnpm install
```

## (Optional) Install the `people` package

If you need a package named `people`:

```bash
pnpm add people
```

## Run

Common scripts used by the project (replace with actual script names in package.json if different):

```bash
pnpm run dev     # start dev server
pnpm run start   # start production server
pnpm run build   # build for production
pnpm run test    # run tests
```

Edit package.json scripts as needed.
