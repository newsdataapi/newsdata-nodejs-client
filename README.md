<div align="center">

![Newsdata.io logo](https://raw.githubusercontent.com/newsdataapi/newsdata-nodejs-client/main/newsdata-logo.png)

# Newsdata.io Node.js Client

[![npm version](https://img.shields.io/npm/v/newsdata-nodejs-client?logo=npm&color=cb3837)](https://www.npmjs.com/package/newsdata-nodejs-client)
[![npm downloads](https://img.shields.io/npm/dm/newsdata-nodejs-client?color=cb3837)](https://www.npmjs.com/package/newsdata-nodejs-client)
[![CI](https://img.shields.io/github/actions/workflow/status/newsdataapi/newsdata-nodejs-client/ci.yml?branch=main&logo=github&label=CI)](https://github.com/newsdataapi/newsdata-nodejs-client/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

Official Node.js client for the [Newsdata.io](https://newsdata.io) News API. It
wraps every endpoint (`latest`, `archive`, `sources`, `crypto`, `market`,
`count`, `crypto/count`, `market/count`) with client-side parameter validation,
automatic retries with exponential backoff, scroll/paginate helpers, and a
typed error hierarchy.

Zero runtime dependencies — uses the built-in `fetch` (Node 18+).

## Installation

```bash
npm install newsdata-nodejs-client
```

## Quickstart

```js
import { NewsDataApiClient, NewsdataError } from 'newsdata-nodejs-client';

const client = new NewsDataApiClient(process.env.NEWSDATA_API_KEY);

try {
  const res = await client.latestApi({
    q: 'bitcoin',
    country: ['us', 'gb'], // string or array of strings
    language: 'en',
  });
  for (const article of res.results) {
    console.log(article.title, '-', article.link);
  }
} catch (err) {
  if (err instanceof NewsdataError) console.error(err.message);
}
```

CommonJS:

```js
const { NewsDataApiClient } = await import('newsdata-nodejs-client');
```

## Endpoints

| Method | Endpoint | Notes |
|--------|----------|-------|
| `latestApi(params)` | `/1/latest` | Real-time news |
| `archiveApi(params)` | `/1/archive` | Historical news |
| `sourcesApi(params)` | `/1/sources` | Available sources (single page) |
| `cryptoApi(params)` | `/1/crypto` | Cryptocurrency news |
| `marketApi(params)` | `/1/market` | Market / financial news |
| `countApi(params)` | `/1/count` | Aggregate counts (requires `from_date`, `to_date`) |
| `cryptoCountApi(params)` | `/1/crypto/count` | Aggregate crypto counts (requires dates) |
| `marketCountApi(params)` | `/1/market/count` | Aggregate market counts (requires dates) |

Each `params` value may be a single value or an array (arrays are sent
comma-separated). Parameter names are case-insensitive. See the
[Newsdata.io documentation](https://newsdata.io/documentation) for the full
parameter reference per endpoint.

## Pagination

Endpoint methods return a `Promise` by default. Two opt-in modes:

```js
// scroll: follow nextPage cursors, resolve to one merged response.
const merged = await client.latestApi({ q: 'news', scroll: true, maxResult: 200 });

// paginate: async generator, one response per page.
for await (const page of client.latestApi({ q: 'news', paginate: true, maxPages: 5 })) {
  process(page.results);
}
```

`scroll` and `paginate` are mutually exclusive. With `paginate: true` the method
returns an `AsyncGenerator`; otherwise it returns a `Promise`.

### Raw query

```js
await client.latestApi({ rawQuery: 'q=bitcoin&country=us&language=en' });
```

`rawQuery` is mutually exclusive with all other parameters and is validated
against the endpoint's allowed keys.

## Client-side validation

Before any request is sent, parameters are validated and normalized. A
`NewsdataValidationError` is thrown (without spending API quota) when:

- a parameter is not accepted by that endpoint;
- mutually-exclusive parameters are set together — `q`/`qInTitle`/`qInMeta`,
  `country`/`excludecountry`, `category`/`excludecategory`,
  `language`/`excludelanguage`, `domain`/`domainurl`/`excludedomain`;
- `size` is outside 1–50;
- `sentiment_score` is set without `sentiment`;
- a count endpoint is missing `from_date` or `to_date`.

Booleans (`full_content`, `image`, `video`, `removeduplicate`) are coerced to
`1` / `0`.

## Error handling

```js
import {
  NewsdataValidationError,
  NewsdataAuthError,
  NewsdataRateLimitError,
  NewsdataApiError,
  NewsdataNetworkError,
} from 'newsdata-nodejs-client';

try {
  await client.latestApi({ q: 'news' });
} catch (err) {
  if (err instanceof NewsdataValidationError) {/* err.param */}
  else if (err instanceof NewsdataAuthError) {/* 401 / 403 */}
  else if (err instanceof NewsdataRateLimitError) {/* err.retryAfter */}
  else if (err instanceof NewsdataApiError) {/* err.statusCode, err.responseBody */}
  else if (err instanceof NewsdataNetworkError) {/* err.cause */}
}
```

Hierarchy:

```
NewsdataError                       (catch-all base)
├── NewsdataValidationError         (.param)
├── NewsdataApiError                (.statusCode, .responseBody)
│   ├── NewsdataAuthError           (401 / 403)
│   ├── NewsdataRateLimitError      (429; .retryAfter)
│   └── NewsdataServerError         (5xx)
└── NewsdataNetworkError            (.cause)
```

## Configuration

```js
const client = new NewsDataApiClient(apiKey, {
  timeout: 30_000,          // per-request, ms
  maxRetries: 5,            // total attempts (1 = no retry)
  retryBackoff: 2_000,      // base backoff, ms (exponential)
  retryBackoffMax: 60_000,  // cap on a single backoff, ms
  paginationDelay: 1_000,   // delay between pages, ms
  maxResult: null,          // default cap for scroll mode
  maxPages: null,           // default cap for paginate mode
  includeHeaders: false,    // attach responseHeaders to results
  baseUrl: undefined,       // override for staging/proxy
  fetch: undefined,         // inject a custom fetch
  logger: console,          // optional { debug, info, warn }; API key is redacted
});
```

Retries cover network errors, HTTP 429, and 5xx. 429 honors the `Retry-After`
header (integer seconds or HTTP-date); otherwise backoff is exponential. Auth
and other 4xx errors are never retried.

## Development

```bash
npm test        # node --test, runs offline (no API key required)
```

## Related libraries

Official Newsdata.io clients across languages and runtimes:

- **Python** — [newsdataapi/python-client](https://github.com/newsdataapi/python-client) ([PyPI](https://pypi.org/project/newsdataapi/))
- **React (hooks)** — [newsdataapi/newsdata-reactjs-client](https://github.com/newsdataapi/newsdata-reactjs-client) ([npm](https://www.npmjs.com/package/newsdataapi))
- **PHP** — [newsdataapi/php-client](https://github.com/newsdataapi/php-client) ([Packagist](https://packagist.org/packages/newsdataio/newsdataapi))
- **Java** — [newsdataapi/newsdata-java-sdk](https://github.com/newsdataapi/newsdata-java-sdk) ([Maven Central](https://central.sonatype.com/artifact/io.newsdata/newsdataapi))
- **.NET** — [newsdataapi/newsdata-dotnet-sdk](https://github.com/newsdataapi/newsdata-dotnet-sdk) ([NuGet](https://www.nuget.org/packages/Newsdata.Api/))
- **Go** — [newsdataapi/newsdata-go-client](https://github.com/newsdataapi/newsdata-go-client) ([pkg.go.dev](https://pkg.go.dev/github.com/newsdataapi/newsdata-go-client))
- **Dart / Flutter** — [newsdataapi/newsdata-flutter-client](https://github.com/newsdataapi/newsdata-flutter-client) ([pub.dev](https://pub.dev/packages/newsdataapi))
- **MCP Server (AI assistants)** — [newsdataapi/newsdata.io-mcp](https://github.com/newsdataapi/newsdata.io-mcp) ([PyPI](https://pypi.org/project/newsdata-mcp/))

Also see [free news datasets](https://github.com/newsdataapi/newsdata.io-free-datasets) for ML / NLP work.

## License

[MIT](./LICENSE)
