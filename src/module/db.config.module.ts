import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
// import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { UserEntity } from '@/entity/user.entity';

// 根据 NODE_ENV 动态加载环境变量文件
const envFilePath = `.env.${process.env.NODE_ENV || 'development'}`;

console.log('MYSQL_HOST:', process.env.NODE_MYSQL_HOST);
console.log('MYSQL_USERNAME:', process.env.MYSQL_USERNAME);
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD);
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使配置模块全局可用
      envFilePath,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('NODE_MYSQL_HOST', 'localhost'),
        port: configService.get<number>('MYSQL_PORT', 3306),
        username: configService.get<string>('MYSQL_USERNAME', 'root'),
        password: configService.get<string>('MYSQL_PASSWORD', '123456789'),
        database: configService.get<string>('MYSQL_DATABASE', 'my-test'),
        entities: [path.join(__dirname, '../entity/**/*.entity{.ts,.js}')],
        synchronize: true,
        poolSize: 300,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class TypeOrmConfigModule implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService, // 注入 ConfigService
  ) {}

  public async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('NODE_MYSQL_HOST');
    const port = this.configService.get<number>('MYSQL_PORT');
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
        console.log(`MySQL数据库连接成功:${host}:${port}`);
      } else {
        console.log(`MySQL数据库已连接:${host}:${port}`);
      }
    } catch (error) {
      console.error(`MySQL数据库连接失败:${host}:${port}`, error);
    }
  }
}

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  exports: [TypeOrmModule],
})
export class GlobalEntitiesModule {}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('REDIS_HOST', 'localhost'), // 从环境变量获取 Redis 主机，默认值为 'localhost'
        port: configService.get<number>('REDIS_PORT', 6379), // 从环境变量获取 Redis 端口，默认值为 6379
        password: configService.get<string>('REDIS_PASSWORD'), // 从环境变量获取 Redis 密码，默认值为 undefined
      }),
      // useValue: redisClient,
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
