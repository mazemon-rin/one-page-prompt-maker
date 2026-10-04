# まとめるAI：MATOME・AI（まとめあい） Ver.1

AIでまとめて、伝わる1枚を。AI初心者が質問に答えながら、A4横の1枚資料を作るための指示文を作成する無料の静的Webアプリです。英語サブタイトルは **AI Visual Document Studio** です。

## 主な機能

- 9 STEPでテーマ、用途、構成、デザイン、情報量、追加内容、人物、確認、AIを選択
- ChatGPT向け対話型プロンプト、Gemini向け二段階プロンプト、その他AI向け汎用プロンプトの生成
- 到達条件に応じたSTEPナビゲーションと、入力内容を維持した移動
- localStorageへの下書き・履歴保存
- JSON Export / Import
- PC・スマートフォン対応
- 利用規約、noindex、robots.txtによる公開前提の案内

アプリ内でAI APIを使用したり、画像を生成したりはしません。完成した指示文を選択したAIへコピーして使います。ログイン、クラウド保存、サーバー保存、課金機能もありません。

## AI別の使い方

- ChatGPT：不足情報の確認 → 内容整理 → ユーザー確認 → 了承後に画像生成
- Gemini：通常チャットで不足情報を確認・整理・了承 → 画像生成用プロンプトをテキスト出力 → Gemini「画像」で生成
- その他のAI：汎用プロンプトとして利用

入力・選択していない情報をアプリが勝手に補完しない方針です。AIが生成した内容は必ずしも正確とは限らないため、公開・配布前に確認してください。

## 起動方法

プロジェクト直下で実行します。

```sh
python3 -m http.server 4173
```

ブラウザで <http://127.0.0.1:4173/> を開いてください。

## テスト

```sh
node --check src/app.mjs
node --check src/prompt-builder.mjs
node --check src/storage.mjs
node --test tests/*.mjs
```

## 保存データについて

既存データとの互換性を保つため、localStorageの内部キーやJSONの保存形式は変更していません。保存データはブラウザ内に保管されます。

## note導線

note URLは未確定のため、現在はリンクを無効表示しています。URL確定後は `src/app.mjs` の `NOTE_URL` だけを設定してください。MATOME・AIからLINEへ直接誘導する機能はありません。

## 公開設定

現時点では検索エンジンへの掲載を抑制するため、`noindex, nofollow` と `robots.txt` の `Disallow: /` を維持しています。

利用条件は [利用規約](./terms.html) を確認してください。
