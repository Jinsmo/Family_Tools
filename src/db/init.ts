import { pool } from './mysql';

export async function initDB() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
      \`username\` VARCHAR(64) NOT NULL COMMENT '用户名（登录使用）',
      \`nickname\` VARCHAR(64) NOT NULL COMMENT '用户昵称（可自行修改）',
      \`password\` VARCHAR(255) NOT NULL COMMENT '用户密码（无需复杂加密）',
      \`phone\` VARCHAR(20) NOT NULL COMMENT '用户手机号',
      \`is_admin\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否是管理员（0否，1是）',
      \`family_role\` VARCHAR(32) NOT NULL COMMENT '用户家庭身份（老公、妻子等）',
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      \`remark\` VARCHAR(255) NULL COMMENT '备注',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_users_username\` (\`username\`),
      UNIQUE KEY \`uk_users_phone\` (\`phone\`),
      KEY \`idx_users_is_admin\` (\`is_admin\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
  `;

  try {
    await pool.query(createTableSQL);
    
    // Check for new columns and add them if missing
    const [columns]: any = await pool.query(`SHOW COLUMNS FROM users LIKE 'family_points'`);
    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN \`family_points\` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '亲情分',
        ADD COLUMN \`check_in_days\` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '连续签到天数',
        ADD COLUMN \`last_check_in_at\` timestamp NULL DEFAULT NULL COMMENT '最后签到时间'
      `);
      console.log('Database migrated: added family_points columns.');
    }

    console.log('Database initialized: users table checked/created.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
