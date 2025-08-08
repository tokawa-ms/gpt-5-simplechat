# GPT-5 チャット（画像対応）デモ - フロントエンドのみ

本リポジトリは、Azure AI Foundry の v1 preview REST API（Responses API）を、純フロントエンド（静的 HTML/CSS/JS）から直接呼び出すデモ実装です。画像を含むマルチモーダル入力に対応しています。ブラウザで `src/index.html` を開くだけで動作します（ローカル PC で完結）。

> 注意: これはデモ用のサンプルです。実運用では API キーのハードコードやブラウザ直呼びは避け、Key Vault 等とバックエンドプロキシ経由を推奨します。

## 仕様（要約）

- フロントエンドのみ（バックエンドなし）。ブラウザで `src/index.html` を開くだけで動作。
- UI から以下を入力し、localStorage に保存します。
  - エンドポイント URL（例: `https://YOUR-RESOURCE.openai.azure.com`）
  - API バージョン（例: `preview`）
  - デプロイ名（`model` として使用）
  - API キー（`api-key` または `Authorization: Bearer ...`）
- テキストと複数画像（`input_image`）を一緒に送信可能。
- ストリーミング（SSE）/ 非ストリーミングの切替に対応。
- Playwright で活用可能なログ出力（`console.log`/`console.error`）。
- 画面は Tailwind CDN を使い、レスポンシブ対応。外周マージンとスクロールを配慮。
  - Tailwind は CDN から `<script src="https://cdn.tailwindcss.com"></script>` で読み込み

## ファイル構成

```
root/
├── src/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── script.js
└── docs/
    └── README.md
```

## 使い方

1. ブラウザで `src/index.html` を開く（ダブルクリック、またはブラウザでファイルを開く）。
2. 画面上部の「接続設定」に以下を入力して保存。
   - エンドポイント: `https://YOUR-RESOURCE.openai.azure.com`
   - API バージョン: `preview`（必要に応じて最新の preview を利用）
   - デプロイ名: Azure AI Foundry 上で有効なデプロイ名
   - API キー: `XXXX` もしくは `Bearer ey...`（トークン）
3. チャット欄でテキストを入力し、必要に応じて画像ファイルを選択。
4. ストリーミングを有効にする場合はチェックを入れて「送信」。

## CORS / 認証に関する注意

- ブラウザから直接呼ぶため、Azure AI Foundry 側で CORS 許可が必要になる場合があります。
- セキュリティ上、API キーは公開しないでください。デモ以外ではバックエンド経由を推奨。
- 推奨は Microsoft Entra ID によるトークン認証（Authorization: Bearer）。
- ブラウザ直呼びは CORS により拒否される場合があります。可能なら開発中は簡易プロキシを使用してください。

## 参考ドキュメント

- Azure OpenAI in Azure AI Foundry Models REST API v1 preview reference
  - Create response: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference-preview-latest#create-response
  - Components (input_image 等): https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference-preview-latest#components
- Responses API ガイド（SSE, 画像入力）: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/responses

## 追加の仕様（補足）

- 画像は `FileReader` により Base64 data URL 化し、`{ type: 'input_image', image_url: dataUrl, detail: 'auto' }` で送信
- ストリーミングは `body.stream = true` と `Accept: text/event-stream` により SSE を逐次受信
- 出力抽出は `output_text` を優先、なければ `type: 'output_text'` を走査して結合
- ログは画面下部の `consoleArea` にも出力し、時刻付きで追記

## 開発メモ（補完仕様）

- 画像は `FileReader` で Base64 data URL 化し、`{ type: 'input_image', image_url: dataUrl }` 形式で送信。
- ストリーミングは `body.stream = true` と `Accept: text/event-stream` により SSE を受信。
- 応答 JSON はプレビューで変動し得るため、`output_text` の存在を優先しつつ、出力ツリーから `type: 'output_text'` を走査して抽出します。
- Playwright デバッグ用に、イベントごとに `consoleArea` に追記。

## トラブルシュート

- 401/403: キーやトークン、デプロイ名、権限を確認。
- 404: エンドポイント/パス/API バージョンを確認。
- CORS: ブラウザからの直呼びは拒否されることがあります。可能ならば開発中はローカル簡易プロキシを使用してください。
- 画像が扱えない: モデル/デプロイがマルチモーダル対応であることを確認。
