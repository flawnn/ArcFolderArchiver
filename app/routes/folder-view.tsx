// provides type safety/inference
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { redirect } from "react-router";
import { archiveService } from "~/api/archive/archive.service";
import type { SharedFolder } from "~/api/models/folder";
import { ActionButton } from "~/components/action-button";
import { BlurContainer } from "~/components/blur-container";
import { FolderItemWidget } from "~/components/folder-item";
import { NoFolderFound } from "~/components/no-folder-found";
import { transformArcToSharedFolder } from "~/external/arc-transformer";
import type { Route } from "./+types/folder-view";

// provides `loaderData` to the component
export async function loader({ request, params }: Route.LoaderArgs) {
  const folderId = params.folderid;
  if (!folderId || folderId.length === 0) {
    throw redirect("/");
  }

  try {
    // Fetch the archived folder from the database
    const archivedFolder = await archiveService.getFolder(folderId);

    if (!archivedFolder) {
      // Return a special flag to indicate no folder found
      return { data: null, notFound: true };
    }

    // Transform ArcFolder to SharedFolder format
    const sharedFolder = transformArcToSharedFolder(archivedFolder.folderData);

    return { data: sharedFolder, notFound: false, folderId };
  } catch (error) {
    console.error("Error loading folder:", error);
    // Return not found for any errors (including invalid UUID format)
    return { data: null, notFound: true };
  }
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const { data, notFound, folderId } = loaderData as unknown as {
    data: SharedFolder | null;
    notFound: boolean;
    folderId?: string;
  };

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show fallback if no folder found
  if (notFound || !data) {
    return <NoFolderFound />;
  }

  const handleFolderClick = (folderId: string) => {
    console.debug("Folder clicked", folderId);
  };

  const handleDeleteFolder = async () => {
    if (!folderId || isDeleting) return;

    if (
      !confirm(
        "Are you sure you want to delete this folder? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/archive", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: folderId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete folder");
      }

      toast.success("Folder deleted successfully");
      // Redirect to homepage after successful deletion
      window.location.href = "/";
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete folder",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* TODO: Consider moving these scroll styles to a global CSS module for reuse */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.28);
          border-radius: 9999px;
        }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.28) transparent; }
      `}</style>

      <BlurContainer>
        {/* Header */}
        <header className="mb-8 relative -top-6 -left-6">
          <h1 className="text-neutral-300 text-xl font-medium top-1 right-1">
            Arc Archiver
          </h1>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="mb-8">
            <h2 className="text-white text-5xl font-bold mb-2 text-balance">
              {data.title}
            </h2>
            <p className="text-white/80 text-lg">From {data.owner}</p>
          </div>

          {/* Folder List (Scrollable) */}
          <div className="relative mb-8">
            <div
              ref={scrollRef}
              className="relative overflow-y-auto overscroll-contain custom-scroll pr-1"
              style={{
                maxHeight: "55vh",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)",
                maskImage:
                  "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 12px), transparent)",
              }}
            >
              <div className="space-y-2 py-2">
                {data.folders.map((folder) => (
                  <FolderItemWidget
                    key={folder.id}
                    folder={folder}
                    onClick={(folder) => handleFolderClick(folder.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between">
            <ActionButton
              variant="delete"
              onClick={handleDeleteFolder}
              className={isDeleting ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isDeleting ? "Deleting..." : "Delete Folder"}
            </ActionButton>

            <ActionButton variant="download" onClick={handleDownloadJSON}>
              Download JSON
            </ActionButton>
          </div>
        </div>
      </BlurContainer>
    </>
  );
}
