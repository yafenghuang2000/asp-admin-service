import { Module } from '@nestjs/common';
import { UserController } from '@/controller/user.controller';
import { UserService } from '@/service/userService';
import { PasswordService } from '@/utils/PasswordService';
@Module({
  controllers: [UserController],
  providers: [UserService, PasswordService],
  exports: [UserService],
})
export class AppModule {}
