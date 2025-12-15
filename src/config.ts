import { config as dotenvLoad } from 'dotenv';
import { z } from 'zod';

dotenvLoad();

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']),
  appName: z.string().min(1),
  appHost: z.string().min(1),
  appPort: z.number().int().min(1).max(65535),
  icpNo: z.string().optional(),
  mysql: z.object({
    host: z.string().min(1),
    port: z.number().int().min(1),
    user: z.string().min(1),
    password: z.string().optional(),
    database: z.string().min(1),
    connectionLimit: z.number().int().min(1).max(1000),
  }),
  redis: z.object({
    host: z.string().min(1),
    port: z.number().int().min(1),
    password: z.string().optional(),
    db: z.number().int().min(0),
  }),
});

const env = process.env;

const raw = {
  nodeEnv: (env.NODE_ENV as 'development' | 'production' | 'test') ?? 'development',
  appName: env.APP_NAME ?? 'fm_tools',
  appHost: env.APP_HOST ?? '127.0.0.1',
  appPort: env.APP_PORT ? Number(env.APP_PORT) : 3000,
  icpNo: env.ICP_NO ?? '',
  mysql: {
    host: env.MYSQL_HOST ?? '127.0.0.1',
    port: env.MYSQL_PORT ? Number(env.MYSQL_PORT) : 3306,
    user: env.MYSQL_USER ?? 'root',
    password: env.MYSQL_PASSWORD ?? '',
    database: env.MYSQL_DATABASE ?? 'fm_tools',
    connectionLimit: env.MYSQL_CONN_LIMIT ? Number(env.MYSQL_CONN_LIMIT) : 10,
  },
  redis: {
    host: env.REDIS_HOST ?? '127.0.0.1',
    port: env.REDIS_PORT ? Number(env.REDIS_PORT) : 6379,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB ? Number(env.REDIS_DB) : 0,
  },
};

const parsed = ConfigSchema.safeParse(raw);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`配置校验失败: ${issues}`);
}

export type AppConfig = z.infer<typeof ConfigSchema>;
export const config: AppConfig = parsed.data;
