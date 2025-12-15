import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/mysql';
import { z } from 'zod';
import { config } from '../config';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_me';

// Zod schemas
const registerSchema = z.object({
  username: z.string().min(3),
  nickname: z.string().min(1),
  password: z.string().min(6),
  phone: z.string().min(11),
  family_role: z.string().min(1),
  gender: z.string().optional(),
  birthday: z.string().optional()
  // code: z.string() // Verify code if implemented
});

const loginSchema = z.object({
  account: z.string(), // username or phone
  password: z.string(),
});

const resetPasswordSchema = z.object({
  account: z.string(),
  password: z.string().min(6),
  // code: z.string()
});

const updateProfileSchema = z.object({
  nickname: z.string().min(1).optional(),
  family_role: z.string().min(1).optional(),
  phone: z.string().min(11).optional(),
  birthday: z.string().optional(), // YYYY-MM-DD
  password: z.string().min(6).optional(),
  avatar: z.string().optional() // New avatar field
});

const updateUserAdminSchema = z.object({
  username: z.string().min(3).optional(),
  nickname: z.string().min(1).optional(),
  phone: z.string().min(11).optional(),
  family_role: z.string().min(1).optional(),
  gender: z.string().optional(),
  birthday: z.string().optional().nullable(),
  is_admin: z.number().int().min(0).max(1).optional(),
  family_points: z.number().int().min(0).optional(),
  remark: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
});

export const authController = {
  async getAllUsers(req: Request, res: Response) {
    try {
      const [users]: any = await pool.query('SELECT id, username, nickname, phone, family_role, gender, birthday, is_admin, family_points, remark, created_at FROM users ORDER BY id DESC');
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '获取用户列表失败' });
    }
  },

  async updateUserAdmin(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const data = updateUserAdminSchema.parse(req.body);
      
      const updates: string[] = [];
      const values: any[] = [];

      if (data.username) { updates.push('username = ?'); values.push(data.username); }
      if (data.nickname) { updates.push('nickname = ?'); values.push(data.nickname); }
      if (data.phone) { updates.push('phone = ?'); values.push(data.phone); }
      if (data.family_role) { updates.push('family_role = ?'); values.push(data.family_role); }
      if (data.gender) { updates.push('gender = ?'); values.push(data.gender); }
      if (data.birthday !== undefined) { updates.push('birthday = ?'); values.push(data.birthday || null); }
      if (data.is_admin !== undefined) { updates.push('is_admin = ?'); values.push(data.is_admin); }
      if (data.family_points !== undefined) { updates.push('family_points = ?'); values.push(data.family_points); }
      if (data.remark !== undefined) { updates.push('remark = ?'); values.push(data.remark); }
      if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
      }

      if (updates.length === 0) {
        return res.json({ message: '无修改内容' });
      }

      values.push(userId);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
      
      res.json({ message: '更新成功' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error(error);
      res.status(500).json({ error: '更新失败' });
    }
  },

  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user exists
      const [rows]: any = await pool.query(
        'SELECT id FROM users WHERE username = ? OR phone = ?',
        [data.username, data.phone]
      );
      
      if (rows.length > 0) {
        return res.status(400).json({ error: '用户名或手机号已存在' });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await pool.query(
        'INSERT INTO users (username, nickname, password, phone, family_role, gender, birthday) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.username, data.nickname, hashedPassword, data.phone, data.family_role, data.gender || 'unknown', data.birthday || null]
      );

      res.status(201).json({ message: '注册成功' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error(error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);

      const [rows]: any = await pool.query(
        'SELECT * FROM users WHERE username = ? OR phone = ?',
        [data.account, data.account]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: '账号或密码错误' });
      }

      const user = rows[0];
      const validPassword = await bcrypt.compare(data.password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: '账号或密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.is_admin ? 'admin' : 'user' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return fields consistent with users table
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          family_role: user.family_role,
          family_points: user.family_points || 0,
          check_in_days: user.check_in_days || 0,
          birthday: user.birthday,
          avatar: user.avatar,
          phone: user.phone,
          is_admin: user.is_admin
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error(error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const [rows]: any = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const user = rows[0];
      delete user.password;

      res.json({ user });
    } catch (error: any) {
      console.error('getProfile error:', error);
      res.status(500).json({ error: '服务器内部错误', message: error.message });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const data = updateProfileSchema.parse(req.body);
      
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: '没有需要更新的数据' });
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (data.nickname) {
        updates.push('nickname = ?');
        values.push(data.nickname);
      }
      if (data.family_role) {
        updates.push('family_role = ?');
        values.push(data.family_role);
      }
      if (data.phone) {
        updates.push('phone = ?');
        values.push(data.phone);
      }
      if (data.birthday) {
        updates.push('birthday = ?');
        values.push(data.birthday);
      }
      if (data.avatar) {
        updates.push('avatar = ?');
        values.push(data.avatar);
      }
      if (data.password) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
      }

      values.push(userId);

      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      res.json({ message: '更新成功' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error(error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const data = resetPasswordSchema.parse(req.body);

      // In a real app, verify 'code' here.
      
      const [rows]: any = await pool.query(
        'SELECT id FROM users WHERE username = ? OR phone = ?',
        [data.account, data.account]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const userId = rows[0].id;
      const hashedPassword = await bcrypt.hash(data.password, 10);

      await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );

      res.json({ message: '密码重置成功' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error(error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
};
