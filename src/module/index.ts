import { Module } from '@nestjs/common';
import { TypeOrmConfigModule, GlobalEntitiesModule, GlobalConfigModule } from './db.config.module';
import { JwtGlobalModule } from './jwt.config.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    TypeOrmConfigModule,
    GlobalEntitiesModule,
    GlobalConfigModule,
    JwtGlobalModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
