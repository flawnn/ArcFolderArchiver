import { z } from "zod";

const TabDataSchema = z.object({
  timeLastActiveAt: z.number(),
  savedMuteStatus: z.string(),
  activeTabBeforeCreationID: z.uuid().optional(),
  savedURL: z.url(),
  savedTitle: z.string(),
  referrerID: z.uuid().optional(),
});

const ListDataSchema = z.object({});

const SplitViewDataSchema = z.object({
  focusItemID: z.uuid(),
  layoutOrientation: z.enum(["horizontal", "vertical"]),
  timeLastActiveAt: z.number(),
  itemWidthFactors: z.array(z.union([z.string(), z.number()])),
  customInfo: z.null(),
});

const ArcItemDataSchema = z.union([
  z.object({ tab: TabDataSchema }),
  z.object({ list: ListDataSchema }),
  z.object({ splitView: SplitViewDataSchema }),
]);

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

export const ArcFolderSchema = z.object({
  data: z.object({
    items: z.array(ArcItemSchema).default([]),
    rootID: z.uuid().nullable(),
    root: z.uuid().nullable(),
  }),
  shareID: z.uuid(),
  author: z.string(),
});

export type ArcFolder = z.infer<typeof ArcFolderSchema>;
export type ArcItem = z.infer<typeof ArcItemSchema>;
