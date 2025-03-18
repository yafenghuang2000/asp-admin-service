import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuClosureEntity, MenuEntity } from '@/entity/menu.entity';
import { CreateMenuDto } from '@/dto/menu.dto';

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

  //查询全部菜单
  public async findAll(): Promise<MenuEntity[]> {
    // 查询所有菜单项
    const menus = await this.menuRepository.find();
    // 查询所有层级关系
    const closures = await this.menuClosureRepository.find();
    // 构建树形结构
    return this.MenuModulePrivateMethods['buildTree'](menus, closures);
  }

  public async createMenu(createMenuDto: CreateMenuDto): Promise<string> {
    const { title, code, path, parentId, description, remark, type } = createMenuDto;

    if (!title) {
      throw new ConflictException('节点名称不能为空');
    }

    // 使用事务处理
    return await this.menuRepository.manager.transaction(async (transactionalEntityManager) => {
      // 合并检查菜单节点，菜单名称和菜单的路径是否唯一
      const existingMenu = await transactionalEntityManager.findOne(MenuEntity, {
        where: [{ title }, { path }],
      });

      if (existingMenu && existingMenu.path === path) {
        throw new ConflictException('菜单路径已存在，无法重复添加');
      }

      if (existingMenu && existingMenu.title === title) {
        throw new ConflictException('菜单名称已存在，无法重复添加');
      }

      // 查询当前最大 sortOrder
      const maxSortOrder = await transactionalEntityManager
        .createQueryBuilder(MenuEntity, 'menu')
        .select('MAX(menu.sortOrder)', 'maxSortOrder')
        .getRawOne();

      const nextSortOrder = (maxSortOrder?.maxSortOrder || 0) + 1;

      // 1. 插入菜单项
      const menu = new MenuEntity();
      menu.title = title;
      menu.path = path;
      menu.sortOrder = nextSortOrder;
      menu.code = code;
      menu.description = description;
      menu.remark = remark;
      menu.type = type;

      // 生成 key
      if (!parentId) {
        const maxKey = await transactionalEntityManager
          .createQueryBuilder(MenuEntity, 'menu')
          .select('MAX(menu.key)', 'maxKey')
          .getRawOne();
        menu.key = (maxKey?.maxKey ? parseInt(maxKey.maxKey as string, 10) + 1 : 1).toString();
      } else {
        // 二级及以下菜单：key 为 父级key-1, 父级key-2...
        const parentMenu = await transactionalEntityManager.findOne(MenuEntity, {
          where: { id: parentId },
        });
        if (!parentMenu) {
          throw new ConflictException('父节点不存在');
        }

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
      }

      await transactionalEntityManager.save(menu);

      // 2. 插入层级关系
      if (parentId) {
        // 确保父节点存在
        const parentMenu = await transactionalEntityManager.findOne(MenuEntity, {
          where: { id: parentId },
        });
        if (!parentMenu) {
          throw new ConflictException('父节点不存在');
        }

        const parentClosures = await transactionalEntityManager.find(MenuClosureEntity, {
          where: { descendant: parentId },
        });

        for (const closure of parentClosures) {
          const existingClosure = await transactionalEntityManager.findOne(MenuClosureEntity, {
            where: {
              ancestor: closure.ancestor,
              descendant: menu.id,
              depth: closure.depth + 1,
            },
          });

          if (!existingClosure) {
            const newClosure = new MenuClosureEntity();
            newClosure.ancestor = closure.ancestor;
            newClosure.descendant = menu.id;
            newClosure.depth = closure.depth + 1;
            await transactionalEntityManager.save(newClosure);
          }
        }
      } else {
        // 如果没有传入 parentId父节点，则创建一级目录
        const rootClosure = new MenuClosureEntity();
        rootClosure.ancestor = menu.id;
        rootClosure.descendant = menu.id;
        rootClosure.depth = 0;
        await transactionalEntityManager.save(rootClosure);
      }

      return '菜单项新增成功';
    });
  }
}

/**
 * 菜单模块接口私有方法
 */
export class MenuModulePrivateMethods {
  constructor(
    private readonly menuRepository: Repository<MenuEntity>, // 通过构造函数接收 MenuEntity
  ) {}
  private buildTree(menus: MenuEntity[], closures: MenuClosureEntity[]): MenuEntity[] {
    const menuMap = new Map<string, MenuEntity>();
    const roots: MenuEntity[] = [];

    // 将所有菜单项存入 Map
    menus.forEach((menu) => {
      if (!menu.children) {
        menu.children = []; // 初始化子菜单数组，避免覆盖已有数据
      }
      menuMap.set(menu.id, menu);
    });

    // 构建树形结构
    closures.forEach((closure) => {
      const parent = menuMap.get(closure.ancestor);
      const child = menuMap.get(closure.descendant);

      if (parent && child) {
        // 如果深度为 0 且 ancestor === descendant，表示是根节点
        if (closure.depth === 0 && closure.ancestor === closure.descendant) {
          if (!roots.includes(parent)) {
            roots.push(parent);
          }
        } else if (closure.depth > 0) {
          // 处理多层级关系
          if (!parent.children.includes(child)) {
            parent.children.push(child);
          }
        }
      }
    });

    return roots;
  }
}
