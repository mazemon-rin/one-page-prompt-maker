# PROJECT_CONTEXT

## 現在地

- アプリ名：まとめるAI：MATOME・AI（まとめあい） Ver.1.1
- 英語サブタイトル：AI Visual Document Studio
- AI初心者向けの静的Webアプリ
- テーマ、用途、構成、デザイン、情報量、追加内容、人物設定、AIをSTEP式で選択
- ChatGPT / Gemini / その他のAI向け指示文を生成
- 未入力情報は推測・補完しない。必要な場合はAI側へ確認させる
- キャラクターシートはアプリへ登録せず、AIへ添付する案内を出す
- localStorage保存、履歴、JSON Export / Importを使用
- AI API、クラウドDB、ログイン、課金は使用しない

## 公開状態

- Vercel Productionで公開中。noindex / robots.txtの検索抑制を維持
- 公開URL：https://matome-ai-self.vercel.app/
- Ver.1.1の履歴復元・STEP単位クリア変更をProduction反映前に検証中
- 旧アプリとは独立したMATOME・AI専用プロジェクトで、外部アプリは変更しない
- note URLは未確定。`src/app.mjs`のNOTE_URLへ設定する
- Ver.2以降のAI調査、ログイン、クラウド保存、LINE通知は未実装

## 起動

```sh
python3 -m http.server 4173
```
