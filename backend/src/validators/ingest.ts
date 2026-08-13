import { z } from 'zod';

export const ingestErrorSchema = z.object({
  eventId: z.string().optional(),
  errorType: z.string().min(1, "errorType is required"),
  message: z.string().min(1, "message is required"),
  stackTrace: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  user: z.record(z.string(), z.any()).optional(),
  environment: z.string().optional(),
  endpoint: z.string().optional(),
  source: z.string().optional().default('backend')
});

export const ingestPerformanceSchema = z.object({
  eventId: z.string().optional(),
  url: z.string().url("Invalid URL"),
  pageLoadTime: z.number().nonnegative(),
  cls: z.number().nonnegative().optional(),
  lcp: z.number().nonnegative().optional()
});

export const ingestMetricSchema = z.object({
  eventId: z.string().optional(),
  endpoint: z.string().min(1, "endpoint is required"),
  method: z.string().min(1, "method is required"),
  statusCode: z.number().int().min(100).max(599),
  responseTime: z.number().nonnegative(),
  user: z.string().optional(),
  environment: z.string().optional(),
  ip: z.string().optional(),
  headers: z.record(z.string(), z.any()).optional(),
  body: z.any().optional(),
  response: z.any().optional()
});

export const ingestLogSchema = z.object({
  eventId: z.string().optional(),
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string().min(1, "message is required"),
  service: z.string().min(1, "service is required"),
  metadata: z.record(z.string(), z.any()).optional()
});
