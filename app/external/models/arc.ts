import { z } from "zod";

const TabDataSchema = z.object({
  timeLastActiveAt: z.number(),
  savedMuteStatus: z.string(),
  activeTabBeforeCreationID: z.string().uuid().optional(),
  savedURL: z.string().url(),
  savedTitle: z.string(),
  referrerID: z.string().uuid().optional(),
});

const ListDataSchema = z.object({});

const SplitViewDataSchema = z.object({
  focusItemID: z.string().uuid(),
  layoutOrientation: z.enum(["horizontal", "vertical"]),
  timeLastActiveAt: z.number(),
  itemWidthFactors: z.array(z.union([z.string(), z.number()])),
  customInfo: z.null(),
});

const ArcItemDataSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("tab"), tab: TabDataSchema }),
  z.object({ type: z.literal("list"), list: ListDataSchema }),
  z.object({ type: z.literal("splitView"), splitView: SplitViewDataSchema }),
]);

export const ArcItemSchema = z.object({
  id: z.string().uuid(),
  parentID: z.string().uuid(),
  childrenIds: z.array(z.string().uuid()),
  title: z.string().nullable(),
  createdAt: z.number(),
  data: ArcItemDataSchema,
  isUnread: z.boolean(),
  originatingDevice: z.string().uuid(),
});

export const ArcFolderSchema = z.object({
  items: z.array(ArcItemSchema),
  rootID: z.string().uuid(),
  root: z.string().uuid(),
  author: z.string(),
});

export type ArcFolder = z.infer<typeof ArcFolderSchema>;
export type ArcItem = z.infer<typeof ArcItemSchema>;
