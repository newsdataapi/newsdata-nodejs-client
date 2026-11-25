// Type definitions for newsdata-nodejs-client.

export type ParamValue = string | number | boolean | Array<string | number>;

/** Endpoint parameters: API filters plus client-side control keys. */
export interface EndpointParams {
  [key: string]: ParamValue | undefined;
  /** Pass a raw query string or full URL verbatim; exclusive with all others. */
  rawQuery?: string;
  /** Follow nextPage / next_page cursors and resolve to one merged response. */
  scroll?: boolean;
  /** Return an async iterator that yields one response per page. */
  paginate?: boolean;
  /** Cap on merged results in scroll mode. */
  maxResult?: number;
  /** Cap on pages yielded in paginate mode. */
  maxPages?: number;
}

export interface NewsdataResponse {
  status?: string;
  /** v1 total; v2 answers with `total_results`. */
  totalResults?: number;
  results?: unknown;
  /** v1 cursor; v2 answers with `next_page`. */
  nextPage?: string | null;
  /** v2 total. */
  total_results?: number;
  /** v2 cursor. */
  next_page?: string | null;
  responseHeaders?: Record<string, string>;
  aggregate?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ClientOptions {
  /** API root without a version segment; default https://newsdata.io/api */
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryBackoff?: number;
  retryBackoffMax?: number;
  paginationDelay?: number;
  maxResult?: number;
  maxPages?: number;
  includeHeaders?: boolean;
  fetch?: typeof fetch;
  logger?: {
    debug?: (msg: string) => void;
    info?: (msg: string) => void;
    warn?: (msg: string) => void;
  };
}

/**
 * Endpoint methods return a `Promise<NewsdataResponse>` for single and
 * `scroll: true` calls, and an `AsyncGenerator<NewsdataResponse>` when
 * `paginate: true`.
 */
type EndpointResult =
  | Promise<NewsdataResponse>
  | AsyncGenerator<NewsdataResponse, void, unknown>;

export class NewsDataApiClient {
  constructor(apiKey: string, options?: ClientOptions);
  latestApi(params?: EndpointParams): EndpointResult;
  archiveApi(params?: EndpointParams): EndpointResult;
  cryptoApi(params?: EndpointParams): EndpointResult;
  marketApi(params?: EndpointParams): EndpointResult;
  countApi(params?: EndpointParams): EndpointResult;
  cryptoCountApi(params?: EndpointParams): EndpointResult;
  marketCountApi(params?: EndpointParams): EndpointResult;
  sourcesApi(params?: EndpointParams): Promise<NewsdataResponse>;

  /**
   * v2 endpoints. The filter vocabulary is snake_case (`q_in_title`,
   * `exclude_country`, `source_priority`, `content`, `remove_duplicate`, …)
   * and `source_url` / `exclude_source_url` replace the four domain filters.
   */
  news(params?: EndpointParams): EndpointResult;
  market(params?: EndpointParams): EndpointResult;
  crypto(params?: EndpointParams): EndpointResult;
  countNews(params?: EndpointParams): EndpointResult;
  countMarket(params?: EndpointParams): EndpointResult;
  countCrypto(params?: EndpointParams): EndpointResult;
  sources(params?: EndpointParams): Promise<NewsdataResponse>;

  /**
   * Register a real-time WebSocket query. POST /2/websocket/register
   * The real-time service is v2 only, so this takes the v2 filter names.
   */
  websocketRegister(params?: EndpointParams): Promise<NewsdataResponse>;
  /** List the account's registered real-time queries. GET /2/websocket/fetch */
  websocketFetch(): Promise<NewsdataResponse>;
  /** Delete a registered real-time query. DELETE /2/websocket/delete */
  websocketDelete(registrationId: string): Promise<NewsdataResponse>;
}

export interface WebSocketOptions {
  /** WebSocket endpoint; defaults to wss://ws.newsdata.io/ws/event. */
  baseUrl?: string;
  /** Reconnect automatically on transient drops. Default true. */
  reconnect?: boolean;
  /** Milliseconds before the first reconnect; doubles after each failure. */
  reconnectDelay?: number;
  /** Upper bound on the reconnect delay, in milliseconds. */
  reconnectDelayMax?: number;
  /** Milliseconds to wait for the opening handshake. */
  openTimeout?: number;
  /** WebSocket implementation; defaults to the global one (Node 22+). */
  WebSocket?: new (url: string) => unknown;
}

/**
 * NewsData.io real-time WebSocket service: registers, lists, and deletes the
 * account's real-time queries, and streams the responses for one of them.
 */
export class NewsDataApiWebSocket {
  constructor(client: NewsDataApiClient, options?: WebSocketOptions);

  /** Register a real-time query. */
  websocketRegister(params?: EndpointParams): Promise<NewsdataResponse>;
  /** List the account's registered real-time queries. */
  websocketFetch(): Promise<NewsdataResponse>;
  /** Delete a registered real-time query. */
  websocketDelete(registrationId: string): Promise<NewsdataResponse>;

  /** Yield each response for `registrationId` as it arrives. */
  stream(registrationId: string): AsyncGenerator<NewsdataResponse, void, unknown>;

  /** Close the active connection, ending any in-flight `stream()`. */
  close(): void;
}

export function redactApiKey(url: string): string;
export function validateParams(
  endpoint: string,
  params?: Record<string, unknown>,
  rawQuery?: string | null,
): Record<string, string>;

export class NewsdataError extends Error {}
export class NewsdataValidationError extends NewsdataError {
  param: string | null;
}
export class NewsdataApiError extends NewsdataError {
  statusCode: number | null;
  responseBody: object | null;
}
export class NewsdataAuthError extends NewsdataApiError {}
export class NewsdataRateLimitError extends NewsdataApiError {
  retryAfter: number | null;
}
/** The account's whole pool of API credits is exhausted. */
export class NewsdataApiLimitExceededError extends NewsdataRateLimitError {}
/** This one API key's own credit cap is exhausted. */
export class NewsdataApiKeyLimitExceededError extends NewsdataRateLimitError {}
export class NewsdataServerError extends NewsdataApiError {}
export class NewsdataNetworkError extends NewsdataError {
  cause?: Error;
}
export class NewsdataWebSocketError extends NewsdataError {
  cause?: Error;
}
export class NewsdataWebSocketAuthError extends NewsdataWebSocketError {}

export as namespace newsdata;
