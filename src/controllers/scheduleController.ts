import { Response } from 'express';
import { pool } from '../db/mysql';
import { AuthRequest } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 获取日程列表
export const getSchedules = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM schedules WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      query += ' AND end_time >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND start_time <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY start_time ASC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (error) {
    console.error('获取日程失败:', error);
    res.status(500).json({ error: '获取日程失败' });
  }
};

// 创建日程
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, start_time, end_time, is_all_day, location, type, color } = req.body;
    const creator_id = req.user?.id;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO schedules (title, description, start_time, end_time, is_all_day, location, type, color, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, start_time, end_time, is_all_day ? 1 : 0, location, type || 'event', color || '#1989fa', creator_id]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: '日程创建成功' 
    });
  } catch (error) {
    console.error('创建日程失败:', error);
    res.status(500).json({ error: '创建日程失败' });
  }
};

// 更新日程
export const updateSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, start_time, end_time, is_all_day, location, type, color } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE schedules 
       SET title = ?, description = ?, start_time = ?, end_time = ?, is_all_day = ?, location = ?, type = ?, color = ?
       WHERE id = ?`,
      [title, description, start_time, end_time, is_all_day ? 1 : 0, location, type, color, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '日程不存在' });
    }

    res.json({ message: '日程更新成功' });
  } catch (error) {
    console.error('更新日程失败:', error);
    res.status(500).json({ error: '更新日程失败' });
  }
};

// 删除日程
export const deleteSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM schedules WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '日程不存在' });
    }

    res.json({ message: '日程删除成功' });
  } catch (error) {
    console.error('删除日程失败:', error);
    res.status(500).json({ error: '删除日程失败' });
  }
};
