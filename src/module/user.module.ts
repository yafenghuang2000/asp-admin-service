import { Module } from '@nestjs/common';
import { UserController } from '@/controller/user.controller';
import { UserService } from '@/service/userService';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
