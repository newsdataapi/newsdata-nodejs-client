import {
  NewsDataApiClient,
  NewsdataValidationError,
  NewsdataAuthError,
  NewsdataRateLimitError,
  NewsdataApiError,
  NewsdataNetworkError,
} from '../src/index.js';

const client = new NewsDataApiClient(process.env.NEWSDATA_API_KEY);

try {
  // Market / financial news.
  const market = await client.marketApi({ q: 'apple', symbol: 'AAPL' });
  console.log('market articles:', market.results.length);

  // Count endpoints require from_date and to_date.
  const dates = { from_date: '2024-01-01', to_date: '2024-01-31', interval: 'day' };
  const counts = await client.countApi({ ...dates, q: 'election' });
  console.log('count buckets:', counts.results);
} catch (err) {
  if (err instanceof NewsdataValidationError) console.error(`Invalid param (${err.param}):`, err.message);
  else if (err instanceof NewsdataAuthError) console.error('Auth failed:', err.statusCode);
  else if (err instanceof NewsdataRateLimitError) console.error('Rate limited; retry after', err.retryAfter, 's');
  else if (err instanceof NewsdataApiError) console.error('API error', err.statusCode, err.message);
  else if (err instanceof NewsdataNetworkError) console.error('Network failure:', err.message);
  else throw err;
}
