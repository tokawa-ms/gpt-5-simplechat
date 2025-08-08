# 仕様書（フロントエンドのみ / マルチモーダル対応チャット UI）

本仕様は、与えられた技術スタック/要件（HTML5 + Tailwind CDN + ES6、バックエンドなし、ブラウザで開くだけで動作、詳細なコンソールログ出力、UI のレスポンシブ最適化、シークレットは UI 入力で扱う）を満たすフロントエンド実装の設計を記録します。

## 機能要件

- ブラウザだけで動作（静的 HTML/JS）。
- Azure AI Foundry v1 preview Responses API を直接呼び出し、テキストと画像を同時に送信可能。
- ストリーミング（SSE）/ 非ストリーミング切替。
- 接続情報（エンドポイント / API バージョン / デプロイ名 / API キー）を UI 入力 → localStorage 保存。
- Playwright 等での自動テストを考慮した詳細コンソールログ出力。

## 技術スタック / 技術要件

- フロントエンド
  - HTML5（UTF-8）
  - CSS3（Tailwind を CDN で読み込み）
    - `<script src="https://cdn.tailwindcss.com"></script>` を `index.html` で使用
  - JavaScript（ES6 準拠、ライブラリは CDN 読み込み）
- バックエンド: なし（フロントエンドのみ）
- Azure OpenAI（Azure AI Foundry）最新 v1 preview REST API を利用
  - 参照: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference-preview-latest
- 動作要件
  - ブラウザで `src/index.html` を開くだけで動作（ローカル PC のみで完結）

## 非機能要件

- レスポンシブ対応（Tailwind CDN 利用）。
- 画面外周のマージン・パディング、スクロールバー可視性配慮。
- シークレットは UI 入力とし、保存は localStorage のみに限定（デモ用途）。

### 画面構成に関する要件（適用済み）

- `meta viewport` を適切に設定
- 外周に十分な余白（`w-[90vw]` など）とカード内余白（`p-4 md:p-6`）
- 要素の重なり回避、縦スクロールの確保（`overflow-y-auto`）
- スモール/ラージ画面でのレイアウト分岐（1→2 カラム）

### ログ出力に関する要件（適用済み）

- 重要情報を `console.log`（情報）、`console.warn`（警告）、`console.error`（エラー）で出力
- 画面内の `consoleArea` に時刻付きで追記し、Playwright デバッグに有用

### シークレットの取り扱い

- 接続文字列や API キーは UI のテキストボックスに入力
- 保存先は localStorage（デモ用途）。実運用では Key Vault とバックエンドプロキシを推奨

## 入出力（契約）

- 入力
  - テキスト: 任意
  - 画像: 任意/複数、`image/*`
- 出力
  - アシスタントのテキスト（ストリーミング時はトークン逐次）
- エラー
  - ネットワーク/HTTP エラー時は `console.error` と画面下部のコンソールに出力

## API 呼び出し

- Endpoint: `{endpoint}/openai/v1/responses?api-version={apiVersion}`
- 認証: `api-key: <key>` または `Authorization: Bearer <token>`
- Body（例）:

```
{
  "model": "<deployment>",
  "input": [
    {
      "role": "user",
      "content": [
        { "type": "input_text", "text": "テキスト" },
        { "type": "input_image", "image_url": "data:image/png;base64,...", "detail": "auto" }
      ]
    }
  ],
  "stream": true | false
}
```

## UI フロー（Mermaid）

```mermaid
flowchart TD
  A[起動: index.html] --> B[接続設定の復元 (localStorage)]
  B --> C{接続設定は有効?}
  C -- No --> D[ユーザーが設定入力]
  D --> E[設定保存]
  C -- Yes --> F[チャット入力]
  F --> G{画像選択あり?}
  G -- Yes --> H[FileReaderでdata URL化]
  G -- No --> I[テキストのみ]
  H --> J[リクエストボディ組み立て]
  I --> J
  J --> K{ストリーミング?}
  K -- Yes --> L[Accept: text/event-streamでPOST]
  K -- No --> M[JSONでPOST]
  L --> N[SSEを逐次パースし表示]
  M --> O[JSONからテキスト抽出し表示]
  N --> P[ログ追記]
  O --> P
```

## 既知の注意点

- CORS 設定が必要な場合があります。
- プレビュー API のため、レスポンス形式が変更される可能性があります。
- Base64 画像はサイズが大きくなりやすいため、長大画像は圧縮推奨。

## ディレクトリ構成

```
root/
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── script.js
└── docs/
  ├── README.md
  └── SPEC.md
```

## テスト観点（抜粋）

- 接続設定の保存/復元/クリアが機能する（localStorage）
- テキストのみ送信と、画像同梱送信が双方成功する
- ストリーミングと非ストリーミングで応答表示が行われる
- 主要イベントで `consoleArea` にログが追記される（Playwright から検証）
