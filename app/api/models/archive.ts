import z from "zod";

// POST /folder schemas - Input & Output
const POSTFolderRequestSchema = z.object({
  deleteInDays: z.int().nonnegative().default(0),
  arcId: z.uuid(),
  jsonOnly: z.boolean().optional().default(false),
});

const POSTFolderResponseSchema = z.object({
  internalUUID: z.string(),
});

// DELETE /folder schemas - Input & Output
const DELETEFolderRequestSchema = z.object({
  id: z.uuid(),
});

const DELETEFolderResponseSchema = z.boolean();

// Export schemas
export {
  DELETEFolderRequestSchema,
  DELETEFolderResponseSchema,
  POSTFolderRequestSchema,
  POSTFolderResponseSchema,
};

// Export types
export type POSTFolderRequest = z.infer<typeof POSTFolderRequestSchema>;
export type POSTFolderResponse = z.infer<typeof POSTFolderResponseSchema>;
export type DELETEFolderRequest = z.infer<typeof DELETEFolderRequestSchema>;
export type DELETEFolderResponse = z.infer<typeof DELETEFolderResponseSchema>;
