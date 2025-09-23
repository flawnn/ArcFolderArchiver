export interface FolderItem {
  id: string;
  name: string;
  type: "tab" | "folder";
  icon?: string;
  children?: FolderItem[];
  url?: string;
}

export interface SharedFolder {
  title: string;
  owner: string;
  folders: FolderItem[];
}
