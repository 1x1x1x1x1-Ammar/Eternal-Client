import test from 'node:test';
import assert from 'node:assert/strict';
import { keyName, launchStatus, recentTransfers } from '../src/lib/launcherView.js';

test('launcher displays rebinding and unavailable bindings without invented defaults', () => {
  assert.equal(keyName(74), 'J');
  assert.equal(keyName(344), 'Right Shift');
  assert.equal(keyName(294), 'F5');
  assert.equal(keyName(undefined), 'Unbound');
});

test('launcher status distinguishes no instance, missing account, errors and real processes', () => {
  const selected = { id: 'one' }, account = { id: 'local' };
  assert.equal(launchStatus({}), 'Create an instance to play');
  assert.equal(launchStatus({ selected }), 'Select an account to play');
  assert.equal(launchStatus({ selected, account }), 'Not launched yet');
  assert.equal(launchStatus({ selected, account, event: { state: 'ERROR', message: 'Java not found' } }), 'Java not found');
  assert.equal(launchStatus({ selected, account, running: true, event: { state: 'STOPPED' } }), 'Minecraft is running');
  assert.equal(launchStatus({ selected, account, running: false, event: { state: 'RUNNING' } }), 'Not launched yet');
});

test('recent transfers show the latest progress once for each download', () => {
  const events = [{ id: 'a', state: 'DOWNLOADING' }, { id: 'b', state: 'DOWNLOADING' }, { id: 'a', state: 'INSTALLED' }];
  assert.deepEqual(recentTransfers(events), [events[2], events[1]]);
  assert.equal(events[0].state, 'DOWNLOADING');
  assert.deepEqual(recentTransfers(events, 1), [events[2]]);
});
