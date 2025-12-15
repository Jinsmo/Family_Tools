import { pool } from '../db/mysql';

async function run() {
  try {
    await pool.query(`
      ALTER TABLE \`users\` 
      MODIFY COLUMN \`avatar\` LONGTEXT DEFAULT NULL COMMENT '用户头像(Base64)';
    `);
    console.log('Column avatar added to users table successfully');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
