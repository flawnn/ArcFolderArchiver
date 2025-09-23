import { ChevronRight, Loader2, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Form, useActionData, useNavigation } from "react-router";
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

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ arcId, deleteInDays: 30 }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        (data && (data as any).message) || "Failed to archive folder.";
      return Response.json({ message }, { status: res.status });
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

  function extractArcId(): String | null {
    const segments = url.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? "";

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(lastSegment)) {
      return lastSegment;
    } else return null;
  }
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
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData && (actionData as any).message) {
      toast.error((actionData as any).message);
    }
  }, [actionData]);

  return (
    <BlurContainer>
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
      <Form method="post" className="mb-12">
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
          <Tooltip content="No custom settings available yet" side="top">
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-2xl bg-white/20 hover:bg-white/30 text-white border-0"
              aria-label="Settings"
              type="button"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </Tooltip>
        </div>

        {/* Archive Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="mt-8 w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-xl font-medium tracking-wide rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex-1"></div>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Processing...
            </span>
          ) : (
            <span>Archive Folder</span>
          )}
          <div className="flex-1 flex justify-end">
            {isSubmitting ? null : <ChevronRight className="h-6 w-6" />}
          </div>
        </Button>
      </Form>
    </BlurContainer>
  );
}
