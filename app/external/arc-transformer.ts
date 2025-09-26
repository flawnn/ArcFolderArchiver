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
  // Include explicit rootItems if present on the payload
  if (
    Array.isArray((data as any).rootItems) &&
    (data as any).rootItems.length > 0
  ) {
    for (const id of (data as any).rootItems as string[]) {
      if (!rootItems.includes(id)) rootItems.push(id);
    }
  }

  const folders: FolderItem[] = rootItems
    .map((id) => transformArcItemToFolderItem(id, itemsMap))
    .filter((item): item is FolderItem => item !== null);

  const title =
    (rootItems.length > 0 &&
      (itemsMap.get(rootItems[0])?.data as any)?.savedTitle) ||
    itemsMap.get(rootItems[0])?.title ||
    "Archived Folder";

  // Flatten structure if there's only one top-level folder with the same name as the overall folder
  let finalFolders = folders;
  if (
    folders.length === 1 &&
    folders[0].type === "folder" &&
    folders[0].name === title &&
    folders[0].children &&
    folders[0].children.length > 0
  ) {
    finalFolders = folders[0].children;
  }

  const shared: SharedFolder = {
    title,
    owner: author,
    folders: finalFolders,
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
  const isSplit = "splitView" in item.data;
  if (!isTab && !isFolder && !isSplit) return null;

  if (isSplit) {
    const split = (item.data as any).splitView;

    // Prefer the actual childrenIds for the split container
    const candidateIds: string[] = Array.isArray((item as any).childrenIds)
      ? (item as any).childrenIds
      : [];

    // If itemWidthFactors is present, use any string entries as ordering hints
    const factorIds: string[] = Array.isArray(split?.itemWidthFactors)
      ? (split.itemWidthFactors as unknown[]).filter(
          (v): v is string => typeof v === "string",
        )
      : [];

    let orderedChildIds: string[] = [];
    if (candidateIds.length > 0 && factorIds.length > 0) {
      const fromFactors = factorIds.filter((id) => candidateIds.includes(id));
      const remaining = candidateIds.filter((id) => !factorIds.includes(id));
      orderedChildIds = [...fromFactors, ...remaining];
    } else if (candidateIds.length > 0) {
      orderedChildIds = candidateIds;
    } else {
      // Fallback: if no childrenIds, but factors include ids, use them
      orderedChildIds = factorIds;
    }

    const splitChildren = orderedChildIds
      .map((childId) => transformArcItemToFolderItem(childId, itemsMap))
      .filter((child): child is FolderItem => child !== null);

    const splitItem: FolderItem = {
      id: item.id,
      name: item.title || "Split View",
      type: "split",
      children: splitChildren,
    };

    return splitItem;
  }

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
