import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { detectJava, validateJava } from '../electron/services/javaService.js';

test('Linux resolves executable and JDK paths containing spaces and detects JAVA_HOME', { skip: process.platform !== 'linux' }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'eternal java '));
  const original = process.env.JAVA_HOME;
  try {
    await fs.mkdir(path.join(root, 'bin'));
    const executable = path.join(root, 'bin/java');
    await fs.writeFile(executable, '#!/bin/sh\nprintf \'openjdk version "21.0.8"\\n\' >&2\n', { mode: 0o755 });
    assert.equal((await validateJava(root)).major, 21);
    assert.equal((await validateJava(executable)).path, executable);
    process.env.JAVA_HOME = root;
    assert.ok((await detectJava()).some(runtime => runtime.path === executable && runtime.major === 21));
    await fs.chmod(executable, 0o644);
    assert.equal(await validateJava(root), null);
  } finally {
    if (original === undefined) delete process.env.JAVA_HOME;
    else process.env.JAVA_HOME = original;
    await fs.rm(root, { recursive: true, force: true });
  }
});
