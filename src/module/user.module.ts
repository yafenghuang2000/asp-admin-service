import { Module } from '@nestjs/common';
import PasswordManager from '@/utils/PasswordService';
import { UserController } from '@/controller/user.controller';
import { UserService } from '@/service/userService';

@Module({
  imports: [PasswordManager],
  controllers: [UserController],
  providers: [UserService, PasswordManager],
  exports: [UserService],
})
export class UserModule {}
