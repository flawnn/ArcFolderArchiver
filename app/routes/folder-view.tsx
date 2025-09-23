// provides type safety/inference
import { redirect } from "react-router";
import type { Route } from "./+types/folder-view";

// provides `loaderData` to the component
export async function loader({ params }: Route.LoaderArgs) {
  if (params.folderid.length == 0) {
    redirect("/");
  }

  //   const team = await fetchTeam(params.folderid);
  //   return { name: team.name };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  return <h1>TEST</h1>;
}
