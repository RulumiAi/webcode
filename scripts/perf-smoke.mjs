import { performance } from 'node:perf_hooks';

const urls = process.argv.slice(2);
if (urls.length === 0) urls.push('http://127.0.0.1:3000/');

for (const url of urls) {
  const start = performance.now();
  const response = await fetch(url, { redirect: 'follow' });
  const body = await response.arrayBuffer();
  const elapsed = performance.now() - start;
  console.log(JSON.stringify({
    url,
    status: response.status,
    contentEncoding: response.headers.get('content-encoding'),
    cacheControl: response.headers.get('cache-control'),
    contentType: response.headers.get('content-type'),
    bytes: body.byteLength,
    elapsedMs: Math.round(elapsed),
  }));
}
