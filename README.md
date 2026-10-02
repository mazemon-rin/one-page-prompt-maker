# 1枚資料プロンプトメーカー Ver.0.1

AI初心者が質問に答えながら、A4横の1枚資料を作るための指示文を作成する静的Webアプリです。アプリ内でAIを実行したり画像を生成したりせず、完成した指示文をChatGPT・Gemini・その他のAIへコピーして使います。

## 主な機能

- STEP1：テーマ入力と資料用途の選択
- STEP2：資料構成の選択
- STEP3：資料デザインの選択
- STEP4：情報量の選択
- STEP5：任意の追加内容
- STEP6：人物・同じキャラクター・キャラクターシートの選択
- STEP7：内容確認
- STEP8：ChatGPT / Gemini / その他のAIの選択
- STEP9：最終指示文の生成・コピー
- 到達条件に応じたSTEPナビゲーション
- localStorageへの下書き・履歴保存
- JSON Export / Import
- PC・スマートフォン対応

## AIと保存について

AI API、ログイン、クラウドDB、バックエンドは使用しません。入力内容はブラウザのlocalStorageに保存します。キャラクターシート画像もアプリへアップロードせず、必要な場合にユーザーがAIへ添付します。

## 起動方法

プロジェクト直下で実行します。

\`\`\`sh
python3 -m http.server 4173
\`\`\`

ブラウザで <http://127.0.0.1:4173/> を開いてください。

## テスト

\`\`\`sh
node --check src/app.mjs
node --check src/prompt-builder.mjs
node --check src/storage.mjs
node --test tests/*.mjs
\`\`\`

## ディレクトリ

- \`index.html\`, \`style.css\`：画面とレスポンシブUI
- \`src/app.mjs\`：STEP画面、入力、ナビゲーション、保存、コピー
- \`src/prompt-builder.mjs\`：入力済み情報だけを使ったAI向け指示文生成
- \`src/storage.mjs\`：localStorageとJSON入出力
- \`images/steps/\`：STEP1〜4のカード画像19枚
- \`tests/\`：Node.js標準テスト
