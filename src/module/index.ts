import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
import { TypeOrmConfigModule, GlobalEntitiesModule } from './db.config.module';
// import { UserModule } from './user.module';

// const envFilePath = `.env.${process.env.NODE_ENV || 'development'}`;
@Module({
  imports: [
    TypeOrmConfigModule,
    GlobalEntitiesModule,
    // UserModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
