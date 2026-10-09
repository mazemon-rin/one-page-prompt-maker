import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPromptModel } from '../src/prompt-builder.mjs';
import { clearStepModel, restoreProjectModel, snapshotProjectModel } from '../src/project-state.mjs';

test('restores the complete saved project model without mutating stored history', () => {
  const model = createPromptModel({
    topic: '季節の案内', usage: 'guide', layout: 'flow', design: 'friendly', density: 'balanced',
    mustInclude: '開催日', other: 'やさしい表現', characterMode: 'sheet',
    characterEnabled: true, character: '既存人物', adapter: 'gemini'
  });
  const history = [{ id: 'saved-1', topic: model.topic, prompt: 'saved prompt' }];
  const projects = [{ ...history[0], model }];

  const restored = restoreProjectModel(history[0], projects);

  assert.deepEqual(restored, model);
  assert.equal(history.length, 1);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].model, model);
});

test('legacy history restores only fields that were actually saved', () => {
  const restored = restoreProjectModel({ id: 'old-1', topic: '昔のテーマ', prompt: 'old prompt' }, []);

  assert.equal(restored.topic, '昔のテーマ');
  assert.equal(restored.usage, '');
  assert.equal(restored.layout, '');
  assert.equal(restored.characterMode, '');
  assert.equal(restored.adapter, '');
});

test('saved model snapshot is independent from later draft edits', () => {
  const draft = createPromptModel({ topic: '保存時のテーマ' });
  const savedModel = snapshotProjectModel(draft);
  draft.topic = '保存後の編集';

  assert.equal(savedModel.topic, '保存時のテーマ');
  assert.equal(draft.topic, '保存後の編集');
});

test('ignores malformed or type-incompatible legacy values', () => {
  const restored = restoreProjectModel({ topic: null, usage: { guessed: true }, density: 'rich' });

  assert.equal(restored.topic, '');
  assert.equal(restored.usage, '');
  assert.equal(restored.density, 'rich');
});

test('clears only the current step fields and preserves unrelated choices', () => {
  const original = createPromptModel({
    topic: '元のテーマ', usage: 'guide', layout: 'flow', design: 'friendly', density: 'rich',
    mustInclude: '料金', other: '補足', characterMode: 'person', characterEnabled: true,
    character: '人物希望', adapter: 'chatgpt'
  });

  const afterDetailsClear = clearStepModel(original, 'details');
  assert.equal(afterDetailsClear.mustInclude, '');
  assert.equal(afterDetailsClear.other, '');
  assert.equal(afterDetailsClear.topic, original.topic);
  assert.equal(afterDetailsClear.layout, original.layout);
  assert.equal(afterDetailsClear.character, original.character);
  assert.equal(afterDetailsClear.adapter, original.adapter);
  assert.equal(original.mustInclude, '料金');

  const afterCharacterClear = clearStepModel(original, 'character');
  assert.equal(afterCharacterClear.characterMode, '');
  assert.equal(afterCharacterClear.characterEnabled, false);
  assert.equal(afterCharacterClear.character, '');
  assert.equal(afterCharacterClear.design, original.design);
});

test('clear action resets each editable step independently', () => {
  const original = createPromptModel({
    topic: 'テーマ', usage: 'guide', layout: 'flow', design: 'friendly', density: 'rich',
    mustInclude: '必須', other: '補足', characterMode: 'person', characterEnabled: true,
    character: '人物', adapter: 'gemini'
  });
  const defaults = createPromptModel();
  const cases = {
    usage: ['topic', 'usage'],
    layout: ['layout'],
    design: ['design'],
    density: ['density'],
    details: ['mustInclude', 'other'],
    character: ['characterMode', 'characterEnabled', 'character'],
    adapter: ['adapter']
  };

  for (const [step, clearedKeys] of Object.entries(cases)) {
    const cleared = clearStepModel(original, step);
    for (const key of Object.keys(original)) {
      assert.equal(cleared[key], clearedKeys.includes(key) ? defaults[key] : original[key], `${step} should only reset ${clearedKeys.join(', ')}`);
    }
  }
});

test('unknown step keys do not clear project data', () => {
  const original = createPromptModel({ topic: '保持する' });
  assert.deepEqual(clearStepModel(original, 'unknown'), original);
});
