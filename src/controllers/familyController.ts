import { Request, Response } from 'express';
import { pool } from '../db/mysql';
import { AuthRequest } from '../middleware/authMiddleware';

// 基础关系定义
type RelationType = 'father' | 'mother' | 'spouse' | 'child';
type Gender = 'male' | 'female' | 'unknown';

interface UserNode {
  id: number;
  gender: Gender;
}

interface Edge {
  to: number;
  type: RelationType;
}

export const familyController = {
  // 获取家人列表
  async getFamilyList(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        return res.status(401).json({ error: '未授权' });
      }

      // 1. 获取所有用户 (为了构建图和返回列表)
      const [users]: any = await pool.query(
        'SELECT id, username, nickname, gender, family_role, phone FROM users'
      );

      // 2. 获取所有关系 (包括 family_relations 和 user_custom_calls)
      const [relations]: any = await pool.query(
        'SELECT user_id, related_user_id, relation_type, custom_call FROM family_relations'
      );
      
      const [customCalls]: any = await pool.query(
        'SELECT user_id, related_user_id, custom_call FROM user_custom_calls'
      );

      // 3. 构建图 (双向)
      const graph = new Map<number, Edge[]>();
      const userMap = new Map<number, UserNode>();
      // 存储自定义称呼 map: "userId-relatedUserId" -> customCall
      const customCallMap = new Map<string, string>();

      users.forEach((u: any) => {
        userMap.set(u.id, { id: u.id, gender: u.gender });
        graph.set(u.id, []);
      });
      
      // 加载 user_custom_calls
      customCalls.forEach((c: any) => {
        customCallMap.set(`${c.user_id}-${c.related_user_id}`, c.custom_call);
      });

      relations.forEach((r: any) => {
        const u1 = r.user_id;
        const u2 = r.related_user_id;
        const type = r.relation_type as RelationType;
        
        // 优先使用 user_custom_calls，如果没有则使用 family_relations 中的 (虽然现在 family_relations 的 custom_call 逐渐废弃，但为了兼容)
        if (!customCallMap.has(`${u1}-${u2}`) && r.custom_call) {
            customCallMap.set(`${u1}-${u2}`, r.custom_call);
        }
        
        // 正向
        graph.get(u1)?.push({ to: u2, type: type });
        
        // 反向
        let revType: RelationType = 'child'; // default placeholder
        if (type === 'spouse') revType = 'spouse';
        else if (type === 'father' || type === 'mother') revType = 'child';
        else if (type === 'child') {
           const u1Node = userMap.get(u1);
           revType = (u1Node?.gender === 'female') ? 'mother' : 'father';
        }
        
        graph.get(u2)?.push({ to: u1, type: revType });
      });

      // 4. 对每个用户计算称呼
      const currentUserNode = userMap.get(currentUserId);
      const myGender = currentUserNode?.gender || 'unknown';

      const result = users.map((u: any) => {
        // 排除自己
        if (u.id === currentUserId) return { ...u, display_call: '我' };

        // 优先检查是否有直接的自定义称呼
        const directCustomCall = customCallMap.get(`${currentUserId}-${u.id}`);
        if (directCustomCall) {
            return { ...u, display_call: directCustomCall };
        }

        // BFS 寻找最短路径
        const path = findShortestPath(graph, currentUserId, u.id);
        const calculated = calculateCall(path, myGender, u.gender);
        const display_call = calculated || '未设置';

        return {
          ...u,
          display_call
        };
      });

      res.json(result);
    } catch (error) {
      console.error('Get family list error:', error);
      res.status(500).json({ error: '获取家人列表失败' });
    }
  },

  // 更新自定义称呼
  async updateCustomCall(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user?.id;
      const { relatedUserId, customCall } = req.body;

      if (!currentUserId || !relatedUserId) {
        return res.status(400).json({ error: '参数错误' });
      }

      // 使用新的 user_custom_calls 表存储称呼，无论是否有亲属关系
      // 使用 ON DUPLICATE KEY UPDATE 语法 (Upsert)
      await pool.query(
        `INSERT INTO user_custom_calls (user_id, related_user_id, custom_call) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE custom_call = VALUES(custom_call)`,
        [currentUserId, relatedUserId, customCall]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Update custom call error:', error);
      res.status(500).json({ error: '更新称呼失败' });
    }
  },

  // 搜索用户（用于添加家人）
  async searchUser(req: AuthRequest, res: Response) {
    try {
      const { keyword } = req.query;
      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: '请输入搜索关键字' });
      }

      // 根据手机号或用户名搜索
      const [users]: any = await pool.query(
        'SELECT id, username, nickname, phone, gender FROM users WHERE phone LIKE ? OR username LIKE ? LIMIT 10',
        [`%${keyword}%`, `%${keyword}%`]
      );

      res.json(users);
    } catch (error) {
      console.error('Search user error:', error);
      res.status(500).json({ error: '搜索用户失败' });
    }
  },

  // 添加家庭关系
  async addRelation(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user?.id;
      const { relatedUserId, relationType } = req.body;

      if (!currentUserId || !relatedUserId || !relationType) {
        return res.status(400).json({ error: '参数不完整' });
      }

      if (currentUserId === relatedUserId) {
        return res.status(400).json({ error: '不能添加自己为家人' });
      }

      // 验证关系类型
      const validTypes = ['father', 'mother', 'spouse', 'child'];
      if (!validTypes.includes(relationType)) {
        return res.status(400).json({ error: '不支持的关系类型' });
      }

      // 检查是否已存在关系
      const [existing]: any = await pool.query(
        'SELECT id FROM family_relations WHERE user_id = ? AND related_user_id = ?',
        [currentUserId, relatedUserId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: '该家人已存在，请勿重复添加' });
      }

      // 插入关系
      await pool.query(
        'INSERT INTO family_relations (user_id, related_user_id, relation_type) VALUES (?, ?, ?)',
        [currentUserId, relatedUserId, relationType]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Add relation error:', error);
      res.status(500).json({ error: '添加家人失败' });
    }
  }
};

