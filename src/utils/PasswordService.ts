import * as crypto from 'crypto';

class PasswordManager {
  // 加密密码
  public hashPassword(plainPassword: string): string {
    const salt = this.generateSalt(); // 生成盐值
    const hash = crypto
      .createHash('sha256') // 使用SHA-256算法
      .update(plainPassword + salt) // 将密码和盐值组合
      .digest('hex'); // 生成哈希值
    return `${salt}:${hash}`; // 返回盐值和哈希值的组合
  }

  // 验证密码
  public comparePassword(plainPassword: string, hashedPassword: string): boolean {
    const [salt, originalHash] = hashedPassword.split(':'); // 分离盐值和哈希值
    const hash = crypto
      .createHash('sha256')
      .update(plainPassword + salt) // 使用相同的盐值重新计算哈希值
      .digest('hex');
    return hash === originalHash; // 比较哈希值是否一致
  }

  // 生成随机的盐值
  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex'); // 生成16字节的随机盐值
  }
}

export default PasswordManager;
