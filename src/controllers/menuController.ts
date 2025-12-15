import { Request, Response } from 'express';
import { pool } from '../db/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { AuthRequest } from '../middleware/authMiddleware';

// Types
interface Category extends RowDataPacket {
  id: number;
  name: string;
  parent_id: number | null;
}
interface MenuItem extends RowDataPacket {
  id: number;
  category_id: number;
  name: string;
  image_url: string;
  price_points: number;
  description: string;
}
interface ItemSpec extends RowDataPacket {
  id: number;
  item_id: number;
  spec_name: string;
  spec_options: any; // JSON
  is_multiple: number;
}

interface ItemDetail extends RowDataPacket {
  id: number;
  item_id: number;
  ingredients: any;
  recipe_steps: string;
  tips: string;
}

interface UserAddress extends RowDataPacket {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address: string;
  is_default: number;
}

export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  let isAdmin = req.user?.role === 'admin';
  const orderId = req.params.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Double check admin status
  if (!isAdmin) {
    try {
      const [users] = await pool.query<RowDataPacket[]>('SELECT is_admin FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].is_admin === 1) {
        isAdmin = true;
      }
    } catch (e) {
      console.error('Failed to check admin status', e);
    }
  }

  try {
    let query = 'SELECT * FROM menu_orders WHERE id = ?';
    const params: any[] = [orderId];

    if (!isAdmin) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    const [orders] = await pool.query<any[]>(query, params);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orders[0];

    const [items] = await pool.query<any[]>('SELECT * FROM menu_order_items WHERE order_id = ?', [orderId]);
    order.items = items;

    // Fetch user nickname
    const [user] = await pool.query<any[]>('SELECT nickname FROM users WHERE id = ?', [order.user_id]);
    if (user.length > 0) {
      order.user_nickname = user[0].nickname;
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

// --- Category Management ---

export const getCategories = async (req: Request, res: Response) => {
  try {
    const [categories] = await pool.query<Category[]>('SELECT * FROM menu_categories ORDER BY sort ASC');
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// --- Menu Item Management ---

export const getAdminItems = async (req: Request, res: Response) => {
  try {
    const [items] = await pool.query(`
      SELECT i.*, c.name as category_name 
      FROM menu_items i 
      LEFT JOIN menu_categories c ON i.category_id = c.id 
      ORDER BY i.id DESC
    `);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

export const getAdminItemDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [items]: any = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (items.length === 0) return res.status(404).json({ error: 'Item not found' });
    const item = items[0];

    // Get details
    const [details]: any = await pool.query('SELECT * FROM menu_item_details WHERE item_id = ?', [id]);
    item.details = details.length > 0 ? details[0] : null;

    // Get specs
    const [specs]: any = await pool.query('SELECT * FROM menu_item_specs WHERE item_id = ?', [id]);
    item.specs = specs;

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch item detail' });
  }
};

export const addMenuItem = async (req: Request, res: Response) => {
  const { category_id, name, image_url, price_points, description, status, details, specs } = req.body;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert Item
    const [result]: any = await conn.query(
      'INSERT INTO menu_items (category_id, name, image_url, price_points, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [category_id, name, image_url, price_points, description, status ?? 1]
    );
    const itemId = result.insertId;

    // Insert Details
    if (details) {
      await conn.query(
        'INSERT INTO menu_item_details (item_id, ingredients, recipe_steps, tips) VALUES (?, ?, ?, ?)',
        [itemId, JSON.stringify(details.ingredients || []), details.recipe_steps || '', details.tips || '']
      );
    }

    // Insert Specs
    if (specs && specs.length > 0) {
      const specValues = specs.map((s: any) => [itemId, s.spec_name, JSON.stringify(s.spec_options), s.is_multiple ? 1 : 0]);
      await conn.query('INSERT INTO menu_item_specs (item_id, spec_name, spec_options, is_multiple) VALUES ?', [specValues]);
    }

    await conn.commit();
    res.json({ success: true, id: itemId });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to add item' });
  } finally {
    conn.release();
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category_id, name, image_url, price_points, description, status, details, specs } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update Item
    await conn.query(
      'UPDATE menu_items SET category_id = ?, name = ?, image_url = ?, price_points = ?, description = ?, status = ? WHERE id = ?',
      [category_id, name, image_url, price_points, description, status, id]
    );

    // Update Details (Upsert logic or Delete-Insert? Details is 1-to-1)
    // Try update first
    const [detailRes]: any = await conn.query('UPDATE menu_item_details SET ingredients = ?, recipe_steps = ?, tips = ? WHERE item_id = ?', 
      [JSON.stringify(details?.ingredients || []), details?.recipe_steps || '', details?.tips || '', id]);
    
    if (detailRes.affectedRows === 0 && details) {
      // Insert if not exists
      await conn.query(
        'INSERT INTO menu_item_details (item_id, ingredients, recipe_steps, tips) VALUES (?, ?, ?, ?)',
        [id, JSON.stringify(details.ingredients || []), details.recipe_steps || '', details.tips || '']
      );
    }

    // Update Specs (Delete all and re-insert is easiest)
    await conn.query('DELETE FROM menu_item_specs WHERE item_id = ?', [id]);
    if (specs && specs.length > 0) {
      const specValues = specs.map((s: any) => [id, s.spec_name, JSON.stringify(s.spec_options), s.is_multiple ? 1 : 0]);
      await conn.query('INSERT INTO menu_item_specs (item_id, spec_name, spec_options, is_multiple) VALUES ?', [specValues]);
    }

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  } finally {
    conn.release();
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Foreign keys might handle cascading if configured, but let's be explicit
    await conn.query('DELETE FROM menu_item_details WHERE item_id = ?', [id]);
    await conn.query('DELETE FROM menu_item_specs WHERE item_id = ?', [id]);
    // Also delete order items? No, that would break order history.
    // Usually we just mark as deleted or check if it's used.
    // User asked for "Delete", let's just delete the item. If DB enforces FK on orders, it will fail.
    // Assuming menu_order_items stores snapshot data (name, specs), not FK? 
    // Checking create_menu_orders.sql... wait, I don't see create_menu_orders.sql content in history.
    // But in createOrder code: 'INSERT INTO menu_order_items (order_id, item_id, item_name...)'
    // If item_id is FK, it might restrict delete.
    // Let's assume soft delete is better or just try delete. 
    // Given the requirement "Delete", I will try physical delete.
    
    await conn.query('DELETE FROM menu_items WHERE id = ?', [id]);

    await conn.commit();
    res.json({ success: true });
  } catch (error: any) {
    await conn.rollback();
    console.error(error);
    // If FK constraint fails
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: '该菜品已被订单引用，无法删除，建议下架' });
    }
    res.status(500).json({ error: 'Failed to delete item' });
  } finally {
    conn.release();
  }
};

