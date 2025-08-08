# GPT-5 Chat (Vision) – Frontend-only Demo / GPT-5 チャット（画像対応）デモ

This repository is a frontend-only demo that calls Azure AI Foundry v1 preview REST API (Responses API) directly from the browser using static HTML/CSS/JS. It supports multimodal inputs with images. Just open `src/index.html` in your browser to run locally.

本リポジトリは、静的 HTML/CSS/JS だけで Azure AI Foundry の v1 preview REST API（Responses API）をブラウザから直接呼び出すデモです。画像を含むマルチモーダル入力に対応しています。ローカルで `src/index.html` をブラウザで開くだけで動作します。

---

## Quick start / クイックスタート

- Open `src/index.html` in your browser.
- Fill in the connection settings and save:
  - Endpoint: `https://YOUR-RESOURCE.openai.azure.com`
  - API version: `preview` (or latest preview)
  - Deployment name (model): valid deployment on Azure AI Foundry
  - API key or Bearer token
- Type a message, optionally attach one or more images, toggle Streaming if needed, and Send.

- ブラウザで `src/index.html` を開きます。
- 「接続設定」に以下を入力して保存します。
  - エンドポイント: `https://YOUR-RESOURCE.openai.azure.com`
  - API バージョン: `preview`（最新の preview を推奨）
  - デプロイ名（model）: Azure 側で有効なデプロイ名
  - API キー または Bearer トークン
- メッセージを入力し、必要に応じて画像を添付、必要ならストリーミングを有効化して送信します。

---

## Tech stack & requirements / 技術スタックと要件

- Frontend only (no backend). HTML5 + Tailwind (CDN) + ES6. Logs with console.log/error.
- Uses Azure AI Foundry OpenAI v1 preview Responses API.
- Runs locally by just opening the HTML file.

- フロントエンドのみ（バックエンドなし）。HTML5 + Tailwind（CDN 読み込み）+ ES6。`console.log/error` で詳細ログを出力。
- Azure AI Foundry の OpenAI v1 preview Responses API を利用。
- ブラウザで HTML を開くだけで動作（ローカル完結）。

References / 参考:

- API reference: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference-preview-latest
- Responses how-to: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/responses

---

## Features / 機能

- Send text and multiple images together (input_image)
- Streaming (SSE) and non-streaming modes
- Connection settings are input via UI and stored in localStorage
- Responsive UI with Tailwind CDN and careful margins/paddings
- In-page log console (`consoleArea`) + console.log/error for Playwright automation

- テキストと複数画像の同時送信（input_image）
- ストリーミング（SSE）/ 非ストリーミングの切替
- 接続設定は UI 入力 →localStorage 保存
- Tailwind CDN によるレスポンシブ UI（外周マージン・パディング配慮）
- 画面内ログコンソール（`consoleArea`）+ Playwright 向け `console.log/error`

---

## Project structure / ディレクトリ構成

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

---

## Security, CORS / セキュリティと CORS

- Do NOT expose API keys publicly. For production, use a backend with Key Vault and token-based auth.
- Direct browser calls may require CORS settings on Azure AI Foundry.

- API キーは公開しないでください。実運用では Key Vault とバックエンド経由を推奨します。
- ブラウザ直呼びは CORS 設定が必要になる場合があります。

---

## Implementation notes / 実装メモ

- Images are converted to Base64 data URLs via FileReader and sent as `{ type: 'input_image', image_url, detail: 'auto' }`.
- Streaming uses `body.stream = true` with `Accept: text/event-stream` and incremental parsing of SSE lines.
- Text extraction prefers `output_text` and falls back to scanning `type: 'output_text'` nodes.

- 画像は FileReader で Base64 data URL 化し、`{ type: 'input_image', image_url, detail: 'auto' }` で送信します。
- ストリーミングは `body.stream = true` と `Accept: text/event-stream` で SSE を逐次処理します。
- 出力抽出は `output_text` を優先し、なければ `type: 'output_text'` ノードを走査します。

---

## Disclaimer / 免責

This is a demo. For production: do not call the API directly from the browser; use a secure backend, token-based auth (Microsoft Entra ID), and configure CORS appropriately.

これはデモです。実運用ではブラウザからの直呼びは避け、バックエンド・トークン認証（Microsoft Entra ID）・適切な CORS 設定を行ってください。
