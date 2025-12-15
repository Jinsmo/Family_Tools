import { pool } from '../db/mysql';

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`user_custom_calls\` (
        \`id\` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint(20) UNSIGNED NOT NULL COMMENT '用户ID',
        \`related_user_id\` bigint(20) UNSIGNED NOT NULL COMMENT '关联用户ID',
        \`custom_call\` varchar(32) NOT NULL COMMENT '自定义称呼',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_related\` (\`user_id\`,\`related_user_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户自定义称呼表';
    `);
    console.log('Table user_custom_calls created successfully');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
