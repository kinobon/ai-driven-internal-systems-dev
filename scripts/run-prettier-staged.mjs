import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const allowedExtensions = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.json',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
  '.md',
  '.css',
  '.scss',
  '.html',
])

const stagedOutput = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
  encoding: 'utf8',
})

const stagedFiles = stagedOutput
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean)

const filesToFormat = stagedFiles.filter((file) => allowedExtensions.has(path.extname(file)))

if (filesToFormat.length === 0) {
  process.exit(0)
}

const projectRoot = process.cwd()
const prettierBinary = process.platform === 'win32' ? 'prettier.cmd' : 'prettier'
const prettierFromNodeModules = path.join(projectRoot, 'node_modules', '.bin', prettierBinary)

const resolvedPrettier = fs.existsSync(prettierFromNodeModules)
  ? prettierFromNodeModules
  : prettierBinary

try {
  execFileSync(resolvedPrettier, ['--log-level', 'warn', '--write', ...filesToFormat], {
    stdio: 'inherit',
  })
  execFileSync('git', ['add', ...filesToFormat], { stdio: 'inherit' })
} catch (error) {
  if (error && typeof error === 'object') {
    const status = 'status' in error ? Number(error.status) || 1 : 1
    if (status === 127) {
      console.error(
        'Prettier binary could not be found. Please install dependencies before committing.',
      )
    }
    process.exit(status)
  }
  process.exit(1)
}
