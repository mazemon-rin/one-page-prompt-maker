# MATOME・AI Ver.1 開発ルール

## プロジェクト

- プロジェクト名：MATOME・AI（まとめあい）
- Version：Ver.1
- コンセプト：AIでまとめて、伝わる1枚を。
- サブタイトル：AI Visual Document Studio
- 目的：初心者が選択肢を順番に選び、ChatGPT / Gemini等へ渡す1枚資料作成用プロンプトを作れるWebアプリ

このリポジトリはMATOME・AI Ver.1専用です。別プロジェクトのコード、設計、画像、指示を開発対象として扱わないでください。

## 基本フロー

アプリで選択・入力 → AI向け指示文生成 → コピー → ChatGPT / Gemini等へ貼り付け → 必要な対話 → 資料画像生成

アプリ自身からAI APIを直接利用しません。ログイン、サーバー保存、クラウド保存、課金機能もありません。

## Ver.1で維持するもの

- 現在の9 STEP
- ChatGPT推奨フロー
- Gemini二段階フロー
- その他AI対応
- localStorage
- 保存履歴
- JSON Export / Import
- PC / スマートフォン対応
- ログイン不要
- サーバー保存なし

既存のlocalStorageキーと保存データ構造は互換性のため変更しません。

## Ver.1で実装しないもの

以下は将来Versionの候補です。「便利そうだから」という理由でVer.1へ追加しないでください。

- AI調査モード
- Web調査支援
- 実写真検索支援
- 参考資料モード
- AIおまかせ
- テンプレートモード
- 有料ユーザー認証
- Googleログイン
- メールOTP
- クラウド保存
- LINE通知
- 複数枚資料作成

## 変更ルール

- MATOME・AI本体の既存機能、9 STEP、UI、プロンプト生成、保存、JSON入出力を壊さない
- 最小変更を優先し、無関係なリファクタリングをしない
- 未入力情報を推測で補完しない
- Gemini専用指示をその他AIへ混入させない
- 画像生成用プロンプトの内容へアプリの著作権フッターや利用規約を混入させない
- noindexとrobots.txtの検索抑制を維持する
- note URLは確定するまで作らず、`src/app.mjs`のNOTE_URLで管理する

## 作業前後の確認

変更前に対象Gitルートで`git status --short --branch`を確認し、既存差分を保護します。変更後は構文、既存テスト、保存互換性、関連するUIを確認します。

Commit、Push、Deploy、GitHub公開設定変更、Vercel設定変更は、人間から明示的に依頼された場合だけ行います。

## 起動とテスト

```sh
python3 -m http.server 4173
node --check src/app.mjs
node --check src/prompt-builder.mjs
node --check src/storage.mjs
node --test tests/*.mjs
```

## 公開・資産方針

- 現在のnoindex / robots.txtを維持する
- `images/steps/`は現行STEP画像として保護し、勝手に削除しない
- 旧プロジェクト資料を見つけた場合は、現行コード・テスト・README等からの参照を確認してから整理する
- 判断が曖昧なファイルは削除せず報告する
