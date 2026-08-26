// Real-time news streaming.
//
//   NEWSDATA_API_KEY=<your key> node examples/websocket.js
//
// Requires Node 22+ for the global WebSocket.
//
// Articles are matched by a registered query. If NEWSDATA_REGISTRATION_ID is
// set, that query is streamed directly; otherwise the example registers a demo
// query (q="pizza") first and prints the resulting registration_id so you can
// reuse it on the next run — or remove it later with websocketDelete().

import {
  NewsDataApiClient,
  NewsDataApiWebSocket,
  NewsdataApiError,
  NewsdataWebSocketAuthError,
} from '../src/index.js';

const apiKey = process.env.NEWSDATA_API_KEY;
if (!apiKey) {
  console.error('Set NEWSDATA_API_KEY in your environment before running this example.');
  process.exit(1);
}

const client = new NewsDataApiClient(apiKey);
const ws = new NewsDataApiWebSocket(client);

/**
 * Register q="pizza" and return its registration_id. Registering an identical
 * query again answers HTTP 409 with the existing id in the response body —
 * reuse it instead of failing.
 */
async function registerDemoQuery() {
  try {
    const { results } = await ws.websocketRegister({ q: 'pizza' });
    console.log(`registered demo query q="pizza" -> ${results.registration_id}`);
    return results.registration_id;
  } catch (err) {
    if (err instanceof NewsdataApiError && err.statusCode === 409) {
      const existing = err.responseBody?.results?.registration_id;
      if (existing) {
        console.log(`query already registered; reusing ${existing}`);
        return existing;
      }
    }
    throw err;
  }
}

const registrationId = process.env.NEWSDATA_REGISTRATION_ID ?? await registerDemoQuery();

// Stop cleanly on Ctrl-C.
process.on('SIGINT', () => {
  console.log('\nstopping');
  ws.close();
});

console.log(`streaming ${registrationId} — Ctrl-C to stop`);

try {
  for await (const response of ws.stream(registrationId)) {
    for (const article of response.results ?? []) {
      console.log(`${article.title} - ${article.link}`);
    }
  }
} catch (err) {
  if (err instanceof NewsdataWebSocketAuthError) {
    console.error(`rejected: ${err.message}`);
    process.exit(1);
  }
  throw err;
}
