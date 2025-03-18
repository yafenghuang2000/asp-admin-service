import { Module } from '@nestjs/common';
import MenuService from '@/service/menuService';
import { MenuController } from '@/controller/menu.controller';

@Module({
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
