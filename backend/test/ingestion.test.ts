import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index'; // Need to export app from index
import mongoose from 'mongoose';
import Project from '../models/Project';
import Organization from '../models/Organization';

describe('Ingestion API', () => {
  let projectApiKey = '';
  
  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devpulse-test');
    }
    
    // Create a mock org and project
    const org = await Organization.create({ name: 'Test Org' });
    const proj = await Project.create({
      name: 'Test Proj',
      organizationId: org._id,
      ownerId: new mongoose.Types.ObjectId(), // mock user id
      apiKeyHash: 'dummy',
      apiKeyPreview: 'key_test',
      environment: 'production'
    });
    
    // The ingestion middleware expects a valid API key, so we need one that passes ProjectAuth.
    // For this test, we can just insert a known key hash.
    const bcrypt = require('bcryptjs');
    const rawKey = 'test-api-key';
    const hash = await bcrypt.hash(rawKey, 10);
    proj.apiKeyHash = hash;
    await proj.save();
    
    projectApiKey = `${proj._id}.${rawKey}`;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('should reject requests without an API key', async () => {
    const res = await request(app)
      .post('/api/ingest/metrics')
      .send({ metrics: [] });
    
    expect(res.status).toBe(401);
  });

  it('should reject requests with invalid payload', async () => {
    const res = await request(app)
      .post('/api/ingest/metrics')
      .set('x-api-key', projectApiKey)
      .send({ invalidField: true }); // Missing 'metrics' array
    
    expect(res.status).toBe(400);
  });

  it('should accept valid metrics payload', async () => {
    const res = await request(app)
      .post('/api/ingest/metrics')
      .set('x-api-key', projectApiKey)
      .send({
        eventId: 'unique-id-1',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 120,
      });
    
    expect(res.status).toBe(201);
  });
});
