import type { FolderItem, SharedFolder } from "~/api/models/folder";
import type { ArcFolder, ArcItem } from "~/external/models/arc";

/**
 * Transforms an ArcFolder to SharedFolder format for the UI.
 */
export function transformArcToSharedFolder(arcFolder: ArcFolder): SharedFolder {
  const { data, author } = arcFolder;
  const { items, root, rootID } = data;

  // Create a lookup map for items by ID
  const itemsMap = new Map<string, ArcItem>();
  items.forEach((item) => itemsMap.set(item.id, item));

  // Determine root items
  const rootItems: string[] = [];
  if (Array.isArray(root)) {
    rootItems.push(...root);
  } else if (root) {
    rootItems.push(root);
  } else if (rootID) {
    rootItems.push(rootID);
  }

  // Transform root items to FolderItems
  const folders: FolderItem[] = rootItems
    .map((id) => transformArcItemToFolderItem(id, itemsMap))
    .filter((item): item is FolderItem => item !== null);

  // Extract title from the first root item or use a default
  const title =
    (rootItems.length > 0 && itemsMap.get(rootItems[0])?.title) ||
    "Archived Folder";

  return {
    title,
    owner: author,
    folders,
  };
}

/**
 * Recursively transforms an ArcItem to FolderItem.
 */
function transformArcItemToFolderItem(
  itemId: string,
  itemsMap: Map<string, ArcItem>,
): FolderItem | null {
  debugger;
  const item = itemsMap.get(itemId);
  if (!item) return null;

  const isTab = "tab" in item.data;
  const isFolder = "list" in item.data;

  // Skip split views for now
  if (!isTab && !isFolder) return null;

  const folderItem: FolderItem = {
    id: item.id,
    name: item.data.savedTitle || (isTab ? "Untitled Tab" : "Untitled Folder"),
    type: isTab ? "tab" : "folder",
  };

  // If it's a folder with children, recursively transform them
  if (isFolder && item.childrenIds.length > 0) {
    folderItem.children = item.childrenIds
      .map((childId) => transformArcItemToFolderItem(childId, itemsMap))
      .filter((child): child is FolderItem => child !== null);
  }

  return folderItem;
}
