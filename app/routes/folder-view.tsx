// provides type safety/inference
import { useRef, useState } from "react";
import { redirect } from "react-router";
import type { SharedFolder } from "~/api/models/folder";
import { ActionButton } from "~/components/action-button";
import { BlurContainer } from "~/components/blur-container";
import { FolderItemWidget } from "~/components/folder-item";
import type { Route } from "./+types/folder-view";

// provides `loaderData` to the component
export async function loader({ params }: Route.LoaderArgs) {
  const folderId = params.folderid;
  if (!folderId || folderId.length === 0) {
    throw redirect("/");
  }

  // [AI] TODO: replace with real fetch by folderId
  const mock: SharedFolder = {
    title: "My Project Folder",
    owner: "John Doe",
    folders: [
      {
        id: "1",
        name: "Development",
        type: "folder",
        children: [
          { id: "1-1", name: "GitHub Repository", type: "tab" },
          { id: "1-2", name: "Documentation", type: "tab" },
          {
            id: "1-3",
            name: "Frontend",
            type: "folder",
            children: [
              { id: "1-3-1", name: "React Components", type: "tab" },
              { id: "1-3-2", name: "Styling Guide", type: "tab" },
            ],
          },
        ],
      },
      {
        id: "2",
        name: "Research",
        type: "folder",
        children: [
          { id: "2-1", name: "Market Analysis", type: "tab" },
          { id: "2-2", name: "Competitor Research", type: "tab" },
          { id: "2-3", name: "User Interviews", type: "tab" },
        ],
      },
      { id: "3", name: "Project Brief", type: "tab" },
      { id: "4", name: "Meeting Notes", type: "tab" },
    ],
  };

  return { data: mock };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData as unknown as { data: SharedFolder };

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const handleFolderClick = (folderId: string) => {
    // [AI] handle navigation to sub-folder or expand details
    console.debug("Folder clicked", folderId);
  };

  const handleDeleteFolder = () => {
    // [AI] trigger delete flow
    console.debug("Delete folder");
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
            <ActionButton variant="delete" onClick={handleDeleteFolder}>
              Delete Folder
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
