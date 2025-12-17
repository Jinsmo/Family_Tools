import { Response } from 'express';
import { pool } from '../db/mysql';
import { AuthRequest } from '../middleware/authMiddleware';

// 获取种草清单列表
export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }

    // 1. 检查当前用户是否为管理员
    const [userRows]: any = await pool.query('SELECT is_admin FROM users WHERE id = ?', [userId]);
    const isAdmin = userRows.length > 0 && userRows[0].is_admin === 1;

    let query = `
      SELECT w.*, u.nickname as user_nickname, u.avatar as user_avatar 
      FROM wishlist_items w 
      LEFT JOIN users u ON w.user_id = u.id
    `;
    const params: any[] = [];

    // 2. 权限控制
    if (isAdmin) {
      // 管理员可以看到所有数据 (共享彼此数据)
      // 修改为：只要是管理员，就能看到所有人的数据（包括其他管理员和普通用户）
      // 无需 WHERE user_id = ? 限制
      query += ' ORDER BY w.created_at DESC';
    } else {
      // 普通用户只能看自己的
      query += ' WHERE w.user_id = ? ORDER BY w.created_at DESC';
      params.push(userId);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: '获取清单失败' });
  }
};

// 获取单个种草详情
export const getWishlistItem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;
    
    // 检查权限逻辑同 list，或者简单处理：查出来判断 user_id 或 isAdmin
    const [userRows]: any = await pool.query('SELECT is_admin FROM users WHERE id = ?', [userId]);
    const isAdmin = userRows.length > 0 && userRows[0].is_admin === 1;

    const [rows]: any = await pool.query('SELECT * FROM wishlist_items WHERE id = ?', [itemId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '未找到该记录' });
    }

    const item = rows[0];
    if (!isAdmin && item.user_id !== userId) {
      return res.status(403).json({ error: '无权查看' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get wishlist item error:', error);
    res.status(500).json({ error: '获取详情失败' });
  }
};

// 创建种草
export const createWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, type, location, remark } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: '名称和类型必填' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO wishlist_items (user_id, name, type, location, remark) VALUES (?, ?, ?, ?, ?)',
      [userId, name, type, location || null, remark || null]
    );

    res.status(201).json({ id: result.insertId, message: '创建成功' });
  } catch (error) {
    console.error('Create wishlist error:', error);
    res.status(500).json({ error: '创建失败' });
  }
};

// 更新种草
export const updateWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;
    const { name, type, location, remark, is_completed } = req.body;

    // 鉴权
    const [userRows]: any = await pool.query('SELECT is_admin FROM users WHERE id = ?', [userId]);
    const isAdmin = userRows.length > 0 && userRows[0].is_admin === 1;

    const [itemRows]: any = await pool.query('SELECT user_id FROM wishlist_items WHERE id = ?', [itemId]);
    if (itemRows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    if (!isAdmin && itemRows[0].user_id !== userId) {
      return res.status(403).json({ error: '无权修改' });
    }

    await pool.query(
      'UPDATE wishlist_items SET name = ?, type = ?, location = ?, remark = ?, is_completed = ? WHERE id = ?',
      [name, type, location, remark, is_completed, itemId]
    );

    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('Update wishlist error:', error);
    res.status(500).json({ error: '更新失败' });
  }
};

// 删除种草
export const deleteWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;

    // 鉴权
    const [userRows]: any = await pool.query('SELECT is_admin FROM users WHERE id = ?', [userId]);
    const isAdmin = userRows.length > 0 && userRows[0].is_admin === 1;

    const [itemRows]: any = await pool.query('SELECT user_id FROM wishlist_items WHERE id = ?', [itemId]);
    if (itemRows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    if (!isAdmin && itemRows[0].user_id !== userId) {
      return res.status(403).json({ error: '无权删除' });
    }

    await pool.query('DELETE FROM wishlist_items WHERE id = ?', [itemId]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete wishlist error:', error);
    res.status(500).json({ error: '删除失败' });
  }
};
