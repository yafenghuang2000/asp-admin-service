import type { Repository } from 'typeorm';
import type { MenuClosureEntity, MenuEntity } from '@/entity/menu.entity';

class MenuModulePrivateMethods {
  constructor(
    private readonly menuRepository: Repository<MenuEntity>, // 通过构造函数接收 MenuEntity
  ) {}

  /**
   * 构建菜单树形结构
   * @param menus 菜单列表
   * @param closures 菜单闭包关系列表
   * @returns 树形结构的菜单列表
   */
  public buildTree(menus: MenuEntity[], closures: MenuClosureEntity[]): MenuEntity[] {
    // 如果没有菜单项，直接返回空数组
    if (!menus.length) {
      return [];
    }

    // 创建菜单映射，用于快速查找
    const menuMap = new Map<string, MenuEntity>();
    const roots: MenuEntity[] = [];

    // 初始化菜单项，确保每个菜单都有 children 数组
    menus.forEach((menu) => {
      menu.children = [];
      menuMap.set(menu.id, menu);
    });

    // 创建深度为1的父子关系映射（直接父子关系）
    const directParentMap = new Map<string, string>();
    closures.forEach((closure) => {
      if (closure.depth === 1) {
        directParentMap.set(closure.descendant, closure.ancestor);
      }
    });

    // 构建树形结构
    menus.forEach((menu) => {
      const parentId = directParentMap.get(menu.id);
      const parent = parentId ? menuMap.get(parentId) : null;

      if (!parent) {
        // 如果没有父节点，则为根节点
        roots.push(menu);
      } else {
        // 如果有父节点，添加到父节点的 children 中
        parent.children.push(menu);
      }
    });

    // 递归排序所有层级的菜单
    const sortMenus = (menuList: MenuEntity[]): MenuEntity[] => {
      return menuList
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((menu) => {
          if (menu.children.length > 0) {
            menu.children = sortMenus(menu.children);
          }
          return menu;
        });
    };

    // 对根节点进行排序
    return sortMenus(roots);
  }

  /**
   * 打印菜单树形结构
   * @param menus 菜单列表
   * @param level 当前层级
   */
  public printMenuTree(menus: MenuEntity[], level: number = 0): void {
    menus.forEach((menu) => {
      const indent = '  '.repeat(level);
      console.log(`${indent}├─ ${menu.title} (${menu.key})`);
      if (menu.children && menu.children.length > 0) {
        this.printMenuTree(menu.children, level + 1);
      }
    });
  }
}

export default MenuModulePrivateMethods;
