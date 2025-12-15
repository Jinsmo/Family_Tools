import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_me';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token 无效或已过期' });
    }
    req.user = user;
    next();
  });
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: '未授权' });
    }

    // Check database for latest role status
    const [rows]: any = await pool.query('SELECT is_admin FROM users WHERE id = ?', [req.user.id]);
    
    if (rows.length === 0 || rows[0].is_admin !== 1) {
      return res.status(403).json({ error: '权限不足' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};
