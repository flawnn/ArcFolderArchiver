import type { FolderItem, SharedFolder } from "~/api/models/folder";
import type { ArcFolder, ArcItem } from "~/external/models/arc";

export function transformArcToSharedFolder(arcFolder: ArcFolder): {
  shared: SharedFolder;
  shareUrl: string;
} {
  const { data, author, shareID } = arcFolder;
  const { items, root, rootID } = data;

  const itemsMap = new Map<string, ArcItem>();
  items.forEach((item) => itemsMap.set(item.id, item));

  const rootItems: string[] = [];
  if (Array.isArray(root)) {
    rootItems.push(...root);
  } else if (root) {
    rootItems.push(root);
  } else if (rootID) {
    rootItems.push(rootID);
  }

  const folders: FolderItem[] = rootItems
    .map((id) => transformArcItemToFolderItem(id, itemsMap))
    .filter((item): item is FolderItem => item !== null);

  const title =
    (rootItems.length > 0 &&
      (itemsMap.get(rootItems[0])?.data as any)?.savedTitle) ||
    itemsMap.get(rootItems[0])?.title ||
    "Archived Folder";

  const shared: SharedFolder = {
    title,
    owner: author,
    folders,
  };

  const shareUrl = `https://arc.net/folder/${shareID}`;
  return { shared, shareUrl };
}

function transformArcItemToFolderItem(
  itemId: string,
  itemsMap: Map<string, ArcItem>,
): FolderItem | null {
  const item = itemsMap.get(itemId);
  if (!item) return null;

  const isTab = "tab" in item.data;
  const isFolder = "list" in item.data;
  if (!isTab && !isFolder) return null;

  const url = isTab
    ? ((item.data as any).tab?.savedURL ?? undefined)
    : undefined;
  const name =
    (isTab ? (item.data as any).tab?.savedTitle : item.title) ||
    (isTab ? "Untitled Tab" : "Untitled Folder");

  const folderItem: FolderItem = {
    id: item.id,
    name,
    type: isTab ? "tab" : "folder",
    url,
  };

  if (isFolder && item.childrenIds.length > 0) {
    folderItem.children = item.childrenIds
      .map((childId) => transformArcItemToFolderItem(childId, itemsMap))
      .filter((child): child is FolderItem => child !== null);
  }

  return folderItem;
}
