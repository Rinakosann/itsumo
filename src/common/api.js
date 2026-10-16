// サーバー（/api/*）との通信。エラーは { code, status } を持つ例外になる。
export class ApiError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function call(path, body) {
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError('offline', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'server_error', res.status);
  return data;
}

export const get = (fn, action, params = {}) => call(`${fn}?${new URLSearchParams({ action, ...params })}`);
export const post = (fn, action, body = {}) => call(`${fn}?action=${action}`, body);
