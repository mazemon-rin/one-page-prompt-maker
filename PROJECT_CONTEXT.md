# PROJECT_CONTEXT

## 現在地

- アプリ名：1枚資料プロンプトメーカー Ver.0.1
- AI初心者向けの静的Webアプリ
- テーマ、用途、構成、デザイン、情報量、追加内容、人物設定、AIをSTEP式で選択
- ChatGPT / Gemini / その他のAI向け指示文を生成
- 未入力情報は推測・補完しない。必要な場合はAI側へ確認させる
- キャラクターシートはアプリへ登録せず、AIへ添付する案内を出す
- localStorage保存、履歴、JSON Export / Importを使用
- AI API、クラウドDB、ログイン、課金は使用しない

## 公開前状態

- GitHub Pages等の公開方式は公開作業時に確認
- Commit / Push / Deployは未実施（公開作業で実行）
- `image-prompt-maker-v2`とは独立し、元アプリは変更しない

## 起動

```sh
python3 -m http.server 4173
```
