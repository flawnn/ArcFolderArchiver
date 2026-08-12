import type { FolderItem, SharedFolder } from "~/api/models/folder";
import {
  type ArcFolder,
  type ArcItem,
  type ArcSpace,
  isArcSpaceShare,
} from "~/external/models/arc";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function transformArcToSharedFolder(arcFolder: ArcFolder): {
  shared: SharedFolder;
  shareUrl: string;
} {
  if (isArcSpaceShare(arcFolder)) {
    return transformArcSpaceToSharedFolder(arcFolder);
  }

  return transformArcFolderShareToSharedFolder(arcFolder);
}

function transformArcFolderShareToSharedFolder(arcFolder: ArcFolder): {
  shared: SharedFolder;
  shareUrl: string;
} {
  const { data, author, shareID, path } = arcFolder;
  const { items } = data;

  const itemsMap = new Map<string, ArcItem>();
  items.forEach((item) => itemsMap.set(item.id, item));

  const rootItems = resolveFolderRootItems(data);

  const folders: FolderItem[] = rootItems
    .map((id) => transformArcItemToFolderItem(id, itemsMap))
    .filter((item): item is FolderItem => item !== null);

  const title =
    (rootItems.length > 0 &&
      (itemsMap.get(rootItems[0])?.data as { tab?: { savedTitle?: string } })
        ?.tab?.savedTitle) ||
    itemsMap.get(rootItems[0])?.title ||
    "Archived Share";

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
    shareType: "folder",
    folders: finalFolders,
  };

  const shareUrl =
    path != null && path.startsWith("/")
      ? `https://arc.net${path}`
      : `https://arc.net/folder/${shareID}`;

  return { shared, shareUrl };
}

function transformArcSpaceToSharedFolder(
  arcFolder: ArcFolder & { data: { space: ArcSpace } },
): {
  shared: SharedFolder;
  shareUrl: string;
} {
  const normalized = normalizeSpaceShare(arcFolder);
  const { itemsMap, pinnedChildIds, openTabIds, space, author, shareID, path } =
    normalized;

  const folders: FolderItem[] = pinnedChildIds
    .map((id) => transformArcItemToFolderItem(id, itemsMap))
    .filter((item): item is FolderItem => item !== null);

  const openTabs: FolderItem[] = openTabIds
    .map((id) => transformArcItemToFolderItem(id, itemsMap))
    .filter((item): item is FolderItem => item !== null);

  const emoji = space.customInfo?.iconType?.emoji_v2;
  const title = space.title || "Archived Space";

  const shared: SharedFolder = {
    title,
    owner: author,
    shareType: "space",
    emoji,
    folders,
    openTabs: openTabs.length > 0 ? openTabs : undefined,
  };

  const shareUrl =
    path != null && path.startsWith("/")
      ? `https://arc.net${path}`
      : `https://arc.net/space/${shareID}`;

  return { shared, shareUrl };
}

type NormalizedSpaceShare = {
  itemsMap: Map<string, ArcItem>;
  pinnedChildIds: string[];
  openTabIds: string[];
  space: ArcSpace;
  author: string;
  shareID: string;
  path?: string;
};

function normalizeSpaceShare(
  arcFolder: ArcFolder & { data: { space: ArcSpace } },
): NormalizedSpaceShare {
  const { data, author, shareID, path } = arcFolder;
  const { items, space } = data;

  const itemsMap = new Map<string, ArcItem>();
  for (const item of items) {
    itemsMap.set(item.id, item);
  }

  const { pinnedId, unpinnedId } = resolveSpaceContainerIds(space);

  const pinnedChildIds =
    pinnedId != null
      ? (itemsMap.get(pinnedId)?.childrenIds ?? [])
      : [];
  const openTabIds =
    unpinnedId != null
      ? (itemsMap.get(unpinnedId)?.childrenIds ?? [])
      : [];

  return {
    itemsMap,
    pinnedChildIds,
    openTabIds,
    space,
    author,
    shareID,
    path,
  };
}

function resolveSpaceContainerIds(space: ArcSpace): {
  pinnedId?: string;
  unpinnedId?: string;
} {
  const ids = space.containerIDs ?? [];
  let pinnedId: string | undefined;
  let unpinnedId: string | undefined;

  for (let index = 0; index < ids.length; index++) {
    const id = ids[index];
    const next = ids[index + 1];

    if (id === "pinned" && next != null && UUID_REGEX.test(next)) {
      pinnedId = next;
    }

    if (id === "unpinned" && next != null && UUID_REGEX.test(next)) {
      unpinnedId = next;
    }
  }

  return { pinnedId, unpinnedId };
}

function resolveFolderRootItems(data: ArcFolder["data"]): string[] {
  const { root, rootID } = data;
  const rootItems: string[] = [];

  if (Array.isArray(root)) {
    rootItems.push(...root);
  } else if (root) {
    rootItems.push(root);
  } else if (rootID) {
    rootItems.push(rootID);
  }

  if (
    Array.isArray(data.rootItems) &&
    data.rootItems.length > 0
  ) {
    for (const id of data.rootItems) {
      if (!rootItems.includes(id)) rootItems.push(id);
    }
  }

  return rootItems;
}

function transformArcItemToFolderItem(
  itemId: string,
  itemsMap: Map<string, ArcItem>,
): FolderItem | null {
  const item = itemsMap.get(itemId);
  if (!item) return null;

  if ("itemContainer" in item.data) return null;
  if ("sharedObject" in item.data) return null;

  const isTab = "tab" in item.data;
  const isFolder = "list" in item.data;
  const isSplit = "splitView" in item.data;
  if (!isTab && !isFolder && !isSplit) return null;

  if (isSplit) {
    const split = (item.data as { splitView: Record<string, unknown> })
      .splitView;

    const candidateIds: string[] = Array.isArray(item.childrenIds)
      ? item.childrenIds
      : [];

    const factorIds: string[] = Array.isArray(split?.itemWidthFactors)
      ? (split.itemWidthFactors as unknown[]).filter(
          (value): value is string => typeof value === "string",
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
      orderedChildIds = factorIds;
    }

    const splitChildren = orderedChildIds
      .map((childId) => transformArcItemToFolderItem(childId, itemsMap))
      .filter((child): child is FolderItem => child !== null);

    return {
      id: item.id,
      name: item.title || "Split View",
      type: "split",
      children: splitChildren,
    };
  }

  const url = isTab
    ? ((item.data as { tab?: { savedURL?: string } }).tab?.savedURL ??
      undefined)
    : undefined;
  const name =
    (isTab
      ? (item.data as { tab?: { savedTitle?: string } }).tab?.savedTitle
      : item.title) || (isTab ? "Untitled Tab" : "Untitled Folder");

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
