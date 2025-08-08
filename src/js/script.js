// script.js - Azure AI Foundry v1 preview Responses API をブラウザから叩くデモ
// 仕様に関する補足:
// - 完全フロントエンドのため、CORS およびネットワーク到達性は利用者の環境に依存します。
// - API キー/トークン、エンドポイント、デプロイ名は UI から入力し、localStorage に保存します。
// - 画像は Base64 の data URL として input_image に渡せます（docs: image_url 可）。
// - ストリーミングは text/event-stream（SSE）で responses エンドポイントに POST します。
// - ログは Playwright 自動テストで解析しやすいよう console.log / console.error を使い分けます。

const els = {
  endpoint: document.getElementById('endpoint'),
  apiVersion: document.getElementById('apiVersion'),
  deployment: document.getElementById('deployment'),
  apiKey: document.getElementById('apiKey'),
  saveSettings: document.getElementById('saveSettings'),
  clearSettings: document.getElementById('clearSettings'),
  settingsStatus: document.getElementById('settingsStatus'),
  chatLog: document.getElementById('chatLog'),
  userInput: document.getElementById('userInput'),
  imageFiles: document.getElementById('imageFiles'),
  streaming: document.getElementById('streaming'),
  sendBtn: document.getElementById('sendBtn'),
  consoleArea: document.getElementById('consoleArea'),
};

// 初期化: localStorage から設定復元
(function init() {
  try {
    const saved = JSON.parse(localStorage.getItem('azureSettings') || '{}');
    if (saved.endpoint) els.endpoint.value = saved.endpoint;
    if (saved.apiVersion) els.apiVersion.value = saved.apiVersion;
    if (saved.deployment) els.deployment.value = saved.deployment;
    if (saved.apiKey) els.apiKey.value = saved.apiKey;
    logInfo('設定を復元しました。');
  } catch (e) {
    console.error('設定復元エラー', e);
  }
})();

// 設定保存
els.saveSettings.addEventListener('click', () => {
  const cfg = {
    endpoint: (els.endpoint.value || '').trim(),
    apiVersion: (els.apiVersion.value || 'preview').trim(),
    deployment: (els.deployment.value || '').trim(),
    apiKey: (els.apiKey.value || '').trim(),
  };
  localStorage.setItem('azureSettings', JSON.stringify(cfg));
  els.settingsStatus.textContent = '保存しました';
  logInfo('設定を保存しました。');
});

// 設定クリア
els.clearSettings.addEventListener('click', () => {
  localStorage.removeItem('azureSettings');
  els.endpoint.value = '';
  els.apiVersion.value = '';
  els.deployment.value = '';
  els.apiKey.value = '';
  els.settingsStatus.textContent = 'クリアしました';
  logInfo('設定をクリアしました。');
});

// 送信
els.sendBtn.addEventListener('click', async () => {
  try {
    const text = els.userInput.value.trim();
    const files = Array.from(els.imageFiles.files || []);
    if (!text && files.length === 0) {
      alert('テキストまたは画像を入力してください');
      return;
    }

    const cfg = getConfig();
    if (!cfg.endpoint || !cfg.deployment || !cfg.apiKey) {
      alert('エンドポイント、デプロイ名、API キーを設定してください');
      return;
    }

    // 表示: ユーザー投稿
    addChatBubble('user', text, files);

    els.sendBtn.disabled = true;
    if (els.streaming.checked) {
      await sendWithStreaming(cfg, text, files);
    } else {
      await sendNonStreaming(cfg, text, files);
    }
  } catch (e) {
    console.error('送信エラー', e);
    appendConsole('送信エラー: ' + (e?.message || e));
  } finally {
    els.sendBtn.disabled = false;
    els.userInput.value = '';
    els.imageFiles.value = '';
  }
});

function getConfig() {
  const saved = JSON.parse(localStorage.getItem('azureSettings') || '{}');
  return {
    endpoint: (saved.endpoint || '').replace(/\/$/, ''),
    apiVersion: saved.apiVersion || 'preview',
    deployment: saved.deployment || '',
    apiKey: saved.apiKey || '',
  };
}

function appendConsole(msg) {
  const ts = new Date().toISOString();
  els.consoleArea.textContent += `[${ts}] ${msg}\n`;
  els.consoleArea.scrollTop = els.consoleArea.scrollHeight;
}

function logInfo(...args) {
  console.log('[INFO]', ...args);
  appendConsole('[INFO] ' + args.map(s => String(s)).join(' '));
}
function logWarn(...args) {
  console.warn('[WARN]', ...args);
  appendConsole('[WARN] ' + args.map(s => String(s)).join(' '));
}
function logError(...args) {
  console.error('[ERROR]', ...args);
  appendConsole('[ERROR] ' + args.map(s => String(s)).join(' '));
}

