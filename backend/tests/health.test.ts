import request from 'supertest';
import { createApp } from '../src/app';

describe('ShenoDev Backend - TDD Health Check', () => {
  const app = createApp();

  // Health endpoints must work without DB (graceful degraded mode).
  // No DB connection required for these tests - app reports degraded if DB disconnected.
  beforeAll(async () => {
    // Intentionally no DB connection - verifies graceful handling
  });

  afterAll(async () => {
    // no-op
  });

  describe('GET /health', () => {
    it('should return 200 and service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'shenodev-backend');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 with DB status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(['ok', 'degraded']).toContain(res.body.status);
      expect(res.body).toHaveProperty('db');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /', () => {
    it('should return 200 with service info (browser landing)', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('service', 'shenodev-backend');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toContain('/health');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
