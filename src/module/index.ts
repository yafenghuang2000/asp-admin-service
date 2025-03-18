import { Module } from '@nestjs/common';
import { TypeOrmConfigModule, GlobalEntitiesModule } from './db.config.module';
import { JwtGlobalModule } from './jwt.config.module';
import { UserModule } from './user.module';

@Module({
  imports: [TypeOrmConfigModule, GlobalEntitiesModule, JwtGlobalModule, UserModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
