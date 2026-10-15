import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shapeRequest, instantShape, findEmoji } from '../src/lib/shapeWords.ts';
import { validateToolCall } from '../supabase/functions/_shared/agent.ts';

test('Shapes: asking Belluh to become something is understood, whatever the wording', () => {
  assert.deepEqual(shapeRequest('turn into a giraffe please'), { subject: 'giraffe' });
  assert.deepEqual(shapeRequest('Can you become a dinosaur?'), { subject: 'dinosaur' });
  assert.deepEqual(shapeRequest('morph into my cat!'), { subject: 'cat' });
  assert.deepEqual(shapeRequest('look like the letter j'), { subject: 'letter j', text: 'J' });
  assert.deepEqual(shapeRequest('ok go back to normal'), { water: true });
  assert.equal(shapeRequest('be honest with me about last night'), null);
  assert.equal(shapeRequest('we had a lovely dinner'), null);
});

test('Shapes: everyday things change instantly from the dictionary, the rest go to Belluh', () => {
  assert.equal(findEmoji('giraffe'), '🦒');
  assert.equal(findEmoji('cat'), '🐈️');
  assert.equal(findEmoji('red heart'), '❤️');
  assert.equal(findEmoji('big fluffy dog'), '🐕️');
  assert.ok(findEmoji('guitar'));
  assert.deepEqual(instantShape({ subject: 'giraffe' }), { emoji: '🦒' });
  assert.deepEqual(instantShape({ subject: 'letter j', text: 'J' }), { text: 'J' });
  assert.equal(instantShape({ water: true }), 'water');
  assert.equal(instantShape({ subject: 'my grandmother’s old flux capacitor' }), null);
});

test('Shapes: what the model asks for is checked before the app draws it', () => {
  assert.deepEqual(validateToolCall('take_shape', { label: 'giraffe', emoji: '🦒' }), { name: 'take_shape', shape: { label: 'giraffe', emoji: '🦒' } });
  assert.deepEqual(validateToolCall('take_shape', { label: 'x', water: true }), { name: 'take_shape', shape: { water: true } });
  const path = 'M10 90 L50 10 L90 90 Z';
  assert.deepEqual(validateToolCall('take_shape', { label: 'mountain', path }), { name: 'take_shape', shape: { label: 'mountain', path } });
  assert.equal(validateToolCall('take_shape', { label: 'x', emoji: '<script>' }), null);
  assert.equal(validateToolCall('take_shape', { label: 'x', path: 'M0 0 url(javascript:alert(1))' }), null);
  assert.equal(validateToolCall('take_shape', { label: 'x' }), null);
});
