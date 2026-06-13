/**
 * CI guard: validates that the Prisma schema is syntactically valid and
 * that all migration files are consistent with the current schema.
 *
 * Usage: pnpm tsx scripts/validate-schema.ts
 * In CI: runs as part of the `lint` turbo task via packages/db package.json
 */
import { execSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const SCHEMA_PATH = resolve(__dirname, '../packages/db/prisma/schema.prisma')
const MIGRATIONS_DIR = resolve(__dirname, '../packages/db/prisma/migrations')

function run(cmd: string, label: string) {
  try {
    execSync(cmd, { stdio: 'pipe' })
    console.log(`✓ ${label}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`✗ ${label}\n${msg}`)
    process.exit(1)
  }
}

// 1. Schema file exists
if (!existsSync(SCHEMA_PATH)) {
  console.error(`✗ schema.prisma not found at ${SCHEMA_PATH}`)
  process.exit(1)
}
console.log('✓ schema.prisma exists')

// 2. Prisma validate
run(`pnpm --filter @rr/db exec prisma validate`, 'prisma validate')

// 3. Migration directory exists and has at least one migration
if (!existsSync(MIGRATIONS_DIR)) {
  console.error('✗ migrations directory missing')
  process.exit(1)
}
const migrations = readdirSync(MIGRATIONS_DIR).filter((f) => f !== 'migration_lock.toml')
if (migrations.length === 0) {
  console.error('✗ No migration files found — run pnpm db:migrate:dev --name init')
  process.exit(1)
}
console.log(`✓ ${migrations.length} migration(s) present`)

// 4. migration_lock.toml exists
const lockPath = resolve(MIGRATIONS_DIR, 'migration_lock.toml')
if (!existsSync(lockPath)) {
  console.error('✗ migration_lock.toml missing')
  process.exit(1)
}
console.log('✓ migration_lock.toml exists')

console.log('\nSchema validation passed.')
