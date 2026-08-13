const http = require('http');

const API_KEY = '6ba222d442872817bafd65853fa4332e88d1d536ee71b0fc0a8f32d0d1bedbbf';
const BASE_URL = 'http://localhost:5000/api';

const sendError = () => {
  const data = JSON.stringify({
    errorType: 'TypeError',
    message: `Cannot read property 'id' of undefined - ${Date.now()}`,
    stackTrace: 'TypeError: Cannot read property \'id\' of undefined\n    at Object.<anonymous> (/app/src/index.js:10:15)',
    metadata: { browser: 'Chrome', os: 'Windows' },
    environment: 'production',
    endpoint: '/api/users/profile',
  });

  const req = http.request(`${BASE_URL}/ingest/errors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Error ingested:', body));
  });

  req.on('error', console.error);
  req.write(data);
  req.end();
};

const sendPerformance = () => {
    const data = JSON.stringify({
      url: '/dashboard',
      pageLoadTime: Math.floor(Math.random() * 500) + 100,
      cls: 0.05,
      lcp: 1200
    });
  
    const req = http.request(`${BASE_URL}/ingest/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => console.log('Performance ingested:', body));
    });
  
    req.on('error', console.error);
    req.write(data);
    req.end();
  };

sendError();
sendPerformance();
