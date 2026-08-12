import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("share/:shareid", "routes/share-view.tsx"),
    route("folder/:folderid", "routes/share-legacy-redirect.tsx"),
  ]),
] satisfies RouteConfig;
