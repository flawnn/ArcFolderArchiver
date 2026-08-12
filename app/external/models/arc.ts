import { z } from "zod";

/**
 * Represents the data for a single tab item in Arc.
 */
const TabDataSchema = z.object({
  timeLastActiveAt: z.number().optional(),
  savedMuteStatus: z.string().optional(),
  activeTabBeforeCreationID: z.uuid().optional(),
  savedURL: z.union([z.url(), z.literal("")]),
  savedTitle: z.string(),
  referrerID: z.uuid().optional(),
});

/**
 * Represents a list or folder. It's currently an empty object as its
 * properties are part of ArcItemSchema itself (e.g., title, childrenIds).
 */
const ListDataSchema = z.object({});

/**
 * Represents a split view, containing multiple items.
 */
const SplitViewDataSchema = z.object({
  focusItemID: z.uuid().nullable(),
  layoutOrientation: z.enum(["horizontal", "vertical"]),
  timeLastActiveAt: z.number(),
  itemWidthFactors: z.array(z.union([z.string(), z.number()])),
  customInfo: z.null(),
});

/**
 * Space section container (pinned / unpinned roots).
 */
const ItemContainerDataSchema = z.object({
  itemContainer: z.object({
    containerType: z.record(z.string(), z.unknown()),
  }),
});

/**
 * Embedded shared Arc object (e.g. linked folder URL inside a space).
 */
const SharedObjectDataSchema = z.object({
  sharedObject: z
    .object({
      slug: z.string().optional(),
      sidebarData: z.record(z.string(), z.unknown()).optional(),
    })
    .loose(),
});

/**
 * A union of possible data types for an Arc item.
 */
const ArcItemDataSchema = z.union([
  z.object({ tab: TabDataSchema }),
  z.object({ list: ListDataSchema }),
  z.object({ splitView: SplitViewDataSchema }),
  ItemContainerDataSchema,
  SharedObjectDataSchema,
]);

/**
 * Represents a generic item in Arc, which could be a tab, a folder (list),
 * split view, space container, or embedded shared object.
 */
export const ArcItemSchema = z
  .object({
    id: z.uuid(),
    parentID: z.string().nullable(),
    childrenIds: z.array(z.uuid()),
    title: z.string().nullable(),
    createdAt: z.number(),
    data: ArcItemDataSchema,
    isUnread: z.boolean(),
    originatingDevice: z.uuid(),
  })
  .omit({ originatingDevice: true, isUnread: true });

const ArcSpaceSchema = z
  .object({
    id: z.uuid(),
    title: z.string(),
    containerIDs: z.array(z.string()).optional(),
    newContainerIDs: z.array(z.unknown()).optional(),
    customInfo: z
      .object({
        iconType: z
          .object({
            emoji_v2: z.string().optional(),
            emoji: z.number().optional(),
          })
          .loose()
          .optional(),
      })
      .loose()
      .optional(),
    profile: z.unknown().optional(),
  })
  .loose();

/**
 * Represents a shared Arc folder or space, containing items and metadata.
 * Folder shares use `root` / `rootID`; space shares use `space`.
 */
export const ArcFolderSchema = z.object({
  data: z.object({
    items: z.array(ArcItemSchema).default([]),
    rootID: z.uuid().nullable().optional(),
    /** The root item(s) of a shared folder. Absent on space shares. */
    root: z
      .union([z.uuid().nullable(), z.array(z.uuid())])
      .optional(),
    /** The root items, typically used when sharing a collection of items. */
    rootItems: z.array(z.uuid()).optional(),
    /** Present when the share is an Arc space rather than a single folder. */
    space: ArcSpaceSchema.optional(),
  }),
  shareID: z.uuid(),
  author: z.string(),
  path: z.string().optional(),
});

export type ArcFolder = z.infer<typeof ArcFolderSchema>;
export type ArcItem = z.infer<typeof ArcItemSchema>;
export type ArcSpace = z.infer<typeof ArcSpaceSchema>;

export const isArcSpaceShare = (
  arcShare: ArcFolder,
): arcShare is ArcFolder & { data: { space: ArcSpace } } =>
  arcShare.data.space != null;
