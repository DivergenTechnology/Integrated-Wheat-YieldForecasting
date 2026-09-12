import { existsSync } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * Resolve a SQLite URL without relying on .env being reachable.
 * The standalone server (`node .next/standalone/server.js`) may be started
 * from a different working directory where Next cannot locate the project
 * .env — in that case DATABASE_URL is undefined and PrismaClient would
 * throw on construction. Walk up from cwd until the Prisma schema is found
 * and point at that project's db/custom.db.
 */
function fallbackDatabaseUrl(): string {
  let dir = process.cwd()
  for (let i = 0; i < 6; i++) {
    if (existsSync(path.join(dir, 'prisma', 'schema.prisma'))) {
      return `file:${path.join(dir, 'db', 'custom.db')}`
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return 'file:./db/custom.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL || fallbackDatabaseUrl(),
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
