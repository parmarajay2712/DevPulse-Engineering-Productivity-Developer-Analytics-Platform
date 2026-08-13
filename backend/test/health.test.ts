import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Simple mock app for testing routes independently
const app = express();
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

describe('Health Endpoints', () => {
  it('should return 200 OK from basic health route', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
