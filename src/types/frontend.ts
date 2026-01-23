
export type SidebarItemType = 'note' | 'folder' | 'canvas' | 'code' | 'diagram';

export interface SidebarItem {
  id: string;
  type: SidebarItemType;
  title: string;
  parentId?: string;
  children?: SidebarItem[];
  collapsed?: boolean;
}

export interface Category {
  id: string;
  title: string;
  type: 'category';
  collapsed: boolean;
  items: SidebarItem[];
  icon: string;
  actions?: {
    newFile?: boolean;
    newFolder?: boolean;
  };
}
