import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const children = [];
let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  process.exitCode = exitCode;
}

function track(child) {
  children.push(child);
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
  return child;
}

function waitForBff(child, listening, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const onExit = (code) => {
      clearTimeout(timeout);
      reject(new Error(`BFF exited with code ${code ?? 'unknown'}.`));
    };
    const timeout = setTimeout(() => {
      child.off('exit', onExit);
      reject(new Error('Timed out waiting for the BFF to start listening.'));
    }, timeoutMs);
    child.once('exit', onExit);
    listening.then(() => {
      clearTimeout(timeout);
      child.off('exit', onExit);
      resolve();
    }, reject);
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

const backend = track(spawn(
  'dotnet',
  ['run', '--project', 'services/bff/bff.csproj', '--', '--urls', 'http://localhost:5000'],
  { stdio: ['inherit', 'pipe', 'pipe'], shell: isWindows },
));
let backendOutput = '';
const listening = new Promise((resolve) => {
  backend.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    backendOutput = `${backendOutput}${text}`.slice(-2_000);
    if (backendOutput.includes('Now listening on:')) resolve();
  });
});
backend.stderr.on('data', (chunk) => process.stderr.write(chunk));

try {
  console.log('Waiting for the BFF to become ready...');
  await waitForBff(backend, listening);
  console.log('BFF ready. Starting the frontend in fixed BFF mode.');
  track(spawn(isWindows ? 'pnpm.cmd' : 'pnpm', ['dev:web'], {
    stdio: 'inherit',
    shell: isWindows,
    env: {
      ...process.env,
      VITE_API_MODE: 'bff',
    },
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  stopAll(1);
}
