import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMenuDto {
  @IsNotEmpty()
  @IsString()
  public id?: string; //菜单id

  @IsNotEmpty()
  @IsString()
  public title: string; //菜单名称

  @IsNotEmpty()
  @IsString()
  public code: string; //菜单编码

  @IsNotEmpty()
  @IsString()
  public type: string; //菜单类型

  @IsOptional()
  @IsString()
  public path: string; //菜单路径

  @IsOptional()
  @IsString()
  public description: string; //菜单描述

  @IsOptional()
  @IsString()
  public remark: string; //菜单备注

  @IsOptional()
  @IsString()
  public sortOrder: number; //菜单排序

  @IsOptional()
  @IsString()
  public parentId?: string; // 父节点ID，用于构建层级关系
}
