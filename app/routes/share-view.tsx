import { Link as LinkIcon } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { redirect, useNavigate } from "react-router";
import { archiveService } from "~/api/archive/archive.service";
import type { SharedFolder } from "~/api/models/folder";
import { ActionButton } from "~/components/action-button";
import { BlurContainer } from "~/components/blur-container";
import { FolderItemWidget } from "~/components/folder-item";
import { NoShareFound } from "~/components/no-share-found";
import { transformArcToSharedFolder } from "~/external/arc-transformer";
import type { Route } from "./+types/share-view";

export function meta({ data }: Route.MetaArgs) {
  const loaderData = data as unknown as {
    data: SharedFolder | null;
    notFound: boolean;
    shareUrl?: string;
  };

  if (loaderData.notFound || !loaderData.data) {
    return [
      { title: "Share Not Found - Arc Archiver" },
      {
        name: "description",
        content: "The requested share could not be found",
      },
    ];
  }

  const { data: shareData } = loaderData;
  return [
    { title: `${shareData.title} - by ${shareData.owner}` },
    {
      name: "description",
      content: `View archived Arc share: ${shareData.title}`,
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const shareId = params.shareid;
  if (!shareId || shareId.length === 0) {
    throw redirect("/");
  }

  try {
    const archivedShare = await archiveService.getFolder(shareId);

    if (!archivedShare) {
      return { data: null, notFound: true, shareId };
    }

    const { shared, shareUrl } = transformArcToSharedFolder(
      archivedShare.folderData,
    );

    return { data: shared, shareUrl, notFound: false, shareId };
  } catch (error) {
    console.error("Error loading share:", error);
    return { data: null, notFound: true, shareId };
  }
}

export default function ShareView({ loaderData }: Route.ComponentProps) {
  const { data, notFound, shareId, shareUrl } = loaderData as unknown as {
    data: SharedFolder | null;
    notFound: boolean;
    shareId?: string;
    shareUrl?: string;
  };

  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (notFound || !data) {
    return <NoShareFound />;
  }

  const handleItemClick = (itemId: string) => {
    console.debug("Share item clicked", itemId);
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Original share URL copied!");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const handleDeleteShare = async () => {
    if (!shareId || isDeleting) return;

    if (
      !confirm(
        "Are you sure you want to delete this share? This action cannot be undone.",
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
        body: JSON.stringify({ id: shareId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete share");
      }

      toast.success("Share deleted successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete share",
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
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.28);
          border-radius: 9999px;
        }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.28) transparent; }
      `}</style>

      <div className="group relative mx-auto w-full sm:w-[36rem] md:w-[40rem] lg:w-[42rem]">
        <BlurContainer>
          <header
            onClick={() => navigate("/")}
            className="mb-8 relative -top-6 -left-6 cursor-pointer"
          >
            <h1 className="text-neutral-300 text-xl font-medium top-1 right-1">
              Arc Archiver
            </h1>
          </header>

          <div className="flex-1 flex flex-col max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-5xl font-bold mb-2 text-balance">
                  {data.emoji ? `${data.emoji} ` : ""}
                  {data.title}
                </h2>

                {shareUrl ? (
                  <button
                    onClick={handleCopyShareUrl}
                    aria-label="Copy original share URL"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 hover:bg-white/40 text-white">
                      <LinkIcon className="w-5 h-5" />
                    </span>
                  </button>
                ) : null}
              </div>
              <p className="text-white/80 text-lg">From {data.owner}</p>
            </div>

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
                      onClick={(item) => handleItemClick(item.id)}
                    />
                  ))}

                  {data.openTabs && data.openTabs.length > 0 ? (
                    <div className="pt-4">
                      <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider mb-3 px-1">
                        Open Tabs
                      </h3>
                      <div className="space-y-2">
                        {data.openTabs.map((tab) => (
                          <FolderItemWidget
                            key={tab.id}
                            folder={tab}
                            onClick={(item) => handleItemClick(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-between">
              <ActionButton
                variant="delete"
                onClick={handleDeleteShare}
                className={isDeleting ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isDeleting ? "Deleting..." : "Delete Share"}
              </ActionButton>

              <ActionButton variant="download" onClick={handleDownloadJSON}>
                Download JSON
              </ActionButton>
            </div>
          </div>
        </BlurContainer>
      </div>
    </>
  );
}
