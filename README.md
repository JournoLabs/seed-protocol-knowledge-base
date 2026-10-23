---
title: Seed Protocol Knowledge Base
version: 0.1.2
---

# Seed Protocol Knowledge Base

The documentation has two sites where you can browse the content in different ways:

- Developer Docs: https://docs.seedprotocol.io
- Quartz Knowledge Base: https://base.seedprotocol.io/

## Running the site

The site is built with [Quartz 5](https://quartz.jzhao.xyz) and needs Node 22 or later.

```bash
npm ci
npm run install-plugins
npx quartz build --serve
```

Pages live in `content/`. The dev server is at http://localhost:8080.

## Where our changes live

This repository is a fork of Quartz that shares its git history, so Quartz updates merge
like any other branch. To keep those merges clean, Seed-specific changes stay out of
Quartz's own files wherever possible:

| What                                                            | Where                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Site settings, plugin choices, colors, fonts, footer links      | `quartz.config.yaml`                                                      |
| Link grids, feature badges, logo page title, dark default theme | `plugins/seed-docs/` (local plugin)                                       |
| Styles                                                          | `quartz/styles/seed-docs.scss`, imported from `quartz/styles/custom.scss` |
| Explorer sort order                                             | `quartz.ts`                                                               |
| Logo and favicon                                                | `quartz/static/branches.*`, `quartz/static/icon.png`                      |
| Docker image and nginx                                          | `deploy/Dockerfile`, `nginx.conf`, `docker-compose.*.yml`                 |

The only Quartz files we edit are `quartz.ts`, `quartz/styles/custom.scss`,
`quartz/static/icon.png`, `.gitignore` and this README, so those are the only places an
upgrade can conflict.

`plugins/seed-docs/dist/` is hand-written JavaScript, not build output. Quartz loads a
local plugin's `dist/` directly and only runs a build when that directory is missing.

## Upgrading Quartz

Quartz releases land on the `v5` branch of https://github.com/jackyzha0/quartz. Merge it
into a branch of your own:

```bash
git remote add upstream https://github.com/jackyzha0/quartz.git
```

```bash
git fetch upstream
```

```bash
git merge upstream/v5
```

Then reinstall and rebuild:

```bash
npm install && npm run install-plugins && npx quartz build
```

First-party plugins are npm dependencies in Quartz's `package.json`, so they update with
the merge. If `package-lock.json` conflicts, take upstream's version and run `npm install`.

`npx quartz upgrade` does the same merge, but it deletes `content/` during the pull and
restores it from a cache afterwards. On a conflict it suggests `npx quartz sync`, which
commits and pushes. Use the git commands above instead.

`quartz.lock.json` is gitignored because it records an absolute path for the local
plugin. Plugins install from `quartz.config.yaml` instead.
