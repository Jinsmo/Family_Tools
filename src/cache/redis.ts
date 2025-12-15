import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  lazyConnect: true,
});

export async function pingRedis(): Promise<boolean> {
  try {
    await redis.connect();
    const pong = await redis.ping();
    await redis.quit();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
