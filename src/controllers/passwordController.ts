import { Response } from 'express';
import { pool } from '../db/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthRequest } from '../middleware/authMiddleware';
import { encrypt, decrypt } from '../utils/crypto';

// Types
interface Category extends RowDataPacket {
  id: number;
  user_id: number;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

interface Entry extends RowDataPacket {
  id: number;
  user_id: number;
  category_id: number | null;
  title: string;
  account: string;
  encrypted_password: string;
  url: string | null;
  remark: string | null;
  is_favorite: number;
  created_at: Date;
  updated_at: Date;
}

// Get all categories for current user
export const getCategories = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const [categories] = await pool.query<Category[]>(
            'SELECT * FROM password_categories WHERE user_id = ? ORDER BY sort_order DESC, created_at DESC',
            [userId]
        );
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

// Create category
export const createCategory = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { name, icon, sort_order } = req.body;

    if (!name) return res.status(400).json({ error: 'Category name is required' });

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO password_categories (user_id, name, icon, sort_order) VALUES (?, ?, ?, ?)',
            [userId, name, icon || null, sort_order || 0]
        );
        res.status(201).json({ id: result.insertId, name, icon, sort_order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const categoryId = req.params.id;
    const { name, icon, sort_order } = req.body;

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE password_categories SET name = ?, icon = ?, sort_order = ? WHERE id = ? AND user_id = ?',
            [name, icon, sort_order, categoryId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

// Delete category
export const deleteCategory = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const categoryId = req.params.id;

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM password_categories WHERE id = ? AND user_id = ?',
            [categoryId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
};

// Get all entries for current user (optionally filtered by category)
export const getEntries = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { category_id, is_favorite, keyword } = req.query;

    try {
        let query = 'SELECT id, user_id, category_id, title, account, url, remark, is_favorite, created_at, updated_at FROM password_entries WHERE user_id = ?';
        const params: any[] = [userId];

        if (category_id) {
            query += ' AND category_id = ?';
            params.push(category_id);
        }
        if (is_favorite === '1' || is_favorite === 'true') {
            query += ' AND is_favorite = 1';
        }
        if (keyword) {
            query += ' AND (title LIKE ? OR account LIKE ? OR remark LIKE ?)';
            const likeKeyword = `%${keyword}%`;
            params.push(likeKeyword, likeKeyword, likeKeyword);
        }

        query += ' ORDER BY is_favorite DESC, created_at DESC';

        const [entries] = await pool.query<Entry[]>(query, params);
        res.json(entries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
};

// Create entry
export const createEntry = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { category_id, title, account, password, url, remark, is_favorite } = req.body;

    if (!title || !account || !password) {
        return res.status(400).json({ error: 'Title, account and password are required' });
    }

    try {
        // Verify category ownership if provided
        if (category_id) {
            const [cats] = await pool.query<Category[]>('SELECT id FROM password_categories WHERE id = ? AND user_id = ?', [category_id, userId]);
            if (cats.length === 0) {
                return res.status(400).json({ error: 'Invalid category' });
            }
        }

        const encryptedPassword = encrypt(password);
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO password_entries (user_id, category_id, title, account, encrypted_password, url, remark, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, category_id || null, title, account, encryptedPassword, url || null, remark || null, is_favorite ? 1 : 0]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create entry' });
    }
};

// Update entry
export const updateEntry = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const entryId = req.params.id;
    const { category_id, title, account, password, url, remark, is_favorite } = req.body;

    try {
         // Verify category ownership if provided
         if (category_id) {
            const [cats] = await pool.query<Category[]>('SELECT id FROM password_categories WHERE id = ? AND user_id = ?', [category_id, userId]);
            if (cats.length === 0) {
                return res.status(400).json({ error: 'Invalid category' });
            }
        }

        let query = 'UPDATE password_entries SET category_id = ?, title = ?, account = ?, url = ?, remark = ?, is_favorite = ?';
        const params: any[] = [category_id || null, title, account, url, remark, is_favorite ? 1 : 0];

        if (password) {
            query += ', encrypted_password = ?';
            params.push(encrypt(password));
        }

        query += ' WHERE id = ? AND user_id = ?';
        params.push(entryId, userId);

        const [result] = await pool.query<ResultSetHeader>(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ message: 'Entry updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
};

// Delete entry
export const deleteEntry = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const entryId = req.params.id;

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM password_entries WHERE id = ? AND user_id = ?',
            [entryId, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
};

// Get decrypted password
export const getEntryPassword = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const entryId = req.params.id;

    try {
        const [entries] = await pool.query<Entry[]>(
            'SELECT encrypted_password FROM password_entries WHERE id = ? AND user_id = ?',
            [entryId, userId]
        );
        if (entries.length === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        const password = decrypt(entries[0].encrypted_password);
        res.json({ password });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get password' });
    }
};
