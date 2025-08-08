# 仕様書（フロントエンドのみ / マルチモーダル対応チャット UI）

## 機能要件

- ブラウザだけで動作（静的 HTML/JS）。
- Azure AI Foundry v1 preview Responses API を直接呼び出し、テキストと画像を同時に送信可能。
- ストリーミング（SSE）/ 非ストリーミング切替。
- 接続情報（エンドポイント / API バージョン / デプロイ名 / API キー）を UI 入力 → localStorage 保存。
- Playwright 等での自動テストを考慮した詳細コンソールログ出力。

## 非機能要件

- レスポンシブ対応（Tailwind CDN 利用）。
- 画面外周のマージン・パディング、スクロールバー可視性配慮。
- シークレットは UI 入力とし、保存は localStorage のみに限定（デモ用途）。

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
