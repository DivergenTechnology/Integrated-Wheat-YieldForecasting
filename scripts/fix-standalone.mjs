/**
 * Normalizes Next.js standalone output so that `.next/standalone/server.js`
 * always exists, regardless of where Next decided to nest it.
 *
 * Background: with `output: "standalone"`, Next mirrors the project's path
 * relative to the detected "workspace root" (nearest ancestor with a
 * lockfile). If the project is deployed under a parent directory that
 * contains a lockfile (e.g. /workspace/bun.lock + /workspace/app/), the
 * server lands at .next/standalone/<app-dir>/server.js instead of
 * .next/standalone/server.js — breaking start scripts that assume the
 * flat layout. This script flattens the nested output and copies the
 * static assets, so `bun .next/standalone/server.js` works everywhere.
 */
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const standalone = path.join(root, '.next', 'standalone')

if (!existsSync(standalone)) {
  console.error('[fix-standalone] .next/standalone missing — did `next build` run?')
  process.exit(1)
}

function findNestedProjectDir(dir) {
  // Direct hit: flat layout already present.
  if (existsSync(path.join(dir, 'server.js'))) return null
  // Search one level deep for the nested mirror (e.g. .next/standalone/<app>/server.js).
  for (const name of readdirSafe(dir)) {
    const nested = path.join(dir, name)
    if (existsSync(path.join(nested, 'server.js'))) return nested
  }
  // Fall back to a deeper scan (depth 3) for unusual monorepo layouts.
  for (const name of readdirSafe(dir)) {
    const level2 = path.join(dir, name)
    for (const inner of readdirSafe(level2)) {
      const deep = path.join(level2, inner)
      if (existsSync(path.join(deep, 'server.js'))) return deep
    }
  }
  return null
}

function readdirSafe(dir) {
  try {
    return readdirNames(dir)
  } catch {
    return []
  }
}

function readdirNames(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== '.next')
    .map((e) => e.name)
}

const nested = findNestedProjectDir(standalone)

if (nested) {
  console.log(`[fix-standalone] flattening nested standalone output: ${path.relative(root, nested)}`)
  // Copy the nested project dir contents up to .next/standalone/ (merging).
  cpSync(nested, standalone, { recursive: true, force: true })
  rmSync(nested, { recursive: true, force: true })
} else {
  console.log('[fix-standalone] standalone output already flat')
}

// Ensure static assets are present in the standalone .next folder.
const staticSrc = path.join(root, '.next', 'static')
const staticDest = path.join(standalone, '.next', 'static')
if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDest, { recursive: true, force: true })
  console.log('[fix-standalone] copied .next/static')
}

// Ensure the public folder is present.
const publicSrc = path.join(root, 'public')
const publicDest = path.join(standalone, 'public')
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true, force: true })
  console.log('[fix-standalone] copied public/')
}

if (!existsSync(path.join(standalone, 'server.js'))) {
  console.error('[fix-standalone] FAILED: server.js still missing after normalization')
  process.exit(1)
}
console.log('[fix-standalone] ok — .next/standalone/server.js ready')
