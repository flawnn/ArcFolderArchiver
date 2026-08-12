import { describe, expect, it } from "bun:test";
import routes from "../routes";
import { loader } from "./share-legacy-redirect";

const validShareId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

const expectRedirect = async (
  run: () => Promise<unknown>,
  location: string,
) => {
  try {
    await run();
    expect.unreachable("Expected loader to throw a redirect Response");
  } catch (error) {
    expect(error).toBeInstanceOf(Response);

    const response = error as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(location);
  }
};

describe("share-legacy-redirect loader", () => {
  it("redirects legacy /folder/:id URLs to /share/:id", async () => {
    await expectRedirect(
      () => loader({ params: { folderid: validShareId } } as never),
      `/share/${validShareId}`,
    );
  });

  it("preserves the share id casing in the redirect target", async () => {
    const uppercaseShareId = "F47AC10B-58CC-4372-A567-0E02B2C3D479";

    await expectRedirect(
      () => loader({ params: { folderid: uppercaseShareId } } as never),
      `/share/${uppercaseShareId}`,
    );
  });

  it("redirects to home when folderid param is missing", async () => {
    await expectRedirect(
      () => loader({ params: {} } as never),
      "/",
    );
  });

  it("redirects to home when folderid param is empty", async () => {
    await expectRedirect(
      () => loader({ params: { folderid: "" } } as never),
      "/",
    );
  });
});

describe("legacy share route registration", () => {
  it("keeps folder/:folderid wired to the legacy redirect route", () => {
    const layoutRoute = routes[0];
    const legacyRoute = layoutRoute.children?.find(
      (route) => route.path === "folder/:folderid",
    );

    expect(legacyRoute?.file).toBe("routes/share-legacy-redirect.tsx");
  });

  it("registers the canonical share view route", () => {
    const layoutRoute = routes[0];
    const shareRoute = layoutRoute.children?.find(
      (route) => route.path === "share/:shareid",
    );

    expect(shareRoute?.file).toBe("routes/share-view.tsx");
  });
});
