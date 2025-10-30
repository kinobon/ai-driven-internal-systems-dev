import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const hookDir = path.resolve(process.cwd(), '.husky')
if (!fs.existsSync(hookDir)) {
  fs.mkdirSync(hookDir, { recursive: true })
}

const huskyInternalDir = path.join(hookDir, '_')
if (!fs.existsSync(huskyInternalDir)) {
  fs.mkdirSync(huskyInternalDir, { recursive: true })
}

const huskyShimPath = path.join(huskyInternalDir, 'husky.sh')
if (!fs.existsSync(huskyShimPath)) {
  fs.writeFileSync(
    huskyShimPath,
    `#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  export husky_skip_init

  if [ "$HUSKY" = "0" ]; then
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    . ~/.huskyrc
  fi
fi
`,
    { mode: 0o755 },
  )
}

try {
  execSync('git config core.hooksPath .husky', { stdio: 'ignore' })
} catch (error) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : 'Failed to configure git hooks directory.'
  console.warn(`[husky] ${message}`)
}
