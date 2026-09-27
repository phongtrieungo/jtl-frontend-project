import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const packageRoots = {
  shared: join(repositoryRoot, 'packages/shared'),
  users: join(repositoryRoot, 'packages/users'),
  todos: join(repositoryRoot, 'packages/todos'),
};
const sourceRoots = [
  join(repositoryRoot, 'apps/web/src'),
  packageRoots.shared,
  packageRoots.users,
  packageRoots.todos,
];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const importPattern = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/g;
const violations = [];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
    else if (sourceExtensions.has(extname(entry.name))) files.push(entryPath);
  }
  return files;
}

function isInside(file, directory) {
  const pathFromDirectory = relative(directory, file);
  return pathFromDirectory !== '..' && !pathFromDirectory.startsWith(`..${sep}`);
}

function report(file, specifier, reason) {
  violations.push(`${relative(repositoryRoot, file)}: ${reason} (import "${specifier}")`);
}

for (const sourceRoot of sourceRoots) {
  for (const file of await collectFiles(sourceRoot)) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier) continue;

      if (/^@todo\/(shared|users|todos)\//.test(specifier)) {
        report(file, specifier, 'workspace deep imports are forbidden; use the package root export');
      }
      if (isInside(file, packageRoots.users) && specifier === '@todo/todos') {
        report(file, specifier, 'packages/users cannot depend on packages/todos');
      }
      if (isInside(file, packageRoots.todos) && specifier === '@todo/users') {
        report(file, specifier, 'packages/todos cannot depend on packages/users');
      }
      if (isInside(file, packageRoots.shared) && (specifier === '@todo/users' || specifier === '@todo/todos')) {
        report(file, specifier, 'packages/shared cannot depend on feature packages');
      }

      if (specifier.startsWith('.')) {
        const resolvedImport = resolve(dirname(file), specifier);
        for (const [packageName, packageRoot] of Object.entries(packageRoots)) {
          if (!isInside(file, packageRoot) && isInside(resolvedImport, packageRoot)) {
            report(file, specifier, `relative imports cannot cross into packages/${packageName}`);
          }
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`Package boundary validation failed:\n${violations.map((violation) => `- ${violation}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Package boundary validation passed.');
}
