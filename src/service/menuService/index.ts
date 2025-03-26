import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuClosureEntity, MenuEntity } from '@/entity/menu.entity';
import { CreateMenuDto } from '@/dto/menu.dto';
import MenuModulePrivateMethods from './MenuModulePrivateMethods';

@Injectable()
export default class MenuService {
  private readonly MenuModulePrivateMethods: MenuModulePrivateMethods;
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepository: Repository<MenuEntity>,
    @InjectRepository(MenuClosureEntity)
    private readonly menuClosureRepository: Repository<MenuClosureEntity>,
  ) {
    this.MenuModulePrivateMethods = new MenuModulePrivateMethods(menuRepository);
  }
  /**
   * 查询所有菜单项并构建树形结构
   * @returns {Promise<MenuEntity[]>} 返回一个 Promise，解析后为树形结构的菜单列表。
   */
  public async findAll(): Promise<MenuEntity[]> {
    try {
      // 查询所有菜单项，按 sortOrder 排序
      const menus = await this.menuRepository
        .createQueryBuilder('menu')
        .orderBy('menu.sortOrder', 'ASC')
        .getMany();

      // 如果没有菜单项，直接返回空数组
      if (!menus.length) {
        return [];
      }

      // 查询所有层级关系
      const closures = await this.menuClosureRepository
        .createQueryBuilder('closure')
        .orderBy('closure.depth', 'ASC')
        .getMany();

      // 验证数据完整性
      if (closures.length === 0) {
        throw new BadRequestException('菜单层级关系数据不完整');
      }

      // 验证每个菜单项都有对应的闭包关系
      const menuIds = new Set(menus.map((menu) => menu.id));
      const closureMenuIds = new Set([
        ...closures.map((closure) => closure.ancestor),
        ...closures.map((closure) => closure.descendant),
      ]);

      const missingMenus = [...menuIds].filter((id) => !closureMenuIds.has(id));
      if (missingMenus.length > 0) {
        throw new BadRequestException(`以下菜单项缺少层级关系：${missingMenus.join(', ')}`);
      }
      // 构建树形结构
      const tree = this.MenuModulePrivateMethods.buildTree(menus, closures);
      // console.log('\n菜单树形结构：');
      this.MenuModulePrivateMethods.printMenuTree(tree);

      return tree;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('获取菜单列表失败：' + error.message);
      }
      throw new Error('获取菜单列表失败：未知错误');
    }
  }

  /**
   *新增菜单
   */
  public async createMenu(createMenuDto: CreateMenuDto): Promise<string> {
    const { title, code, path, parentId, description, remark, type, sortOrder } = createMenuDto;

    // 参数验证
    if (!title || !code || !type) {
      throw new ConflictException('菜单名称、编码和类型为必填项');
    }

    // 验证排序号
    if (sortOrder !== undefined && sortOrder < 0) {
      throw new ConflictException('排序号不能为负数');
    }

    try {
      return await this.menuRepository.manager.transaction(async (transactionalEntityManager) => {
        // 检查标题和路径是否重复
        const existingTitle = await transactionalEntityManager.findOne(MenuEntity, {
          where: { title },
        });

        if (existingTitle) {
          throw new ConflictException('菜单名称已存在');
        }

        const existingPath = await transactionalEntityManager.findOne(MenuEntity, {
          where: { path },
        });

        if (existingPath) {
          throw new ConflictException('菜单路径已存在');
        }

        // 创建新菜单
        const menu = new MenuEntity();
        menu.title = title;
        menu.code = code;
        menu.type = type;
        menu.path = path || '';
        menu.sortOrder = sortOrder || 0;
        menu.description = description || '';
        menu.remark = remark || '';

        let parentMenu: MenuEntity | null = null;
        if (parentId) {
          parentMenu = await transactionalEntityManager.findOne(MenuEntity, {
            where: { id: parentId },
          });

          if (!parentMenu) {
            throw new ConflictException('父节点不存在');
          }
        }

        // 生成菜单key
        if (parentId && parentMenu) {
          // 二级及以下菜单：key 为 父级key-1, 父级key-2...
          const maxChildKey = await transactionalEntityManager
            .createQueryBuilder(MenuEntity, 'menu')
            .leftJoin(MenuClosureEntity, 'closure', 'closure.descendant = menu.id')
            .where('closure.ancestor = :parentId AND closure.depth = 1', { parentId })
            .select('MAX(menu.key)', 'maxKey')
            .getRawOne();

          const lastChildKey = (maxChildKey?.maxKey || `${parentMenu.key}-0`) as string;
          const lastChildNumber = parseInt(lastChildKey.split('-').pop() || '0', 10);
          const nextChildNumber = lastChildNumber + 1;
          menu.key = `${parentMenu.key}-${nextChildNumber}`;
        } else {
          // 一级菜单：key 为 1, 2, 3...
          const maxKey = await transactionalEntityManager
            .createQueryBuilder(MenuEntity, 'menu')
            .select('MAX(menu.key)', 'maxKey')
            .getRawOne();
          menu.key = (maxKey?.maxKey ? parseInt(maxKey.maxKey as string, 10) + 1 : 1).toString();
        }

        // 保存菜单
        await transactionalEntityManager.save(menu);

        // 处理闭包关系
        if (parentId && parentMenu) {
          // 获取父节点的所有祖先节点
          const parentClosures = await transactionalEntityManager.find(MenuClosureEntity, {
            where: { descendant: parentId },
          });

          // 批量创建闭包关系
          const newClosures = parentClosures.map((closure) => {
            const newClosure = new MenuClosureEntity();
            newClosure.ancestor = closure.ancestor;
            newClosure.descendant = menu.id;
            newClosure.depth = closure.depth + 1;
            return newClosure;
          });

          // 添加自身到祖先的闭包关系
          const selfClosure = new MenuClosureEntity();
          selfClosure.ancestor = menu.id;
          selfClosure.descendant = menu.id;
          selfClosure.depth = 0;
          newClosures.push(selfClosure);

          // 批量保存闭包关系
          await transactionalEntityManager.save(newClosures);
        } else {
          // 创建根节点的闭包关系
          const rootClosure = new MenuClosureEntity();
          rootClosure.ancestor = menu.id;
          rootClosure.descendant = menu.id;
          rootClosure.depth = 0;
          await transactionalEntityManager.save(rootClosure);
        }

        return '菜单项新增成功';
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('创建菜单失败：' + error.message);
    }
  }
}