// BFS 寻找路径
function findShortestPath(graph: Map<number, Edge[]>, start: number, end: number): RelationType[] | null {
  const queue: { node: number; path: RelationType[] }[] = [{ node: start, path: [] }];
  const visited = new Set<number>([start]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    if (node === end) return path;

    if (path.length >= 3) continue; // 限制深度，防止太远

    const edges = graph.get(node) || [];
    for (const edge of edges) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({ node: edge.to, path: [...path, edge.type] });
      }
    }
  }
  return null;
}

// 称呼计算引擎
function calculateCall(path: RelationType[] | null, myGender: Gender, targetGender: Gender): string | null {
  if (!path || path.length === 0) return null;

  const p = path.join('-');

  // 1. 直接关系
  if (p === 'spouse') return targetGender === 'male' ? '老公' : '老婆';
  if (p === 'father') return '爸爸';
  if (p === 'mother') return '妈妈';
  if (p === 'child') return targetGender === 'male' ? '儿子' : '女儿';

  // 2. 二级关系
  // 配偶的父母
  if (p === 'spouse-father') return myGender === 'female' ? '公公' : '岳父';
  if (p === 'spouse-mother') return myGender === 'female' ? '婆婆' : '岳母';
  
  // 父母的父母
  if (p === 'father-father') return '爷爷';
  if (p === 'father-mother') return '奶奶';
  if (p === 'mother-father') return '外公';
  if (p === 'mother-mother') return '外婆';

  // 孩子的配偶
  if (p === 'child-spouse') return targetGender === 'male' ? '女婿' : '儿媳';

  // 兄弟姐妹 (父母的孩子)
  // 注意：BFS可能会找到 "我 -> 爸爸 -> 孩子(target)"
  if (p === 'father-child' || p === 'mother-child') {
     if (targetGender === 'male') return '兄弟'; // 简略
     return '姐妹';
  }

  return null;
}
