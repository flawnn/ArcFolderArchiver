import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arc Folder Archiver" },
    { name: "description", content: "Flatten your Arc folders" },
  ];
}

export default function Home() {
  return "Hi";
}
