import { describe, expect, it } from "bun:test";
import type { ArcFolder } from "./models/arc";
import { transformArcToSharedFolder } from "./arc-transformer";

const spaceShareFixture: ArcFolder = {
  shareID: "db12bf26-a70f-4dd0-83d3-f02e68a9e9ae",
  author: "Baran",
  path: "/space/DB12BF26-A70F-4DD0-83D3-F02E68A9E9AE",
  data: {
    space: {
      id: "5fe4c050-fa08-4c94-a10b-9bf54b91adb0",
      title: "ETH - Research",
      containerIDs: [
        "pinned",
        "7c5da6e6-f61b-4993-b07d-eab6e88fe990",
        "unpinned",
        "a7617eca-f8d0-4f8d-be33-f16df014aeb5",
      ],
      customInfo: {
        iconType: {
          emoji_v2: "🔬",
        },
      },
    },
    items: [
      {
        id: "7c5da6e6-f61b-4993-b07d-eab6e88fe990",
        parentID: null,
        childrenIds: ["tab-1", "folder-1", "shared-1"],
        title: null,
        createdAt: 1,
        data: {
          itemContainer: {
            containerType: {
              spaceItems: { _0: "5fe4c050-fa08-4c94-a10b-9bf54b91adb0" },
            },
          },
        },
      },
      {
        id: "a7617eca-f8d0-4f8d-be33-f16df014aeb5",
        parentID: null,
        childrenIds: ["tab-open-1"],
        title: null,
        createdAt: 1,
        data: {
          itemContainer: {
            containerType: {
              spaceItems: { _0: "5fe4c050-fa08-4c94-a10b-9bf54b91adb0" },
            },
          },
        },
      },
      {
        id: "tab-1",
        parentID: "7c5da6e6-f61b-4993-b07d-eab6e88fe990",
        childrenIds: [],
        title: null,
        createdAt: 1,
        data: {
          tab: {
            savedURL: "https://example.com/pinned",
            savedTitle: "Pinned Tab",
          },
        },
      },
      {
        id: "folder-1",
        parentID: "7c5da6e6-f61b-4993-b07d-eab6e88fe990",
        childrenIds: [],
        title: "Research",
        createdAt: 1,
        data: { list: {} },
      },
      {
        id: "shared-1",
        parentID: "folder-1",
        childrenIds: [],
        title: null,
        createdAt: 1,
        data: {
          sharedObject: {
            slug: "folder",
            sidebarData: {
              tab: {
                _0: {
                  rootID: "nested-root",
                  items: [
                    {
                      id: "nested-root",
                      parentID: null,
                      childrenIds: [],
                      title: "EA Global",
                      createdAt: 1,
                      data: { list: {} },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        id: "tab-open-1",
        parentID: "a7617eca-f8d0-4f8d-be33-f16df014aeb5",
        childrenIds: [],
        title: null,
        createdAt: 1,
        data: {
          tab: {
            savedURL: "https://example.com/open",
            savedTitle: "Open Tab",
          },
        },
      },
    ],
  },
};

describe("transformArcToSharedFolder", () => {
  it("maps space shares to pinned folders and open tabs", () => {
    const { shared, shareUrl } = transformArcToSharedFolder(spaceShareFixture);

    expect(shared.shareType).toBe("space");
    expect(shared.title).toBe("ETH - Research");
    expect(shared.emoji).toBe("🔬");
    expect(shareUrl).toBe(
      "https://arc.net/space/DB12BF26-A70F-4DD0-83D3-F02E68A9E9AE",
    );
    expect(shared.folders.map((item) => item.name)).toEqual([
      "Pinned Tab",
      "Research",
    ]);
    expect(shared.openTabs?.map((item) => item.name)).toEqual(["Open Tab"]);
  });

  it("does not surface sharedObject items as top-level folders", () => {
    const { shared } = transformArcToSharedFolder(spaceShareFixture);

    expect(shared.folders.some((item) => item.name === "EA Global")).toBe(
      false,
    );
  });
});
