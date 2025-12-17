import express, { Request, Response } from 'express';
import path from 'path';
import { config } from './config';
import { pingMySQL } from './db/mysql';
import { pingRedis } from './cache/redis';
import authRoutes from './routes/authRoutes';
import familyRoutes from './routes/familyRoutes';
import menuRoutes from './routes/menuRoutes';
import passwordRoutes from './routes/passwordRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import uploadRoutes from './routes/uploadRoutes';
import locationRoutes from './routes/locationRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import { initDB } from './db/init';

const app = express();
app.use(express.json());

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.get('/health', async (req: Request, res: Response) => {
  const [mysqlOk, redisOk] = await Promise.all([pingMySQL(), pingRedis()]);
  res.json({
    status: 'ok',
    name: config.appName,
    env: config.nodeEnv,
    host: config.appHost,
    port: config.appPort,
    icpNo: config.icpNo,
    uptime: process.uptime(),
    mysql: {
      reachable: mysqlOk,
      host: config.mysql.host,
      port: config.mysql.port,
      database: config.mysql.database,
      connectionLimit: config.mysql.connectionLimit,
    },
    redis: {
      reachable: redisOk,
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db,
    },
  });
});

export function startServer() {
  initDB();
  const server = app.listen(config.appPort, config.appHost, () => {
    console.log(`${config.appName} listening on http://${config.appHost}:${config.appPort}`);
  });
  return server;
}

export { app };
