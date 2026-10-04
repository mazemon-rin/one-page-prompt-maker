# PROJECT_CONTEXT

## 現在地

- アプリ名：まとめるAI：MATOME・AI（まとめあい） Ver.1
- 英語サブタイトル：AI Visual Document Studio
- AI初心者向けの静的Webアプリ
- テーマ、用途、構成、デザイン、情報量、追加内容、人物設定、AIをSTEP式で選択
- ChatGPT / Gemini / その他のAI向け指示文を生成
- 未入力情報は推測・補完しない。必要な場合はAI側へ確認させる
- キャラクターシートはアプリへ登録せず、AIへ添付する案内を出す
- localStorage保存、履歴、JSON Export / Importを使用
- AI API、クラウドDB、ログイン、課金は使用しない

## 公開前状態

- GitHub Pagesで公開中。現時点ではnoindex / robots.txtの検索抑制を維持
- GitHubリポジトリはPrivate運用予定。公開設定は勝手に変更しない
- 旧アプリとは独立したMATOME・AI専用プロジェクトで、外部アプリは変更しない
- note URLは未確定。`src/app.mjs`のNOTE_URLへ設定する
- Ver.2以降のAI調査、ログイン、クラウド保存、LINE通知は未実装

## 起動

```sh
python3 -m http.server 4173
```