export const deleteMenuItemsBatch = async (req: Request, res: Response) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No items selected' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Prepare placeholders
    const placeholders = ids.map(() => '?').join(',');

    await conn.query(`DELETE FROM menu_item_details WHERE item_id IN (${placeholders})`, ids);
    await conn.query(`DELETE FROM menu_item_specs WHERE item_id IN (${placeholders})`, ids);
    await conn.query(`DELETE FROM menu_items WHERE id IN (${placeholders})`, ids);

    await conn.commit();
    res.json({ success: true });
  } catch (error: any) {
    await conn.rollback();
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: '部分菜品已被订单引用，无法删除' });
    }
    res.status(500).json({ error: 'Failed to delete items' });
  } finally {
    conn.release();
  }
};

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  let isAdmin = req.user?.role === 'admin';
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Double check admin status from DB to ensure reliability even with stale tokens
  if (!isAdmin) {
    try {
      const [users] = await pool.query<RowDataPacket[]>('SELECT is_admin FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].is_admin === 1) {
        isAdmin = true;
      }
    } catch (e) {
      console.error('Failed to check admin status', e);
    }
  }

  console.log('getUserOrders request:', { userId, isAdmin, query: req.query }); // Debug log

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM menu_orders';
    const params: any[] = [];

    if (!isAdmin) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    } else {
      query += ' WHERE 1=1';
    }

    if (status && status !== 'all' && status !== 'undefined') {
      if (status === 'pending') {
        query += ' AND status IN ("pending", "processing")';
      } else if (status === 'completed') {
        query += ' AND status IN ("completed", "cancelled")'; // Include cancelled in completed tab history
      } else {
        query += ' AND status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    console.log('Executing query:', query, params); // Debug log

    const [orders] = await pool.query<any[]>(query, params);
    console.log(`Found ${orders.length} orders`); // Debug log

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await pool.query<any[]>('SELECT * FROM menu_order_items WHERE order_id = ?', [order.id]);
      order.items = items;
      
      // Fetch user nickname
      const [user] = await pool.query<any[]>('SELECT nickname FROM users WHERE id = ?', [order.user_id]);
      if (user.length > 0) {
        order.user_nickname = user[0].nickname;
      }
    }

    res.json({ list: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  let isAdmin = req.user?.role === 'admin';
  const orderId = req.body.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Double check admin status
  if (!isAdmin) {
    try {
      const [users] = await pool.query<RowDataPacket[]>('SELECT is_admin FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].is_admin === 1) {
        isAdmin = true;
      }
    } catch (e) {
      console.error('Failed to check admin status', e);
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check order ownership and status
    let checkQuery = 'SELECT * FROM menu_orders WHERE id = ?';
    const checkParams: any[] = [orderId];
    
    if (!isAdmin) {
      checkQuery += ' AND user_id = ?';
      checkParams.push(userId);
    }
    checkQuery += ' FOR UPDATE';

    const [orders] = await conn.query<RowDataPacket[]>(checkQuery, checkParams);
    if (orders.length === 0) {
      throw new Error('Order not found');
    }
    const order = orders[0];
    
    // Admin can cancel any status (or restricted? let's assume loose for now, or keep restriction)
    // Keep pending restriction for now unless user asked otherwise. User said "修改订单状态（...取消订单）", implying admin can cancel.
    // If it's already completed/cancelled, shouldn't cancel again.
    if (['completed', 'cancelled'].includes(order.status)) {
       throw new Error('Cannot cancel finished order');
    }

    // Update status
    await conn.query('UPDATE menu_orders SET status = "cancelled" WHERE id = ?', [orderId]);

    // Refund points to the ORDER OWNER
    await conn.query('UPDATE users SET family_points = family_points + ? WHERE id = ?', [order.total_points, order.user_id]);

    await conn.commit();
    res.json({ success: true });
  } catch (error: any) {
    await conn.rollback();
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to cancel order' });
  } finally {
    conn.release();
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  let isAdmin = req.user?.role === 'admin';
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Double check admin status
  if (!isAdmin) {
    try {
      const [users] = await pool.query<RowDataPacket[]>('SELECT is_admin FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].is_admin === 1) {
        isAdmin = true;
      }
    } catch (e) {
      console.error('Failed to check admin status', e);
    }
  }
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { id, status } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
     return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // If cancelling, use cancelOrder logic? No, this is simple status update. 
    // BUT if admin sets to cancelled via this API, points won't be refunded.
    // Frontend should use cancelOrder for cancellation, and this API for forward progress.
    // Let's enforce that here or handle it.
    if (status === 'cancelled') {
        // Redirect to cancel logic is hard inside here without refactoring.
        // For now, let's assume frontend calls cancelOrder for cancellation.
        // Or we can just block 'cancelled' here.
        return res.status(400).json({ error: 'Use cancel endpoint for cancellation' });
    }

    await pool.query('UPDATE menu_orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const getUserAddresses = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [addresses] = await pool.query<UserAddress[]>(
      'SELECT * FROM menu_user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

export const addUserAddress = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, phone, address, is_default } = req.body;

  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (is_default) {
      // If setting as default, unset previous default
      await conn.query('UPDATE menu_user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO menu_user_addresses (user_id, name, phone, address, is_default) VALUES (?, ?, ?, ?, ?)',
      [userId, name, phone, address, is_default ? 1 : 0]
    );

    await conn.commit();
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to add address' });
  } finally {
    conn.release();
  }
};

export const getItemDetails = async (req: Request, res: Response) => {
  const itemId = req.params.id;
  try {
    const [rows] = await pool.query<ItemDetail[]>('SELECT * FROM menu_item_details WHERE item_id = ?', [itemId]);
    if (rows.length === 0) {
      return res.json(null);
    }
    const detail = rows[0];
    // Parse JSON if needed (though mysql2 usually handles JSON columns automatically)
    if (typeof detail.ingredients === 'string') {
      try {
        detail.ingredients = JSON.parse(detail.ingredients);
      } catch (e) {
        console.error('Failed to parse ingredients JSON', e);
        detail.ingredients = [];
      }
    }
    res.json(detail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch item details' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const { name, sort, parent_id } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO menu_categories (name, sort, parent_id) VALUES (?, ?, ?)',
      [name, sort || 0, parent_id || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const id = req.params.id;
  const { name, sort, parent_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    await pool.query(
      'UPDATE menu_categories SET name = ?, sort = ?, parent_id = ? WHERE id = ?',
      [name, sort || 0, parent_id || null, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const id = req.params.id;

  try {
    // Check if category has items
    const [items] = await pool.query<RowDataPacket[]>('SELECT id FROM menu_items WHERE category_id = ? LIMIT 1', [id]);
    if (items.length > 0) {
      return res.status(400).json({ error: '该分类下包含菜品，请先转移或删除菜品' });
    }
    
    // Check if category has children
    const [children] = await pool.query<RowDataPacket[]>('SELECT id FROM menu_categories WHERE parent_id = ? LIMIT 1', [id]);
    if (children.length > 0) {
      return res.status(400).json({ error: '该分类下包含子分类，请先删除或移动子分类' });
    }

    await pool.query('DELETE FROM menu_categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

export const getMenu = async (req: Request, res: Response) => {
  try {
    // Fetch categories
    const [categories] = await pool.query<Category[]>('SELECT * FROM menu_categories ORDER BY sort ASC');
    
    // Fetch items
    const [items] = await pool.query<MenuItem[]>('SELECT * FROM menu_items WHERE status = 1');

    // Fetch specs
    const [specs] = await pool.query<ItemSpec[]>('SELECT * FROM menu_item_specs');

    // Assemble
    const menu = categories.filter(c => !c.parent_id).map(cat => {
      // Find sub-categories
      const subCats = categories.filter(c => c.parent_id === cat.id);
      
      // Get items for this category AND its sub-categories
      const catIds = [cat.id, ...subCats.map(sc => sc.id)];
      const catItems = items.filter(item => catIds.includes(item.category_id)).map(item => {
        const itemSpecs = specs.filter(spec => spec.item_id === item.id).map(s => ({
          name: s.spec_name,
          options: typeof s.spec_options === 'string' ? JSON.parse(s.spec_options) : s.spec_options,
          is_multiple: s.is_multiple
        }));
        return { ...item, specs: itemSpecs };
      });
      return { ...cat, items: catItems, children: subCats };
    });

    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { items, order_type, scheduled_time, address, remark } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Calculate total points
    let totalPoints = 0;
    for (const item of items) {
       totalPoints += item.price_points * item.quantity;
    }

    // Check user points
    const [users] = await conn.query<RowDataPacket[]>('SELECT family_points FROM users WHERE id = ? FOR UPDATE', [userId]);
    if (users.length === 0) throw new Error('User not found');
    const userPoints = users[0].family_points;

    if (userPoints < totalPoints) {
      throw new Error(`亲情分不足 (当前: ${userPoints}, 需要: ${totalPoints})`);
    }

    // Deduct points
    await conn.query('UPDATE users SET family_points = family_points - ? WHERE id = ?', [totalPoints, userId]);

    // Create Order
    // Note: scheduled_time column in DB is datetime, but frontend might send string like '立即送出'
    // We should handle this. If it's not a valid date string, we might need to store it in remark or change DB column type.
    // For now, let's assume if it's not a date, we set current time and append to remark.
    
    let finalScheduledTime = scheduled_time;
    let finalRemark = remark;

    const dateCheck = new Date(scheduled_time);
    if (isNaN(dateCheck.getTime())) {
       finalScheduledTime = new Date(); // Default to now
       finalRemark = `${remark ? remark + ' | ' : ''}期望时间: ${scheduled_time}`;
    }

    const [orderResult] = await conn.query<ResultSetHeader>(
      'INSERT INTO menu_orders (user_id, total_points, order_type, scheduled_time, address, remark) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, totalPoints, order_type, finalScheduledTime, address, finalRemark]
    );
    const orderId = orderResult.insertId;

    // Create Order Items
    if (items.length > 0) {
      const orderItemsData = items.map((item: any) => [
        orderId,
        item.itemId,
        item.name,
        JSON.stringify(item.selectedSpecs),
        item.quantity,
        item.price_points
      ]);
      
      await conn.query(
        'INSERT INTO menu_order_items (order_id, item_id, item_name, specs, quantity, price_points) VALUES ?',
        [orderItemsData]
      );
    }

    await conn.commit();
    res.json({ success: true, orderId });
  } catch (error: any) {
    await conn.rollback();
    console.error(error);
    res.status(400).json({ error: error.message || 'Order failed' });
  } finally {
    conn.release();
  }
};
