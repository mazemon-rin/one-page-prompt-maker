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
  assert.match(prompt, /一緒に添付されたキャラクターシートを人物デザインの基準/);
  assert.match(prompt, /キャラクターシートの説明文や設定資料そのものを完成資料内へ転載しない/);
});

test('Gemini uses a two-stage prompt flow', () => {
  const prompt = buildPrompt(createPromptModel({ topic: '案内資料', usage: 'guide', layout: 'flow', design: 'friendly', density: 'balanced', adapter: 'gemini' }));
  assert.match(prompt, /この段階では画像を生成しないでください/);
  assert.match(prompt, /Geminiの「画像」に貼り付ける画像生成用プロンプト/);
  assert.match(prompt, /一度に1問だけ/);
  assert.match(prompt, /了承したら、最終的な画像生成用プロンプトだけを出力/);
  assert.doesNotMatch(prompt, /不足情報を質問したり、ユーザーの了承を待ったりせず/);
  assert.doesNotMatch(prompt, /そのまま画像生成してください/);
});

test('generic prompt does not contain Gemini-specific flow', () => {
  const prompt = buildPrompt(createPromptModel({ topic: '案内資料', usage: 'guide', layout: 'flow', design: 'friendly', density: 'balanced', adapter: 'generic' }));
  assert.doesNotMatch(prompt, /Gemini/);
  assert.doesNotMatch(prompt, /この段階では画像を生成しない/);
});

test('optional additions are passed through without invented details', () => {
  const prompt = buildPrompt(createPromptModel({ topic: 'サービス紹介', usage: 'product', layout: 'grid', design: 'simple', density: 'light', mustInclude: '料金は月額500円', adapter: 'generic' }));
  assert.match(prompt, /料金は月額500円/);
  assert.doesNotMatch(prompt, /効率よく予約/);
});
