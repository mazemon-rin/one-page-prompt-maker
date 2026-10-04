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
  assert.match(prompt, /Geminiの「画像」機能へコピーして使用するための完成した画像生成用プロンプト/);
  assert.match(prompt, /一度に1問だけ/);
  assert.match(prompt, /了承したら、画像生成用プロンプトのテキストを出力し、通常チャット側の処理を終了/);
  assert.doesNotMatch(prompt, /不足情報を質問したり、ユーザーの了承を待ったりせず/);
  assert.doesNotMatch(prompt, /そのまま画像生成してください/);
  assert.match(prompt, /この通常チャットでは画像を生成しないでください/);
  assert.match(prompt, /画像生成ツールを使用せず/);
  assert.match(prompt, /別画面のGemini「画像」へコピーして使う画像生成用プロンプトをテキストで作成しますか/);
  assert.match(prompt, /【Gemini「画像」用プロンプト】/);
});

test('generic prompt does not contain Gemini-specific flow', () => {
  const prompt = buildPrompt(createPromptModel({ topic: '案内資料', usage: 'guide', layout: 'flow', design: 'friendly', density: 'balanced', adapter: 'generic' }));
  assert.doesNotMatch(prompt, /Gemini/);
  assert.doesNotMatch(prompt, /この段階では画像を生成しない/);
});

test('flow layout keeps step count flexible for ChatGPT and Gemini', () => {
  for (const adapter of ['chatgpt', 'gemini']) {
    const prompt = buildPrompt(createPromptModel({ topic: '予約方法', usage: 'guide', layout: 'flow', design: 'friendly', density: 'balanced', adapter }));
    assert.match(prompt, /順番で見せる.*ステップ数を意味しません/);
    assert.match(prompt, /必ず3ステップ、4ステップ、5ステップなどに固定しない/);
    assert.match(prompt, /内容に合わせて流れを提案してほしい/);
    assert.match(prompt, /未入力の数字、制度、条件、料金、URLなどは追加しない/);
  }
});

test('explicit step count takes priority while unspecified count stays flexible', () => {
  const prompt = buildPrompt(createPromptModel({ topic: '操作手順', usage: 'guide', layout: 'flow', design: 'simple', density: 'balanced', mustInclude: '6ステップで説明', adapter: 'gemini' }));
  assert.match(prompt, /ユーザーが手順数を明示した場合は、その指定をそのまま優先/);
  assert.match(prompt, /6ステップで説明/);
  assert.match(prompt, /指定していない場合のみ.*固定しない/);
});

test('flow-specific question rules are omitted for other layouts and generic AI', () => {
  const gridChatgpt = buildPrompt(createPromptModel({ topic: '一覧', usage: 'guide', layout: 'grid', design: 'simple', density: 'light', adapter: 'chatgpt' }));
  const flowGeneric = buildPrompt(createPromptModel({ topic: '流れ', usage: 'guide', layout: 'flow', design: 'simple', density: 'light', adapter: 'generic' }));
  assert.doesNotMatch(gridChatgpt, /「順番で見せる」は情報を順番/);
  assert.doesNotMatch(flowGeneric, /内容に合わせて流れを提案してほしい/);
});

test('optional additions are passed through without invented details', () => {
  const prompt = buildPrompt(createPromptModel({ topic: 'サービス紹介', usage: 'product', layout: 'grid', design: 'simple', density: 'light', mustInclude: '料金は月額500円', adapter: 'generic' }));
  assert.match(prompt, /料金は月額500円/);
  assert.doesNotMatch(prompt, /効率よく予約/);
});

test('information density controls block explanation detail without inventing facts', () => {
  const cases = [
    ['light', /見出し＋一言程度/, /余白を重視/],
    ['balanced', /見出し＋1〜2文程度/, /初心者がその項目で何をするのか理解/],
    ['rich', /より具体的な説明＋必要なポイント/, /どのように進めるのかが分かる程度/]
  ];
  for (const [density, detailPattern, explanationPattern] of cases) {
    for (const adapter of ['chatgpt', 'gemini', 'generic']) {
      const prompt = buildPrompt(createPromptModel({ topic: 'YouTubeの始め方', usage: 'guide', layout: 'flow', design: 'friendly', density, adapter }));
      assert.match(prompt, detailPattern);
      assert.match(prompt, explanationPattern);
      assert.match(prompt, /各ブロックの見出しは、そのブロックで実際に説明する操作・内容と一致/);
      assert.match(prompt, /ユーザーが入力・選択していない数字、料金、制度、条件、URL/);
      assert.doesNotMatch(prompt, /YouTube登録者1万人|毎日投稿|月額500円|20%OFF/);
    }
  }
});
