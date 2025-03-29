import Redis from 'ioredis';

class RedisCache {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
    });

    this.client.on('connect', () => {
      const host = this.client.options.host ?? 'unknown';
      const port = this.client.options.port ?? 0;
      console.log(`Redis 连接成功:${host}:${port}`);
    });

    this.client.on('error', (err) => {
      const host = this.client.options.host ?? 'unknown';
      const port = this.client.options.port ?? 0;
      console.log(`Redis 连接失败:${host}:${port}`, err);
    });
  }

  //设置缓存
  // public async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
  //   try {
  //     if (ttl) {
  //       await this.client.set(key, JSON.stringify(value), 'EX', ttl);
  //     } else {
  //       await this.client.set(key, JSON.stringify(value));
  //     }
  //     return true; // 返回 true 表示缓存成功
  //   } catch (error) {
  //     console.error('Failed to set value in Redis:', error);
  //     return false; // 返回 false 表示缓存失败
  //   }
  // }

  public async set(
    key: string,
    value: string | number | boolean | object | null,
    ttl: number = 3600,
  ): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const result = ttl
        ? await this.client.set(key, serializedValue, 'EX', ttl)
        : await this.client.set(key, serializedValue);
      return result === 'OK';
    } catch (error) {
      console.error('Failed to set value in Redis:', error);
      throw new Error(`Failed to set value in Redis: ${error.message}`);
    }
  }

  //获取缓存
  public async get<TData>(key: string): Promise<TData | null> {
    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value) as TData;
      }
      return null;
    } catch (error) {
      console.error('Failed to get value from Redis:', error);
      return null;
    }
  }

  //检查缓存是否存在
  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1; // 返回 true 表示键存在
    } catch (error) {
      console.error('Failed to check if key exists in Redis:', error);
      return false; // 返回 false 表示检查失败或键不存在
    }
  }

  //更新缓存过期时间
  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.client.expire(key, ttl);
      return true; // 返回 true 表示更新过期时间成功
    } catch (error) {
      console.error('Failed to update expiration time in Redis:', error);
      return false; // 返回 false 表示更新过期时间失败
    }
  }

  //删除缓存
  public async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true; // 返回 true 表示删除成功
    } catch (error) {
      console.error('Failed to delete value from Redis:', error);
      return false; // 返回 false 表示删除失败
    }
  }

  //清除所有缓存
  public async clear(): Promise<boolean> {
    try {
      await this.client.flushall();
      return true; // 返回 true 表示清除成功
    } catch (error) {
      console.error('Failed to clear Redis:', error);
      return false; // 返回 false 表示清除失败
    }
  }
}

export default new RedisCache();
