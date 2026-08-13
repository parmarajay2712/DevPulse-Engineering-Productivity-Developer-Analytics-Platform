import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import mongoose from 'mongoose';
import User, { UserRole } from '../models/User';
import Project from '../models/Project';
import Organization from '../models/Organization';

describe('RBAC Middleware', () => {
  let adminToken = '';
  let memberToken = '';
  let outsideToken = '';
  let projectId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devpulse-test');
    }

    const org1 = await Organization.create({ name: 'Org 1' });
    const org2 = await Organization.create({ name: 'Org 2' });

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@rbac.com',
      password: 'password',
      role: UserRole.ADMIN,
      organizationId: org1._id
    });

    const member = await User.create({
      name: 'Member',
      email: 'member@rbac.com',
      password: 'password',
      role: UserRole.MEMBER,
      organizationId: org1._id
    });

    const outsider = await User.create({
      name: 'Outsider',
      email: 'outsider@rbac.com',
      password: 'password',
      role: UserRole.MEMBER,
      organizationId: org2._id
    });

    const proj = await Project.create({
      name: 'Test Proj',
      organizationId: org1._id,
      ownerId: admin._id,
      apiKeyHash: 'hash',
      apiKeyPreview: 'key'
    });
    projectId = proj._id.toString();

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    adminToken = jwt.sign({ id: admin._id }, secret);
    memberToken = jwt.sign({ id: member._id }, secret);
    outsideToken = jwt.sign({ id: outsider._id }, secret);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  it('should allow members of the same organization to view projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
  });

  it('should deny cross-organization access for a specific project', async () => {
    // Outsider (Org 2) trying to access Project (Org 1)
    const res = await request(app)
      .post(`/api/projects/${projectId}/regenerate-key`)
      .set('Authorization', `Bearer ${outsideToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow Admin to update project settings (RBAC role check)', async () => {
    // Only Admin/Owner should update
    const res = await request(app)
      .post(`/api/projects/${projectId}/regenerate-key`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should deny Member from updating project settings', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/regenerate-key`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });
});
