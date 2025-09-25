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
  focusItemID: z.uuid(),
  layoutOrientation: z.enum(["horizontal", "vertical"]),
  timeLastActiveAt: z.number(),
  itemWidthFactors: z.array(z.union([z.string(), z.number()])),
  customInfo: z.null(),
});

/**
 * A union of possible data types for an Arc item.
 * It can be a tab, a list (folder), or a split view.
 */
const ArcItemDataSchema = z.union([
  z.object({ tab: TabDataSchema }),
  z.object({ list: ListDataSchema }),
  z.object({ splitView: SplitViewDataSchema }),
]);

/**
 * Represents a generic item in Arc, which could be a tab, a folder (list),
 * or a split view. We omit `originatingDevice` and `isUnread` as they are
 * not needed for our use case.
 */
export const ArcItemSchema = z
  .object({
    id: z.uuid(),
    parentID: z.uuid(),
    childrenIds: z.array(z.uuid()),
    title: z.string().nullable(),
    createdAt: z.number(),
    data: ArcItemDataSchema,
    isUnread: z.boolean(),
    originatingDevice: z.uuid(),
  })
  .omit({ originatingDevice: true, isUnread: true });

/**
 * Represents a shared Arc Folder, containing all the items and metadata.
 * The structure of `data` can vary based on what is being shared.
 * It can be a single folder (with a single `root` and `rootID`) or a collection
 * of items (with `root` and `rootItems` as arrays of UUIDs).
 */
export const ArcFolderSchema = z.object({
  data: z.object({
    items: z.array(ArcItemSchema).default([]),
    rootID: z.uuid().nullable().optional(),
    /** The root item(s) of the shared folder. Can be a single UUID or an array of UUIDs. */
    root: z.union([z.uuid().nullable(), z.array(z.uuid())]),
    /** The root items, typically used when sharing a collection of items. */
    rootItems: z.array(z.uuid()).optional(),
  }),
  shareID: z.uuid(),
  author: z.string(),
});

export type ArcFolder = z.infer<typeof ArcFolderSchema>;
export type ArcItem = z.infer<typeof ArcItemSchema>;
