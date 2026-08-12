export interface FolderItem {
  id: string;
  name: string;
  type: "tab" | "folder" | "split";
  icon?: string;
  children?: FolderItem[];
  url?: string | null;
}

export interface SharedFolder {
  title: string;
  owner: string;
  shareType?: "folder" | "space";
  emoji?: string;
  folders: FolderItem[];
  openTabs?: FolderItem[];
}
