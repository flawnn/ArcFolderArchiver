import { ChevronRight, Loader2, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Form, useActionData, useNavigation } from "react-router";
import type { POSTFolderRequest } from "~/api/models/archive";
import { BlurContainer } from "~/components/blur-container";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tooltip } from "~/components/ui/tooltip";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Arc Folder Archiver" },
    { name: "description", content: "Flatten your Arc folders" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const url = (formData.get("url") ?? "").toString().trim();
  const jsonOnly =
    (formData.get("jsonOnly") ?? "").toString().trim() === "true";

  if (!url) {
    return Response.json(
      { message: "Please enter an Arc folder URL." },
      { status: 400 },
    );
  }

  // Extract last non-empty path segment
  const arcId = extractArcId();

  if (!arcId) {
    return Response.json(
      { message: "The provided URL does not contain a valid Arc folder UUID." },
      { status: 400 },
    );
  }

  // Build absolute URL to API using current request URL as base
  const apiUrl = new URL("/api/archive", request.url);

  // Ensure HTTPS in production to avoid reverse proxy POST->GET conversion
  if (process.env.NODE_ENV === "production") {
    apiUrl.protocol = "https:";
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        arcId,
        deleteInDays: 30,
        jsonOnly,
      } satisfies POSTFolderRequest),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        (data && (data as any).message) || "Failed to archive folder.";
      return Response.json({ message }, { status: res.status });
    }

    if (jsonOnly) {
      // Pass payload back to the client for download
      return Response.json({ jsonOnly: true, payload: data });
    }

    const internalUUID = (data as any)?.internalUUID as string | undefined;
    if (!internalUUID) {
      return Response.json(
        { message: "Unexpected server response." },
        { status: 500 },
      );
    }

    const redirectUrl = new URL(`/folder/${internalUUID}`, request.url);
    return Response.redirect(redirectUrl);
  } catch (err) {
    return Response.json(
      { message: "Network error. Please try again." },
      { status: 500 },
    );
  }

  function extractArcId(): string | null {
    const segments = url.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? "";

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(lastSegment)) {
      return lastSegment;
    } else return null;
  }
}

function ArcArchiver() {
  const [url, setUrl] = useState("");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Optional Settings
  const [isJsonOnly, setIsJsonOnly] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!actionData) return;

    const anyData = actionData as any;

    if (anyData.message) {
      toast.error(anyData.message);
      return;
    }

    if (anyData.jsonOnly && anyData.payload) {
      try {
        const blob = new Blob([JSON.stringify(anyData.payload, null, 2)], {
          type: "application/json",
        });
        const dl = document.createElement("a");
        const url = URL.createObjectURL(blob);
        dl.href = url;
        dl.download = `arc-archive-${Date.now()}.json`;
        document.body.appendChild(dl);
        dl.click();
        dl.remove();
        URL.revokeObjectURL(url);
        toast.success("JSON downloaded!");
      } catch {
        toast.error("Failed to download JSON");
      }
    }
  }, [actionData]);

  return (
    <BlurContainer>
      {/* Header */}
      <div className="text-center mb-14">
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
      <Form method="post">
        <label className="block text-white/90 text-lg font-medium mb-4 tracking-wide">
          Arc Folder URL
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="url"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://arc.net/folder/..."
              className="h-14 text-lg font-normal bg-white/90 border-0 rounded-2xl px-6 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          {/* Settings popover */}
          <div className="relative">
            <Tooltip content="Settings" side="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-2xl bg-white/20 hover:bg-white/30 text-white border-0"
                aria-label="Settings"
                type="button"
                onClick={() => setIsSettingsOpen((v) => !v)}
              >
                <Settings className="h-6 w-6" />
              </Button>
            </Tooltip>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/90 text-gray-900 shadow-xl p-4 z-10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">JSON Only</p>
                    <p className="text-sm text-gray-600">
                      Download as JSON without creating a view.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsJsonOnly((v) => !v)}
                    className={
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors " +
                      (isJsonOnly ? "bg-blue-600" : "bg-gray-300")
                    }
                    aria-pressed={isJsonOnly}
                    aria-label="Toggle JSON Only"
                  >
                    <span
                      className={
                        "inline-block h-5 w-5 transform rounded-full bg-white transition-transform " +
                        (isJsonOnly ? "translate-x-5" : "translate-x-1")
                      }
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden field for JSON Only */}
        {isJsonOnly && <input type="hidden" name="jsonOnly" value="true" />}

        {/* Archive Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="mt-10 w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-xl font-medium tracking-wide rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex-1"></div>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Processing...
            </span>
          ) : (
            <span>{isJsonOnly ? "Download JSON" : "Archive Folder"}</span>
          )}
          <div className="flex-1 flex justify-end">
            {isSubmitting ? null : <ChevronRight className="h-6 w-6" />}
          </div>
        </Button>
      </Form>
    </BlurContainer>
  );
}

export default function Home() {
  return (
    <div className="flex items-center justify-center">
      <ArcArchiver />
    </div>
  );
}