function addChatBubble(role, text, files) {
  const wrap = document.createElement('div');
  wrap.className = role === 'user' ? 'flex justify-end' : 'flex justify-start';

  const bubble = document.createElement('div');
  bubble.className = 'max-w-[85%] rounded-2xl px-4 py-3 shadow text-sm ' + (role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border');

  if (text) {
    const p = document.createElement('p');
    p.textContent = text;
    bubble.appendChild(p);
  }

  if (files && files.length > 0) {
    const grid = document.createElement('div');
    grid.className = 'mt-2 grid grid-cols-3 gap-2';
    files.forEach(f => {
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.src = url;
      img.alt = f.name;
      img.className = 'w-full h-24 object-cover rounded-md border';
      grid.appendChild(img);
    });
    bubble.appendChild(grid);
  }

  wrap.appendChild(bubble);
  els.chatLog.appendChild(wrap);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function addAssistantBubble() {
  const wrap = document.createElement('div');
  wrap.className = 'flex justify-start';
  const bubble = document.createElement('div');
  bubble.className = 'max-w-[85%] rounded-2xl px-4 py-3 shadow text-sm bg-white border';
  const p = document.createElement('p');
  p.textContent = '';
  bubble.appendChild(p);
  wrap.appendChild(bubble);
  els.chatLog.appendChild(wrap);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
  return p; // テキストノードを返す
}

async function filesToDataUrls(files) {
  const results = [];
  for (const file of files) {
    const dataUrl = await readAsDataURL(file);
    results.push({ filename: file.name, dataUrl });
  }
  return results;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildInputItems(text, imageDataUrls) {
  const items = [];
  if (text) {
    items.push({ type: 'input_text', text });
  }
  for (const img of imageDataUrls) {
    items.push({ type: 'input_image', image_url: img.dataUrl, detail: 'auto' });
  }
  return items;
}

function buildRequestBody(cfg, text, filesData) {
  // Responses API スキーマ（preview）
  // https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference-preview-latest#create-response
  const messages = [
    {
      role: 'user',
      content: buildInputItems(text, filesData),
    },
  ];
  return {
    model: cfg.deployment, // Azure 側のデプロイ名
    input: messages,
    // 追加で必要なら
    // temperature: 0.7,
    // max_output_tokens: 1024,
  };
}

async function sendNonStreaming(cfg, text, files) {
  const filesData = await filesToDataUrls(files);
  const body = buildRequestBody(cfg, text, filesData);
  const url = `${cfg.endpoint}/openai/v1/responses?api-version=${encodeURIComponent(cfg.apiVersion || 'preview')}`;
  logInfo('POST (non-stream)', url, body);

  const headers = {
    'Content-Type': 'application/json',
  };
  // API キーをヘッダに設定（Key or Bearer）
  if (cfg.apiKey.toLowerCase().startsWith('bearer ')) {
    headers['Authorization'] = cfg.apiKey;
  } else {
    headers['api-key'] = cfg.apiKey;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    logError('HTTP エラー', res.status, errText);
    throw new Error(`HTTP ${res.status}`);
  }

  const json = await res.json();
  logInfo('レスポンス受信 (non-stream)', json);
  const assistantText = extractTextFromResponse(json) || '[空の応答]';
  addChatBubble('assistant', assistantText);
}

async function sendWithStreaming(cfg, text, files) {
  const filesData = await filesToDataUrls(files);
  const body = buildRequestBody(cfg, text, filesData);
  // streaming: Accept text/event-stream ではなく、body に stream:true を付ける
  body.stream = true;

  const url = `${cfg.endpoint}/openai/v1/responses?api-version=${encodeURIComponent(cfg.apiVersion || 'preview')}`;
  logInfo('POST (stream)', url, body);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
  if (cfg.apiKey.toLowerCase().startsWith('bearer ')) {
    headers['Authorization'] = cfg.apiKey;
  } else {
    headers['api-key'] = cfg.apiKey;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    logError('HTTP エラー (stream)', res.status, errText);
    throw new Error(`HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const p = addAssistantBubble();

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // SSE のパース（各行 data: {...}）
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.replace(/^data:\s*/, '');
      if (payload === '[DONE]') {
        logInfo('SSE 完了');
        continue;
      }
      try {
        const evt = JSON.parse(payload);
        // 参考: OpenAI.ResponseStreamEvent のサブタイプ
        // type: 'response.refusal.delta' | 'response.output_text.delta' | 'response.completed' など
        if (evt.type === 'response.output_text.delta') {
          p.textContent += evt.delta || '';
        } else if (evt.type === 'response.output_text.done') {
          // no-op
        } else if (evt.type === 'response.error') {
          logError('SSE エラー', evt);
        }
      } catch (e) {
        logWarn('SSE JSON parse 失敗', e, payload);
      }
    }
  }
}

function extractTextFromResponse(json) {
  try {
    // AzureResponse 形式を想定。参考: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference-preview-latest#components
    // 出力テキストは response.output[0].content[...type==='output_text'] の text などに格納されることが多いが
    // 仕様はプレビューで変動し得るため、広めに探索。
    if (json?.output_text) return json.output_text; // 簡易

    // より汎用な探索
    const out = [];
    function walk(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(walk);
        return;
      }
      if (obj.type === 'output_text' && typeof obj.text === 'string') {
        out.push(obj.text);
      }
      Object.values(obj).forEach(walk);
    }
    walk(json);
    return out.join('');
  } catch (e) {
    logWarn('extractTextFromResponse 失敗', e);
    return '';
  }
}
