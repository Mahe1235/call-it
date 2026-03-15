// Wrapper: sets cwd to the project root before launching Vite
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const projectRoot = dirname(fileURLToPath(import.meta.url))
process.chdir(projectRoot)

const vite = spawn(
  process.execPath,
  [projectRoot + '/node_modules/vite/bin/vite.js'],
  { cwd: projectRoot, stdio: 'inherit' }
)
vite.on('exit', (code) => process.exit(code ?? 0))
