import { NewsDataApiClient } from '../src/index.js';

const client = new NewsDataApiClient(process.env.NEWSDATA_API_KEY);

// 1. scroll: follow nextPage cursors and get one merged result.
const merged = await client.latestApi({ q: 'news', scroll: true, maxResult: 200 });
console.log('merged results:', merged.results.length);

// 2. paginate: iterate one response per page (async generator).
let page = 0;
for await (const res of client.latestApi({ q: 'news', paginate: true, maxPages: 5 })) {
  console.log(`page ${++page}:`, res.results.length, 'articles');
}
