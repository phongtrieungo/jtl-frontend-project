import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const commands = isWindows
  ? [
      ['dotnet', ['run', '--project', 'services/bff/bff.csproj', '--', '--urls', 'http://localhost:5000']],
      ['pnpm.cmd', ['dev:web']],
    ]
  : [
      ['dotnet', ['run', '--project', 'services/bff/bff.csproj', '--', '--urls', 'http://localhost:5000']],
      ['pnpm', ['dev:web']],
    ];

const children = commands.map(([command, args]) =>
  spawn(command, args, { stdio: 'inherit', shell: isWindows }),
);
let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(`Unable to start development service: ${error.message}`);
    stopAll(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`A development service exited (${signal ?? code ?? 'unknown'}); stopping the other service.`);
      stopAll(code ?? 1);
    }
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
