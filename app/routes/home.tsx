import { ChevronRight, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arc Folder Archiver" },
    { name: "description", content: "Flatten your Arc folders" },
  ];
}

export default function Home() {
  return (
    <div className="flex items-center justify-center">
      <ArcArchiver />
    </div>
  );
}

function ArcArchiver() {
  const [url, setUrl] = useState("");

  const handleArchive = () => {
    // Archive functionality would go here
    console.log("Archiving folder:", url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-300/64 backdrop-blur-[20px] rounded-3xl p-12 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-6xl font-medium text-white mb-4"
            style={{ letterSpacing: "-1.55px" }}
          >
            Arc Archiver
          </h1>
          <p className="text-xl text-white/85 font-light tracking-wide">
            Flatten or export your precious Arc folders
          </p>
        </div>

        {/* URL Input Section */}
        <div className="mb-12">
          <label className="block text-white/90 text-lg font-medium mb-4 tracking-wide">
            Arc Folder URL
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://arc.net/folder/..."
                className="h-14 text-lg font-normal bg-white/90 border-0 rounded-2xl px-6 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-white/50"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-2xl bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Archive Button */}
        <Button
          onClick={handleArchive}
          className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-xl font-medium tracking-wide rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex-1"></div>
          <span>Archive Folder</span>
          <div className="flex-1 flex justify-end">
            <ChevronRight className="h-6 w-6" />
          </div>
        </Button>
      </div>
    </div>
  );
}
