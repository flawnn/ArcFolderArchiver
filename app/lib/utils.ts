import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ArchivedFolder } from "~/db/schema";
import type { ArcFolder } from "~/external/models/arc";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const createMockArchivedFolder = (
  overrides: Partial<ArchivedFolder> = {},
): ArchivedFolder => {
  const mockFolderData: ArcFolder = {
    data: {
      items: [],
      root: "mock-root-id",
      rootID: "mock-root-id",
    },
    shareID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    author: "Test Author",
  };

  return {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    arcId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    folderData: mockFolderData,
    lastFetchedAt: new Date(),
    deleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
};
