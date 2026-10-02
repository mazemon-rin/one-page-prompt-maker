import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPromptModel, buildPrompt } from '../src/prompt-builder.mjs';

test('prompt contains only explicitly provided optional information', () => {
  const prompt = buildPrompt(createPromptModel({ topic: '九州ふっこう割の予約方法', usage: 'guide', layout: 'flow', design: 'friendly', density: 'balanced', adapter: 'chatgpt' }));
  assert.match(prompt, /九州ふっこう割の予約方法/);
  assert.doesNotMatch(prompt, /効率よく予約する方法や準備/);
  assert.doesNotMatch(prompt, /資料の目的：/);
});

test('character sheet guidance is included only when selected', () => {
  const prompt = buildPrompt(createPromptModel({ topic: '案内資料', usage: 'guide', layout: 'flow', design: 'friendly', density: 'balanced', characterMode: 'sheet', adapter: 'gemini' }));
  assert.match(prompt, /キャラクターシート/);
  assert.match(prompt, /添付してください/);
  assert.match(prompt, /キャラクターシートの説明文を資料内に記載しない/);
});

test('optional additions are passed through without invented details', () => {
  const prompt = buildPrompt(createPromptModel({ topic: 'サービス紹介', usage: 'product', layout: 'grid', design: 'simple', density: 'light', mustInclude: '料金は月額500円', adapter: 'generic' }));
  assert.match(prompt, /料金は月額500円/);
  assert.doesNotMatch(prompt, /効率よく予約/);
});
