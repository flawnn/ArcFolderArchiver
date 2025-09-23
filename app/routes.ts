import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("folder/:folderid", "routes/folder-view.tsx"),
] satisfies RouteConfig;
