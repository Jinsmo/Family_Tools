import crypto from 'crypto';

// 密钥长度必须是 32 字节 (256位)
const SECRET_KEY = process.env.PASSWORD_SECRET_KEY || 'default_secret_key_must_be_32_bytes!';
// 确保密钥长度为 32
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * 加密
 * @param text 明文
 * @returns 密文 (hex: iv:encrypted)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * 解密
 * @param text 密文 (hex: iv:encrypted)
 * @returns 明文
 */
export function decrypt(text: string): string {
  const textParts = text.split(':');
  if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = Buffer.from(textParts[1], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
