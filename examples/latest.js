import { NewsDataApiClient, NewsdataError } from '../src/index.js';

const client = new NewsDataApiClient(process.env.NEWSDATA_API_KEY);

try {
  // A value may be a string or an array of strings (sent comma-separated).
  const res = await client.latestApi({
    q: 'bitcoin',
    country: ['us', 'gb'],
    language: 'en',
  });
  for (const article of res.results) {
    console.log(article.title, '-', article.link);
  }
} catch (err) {
  if (err instanceof NewsdataError) console.error('Request failed:', err.message);
  else throw err;
}
