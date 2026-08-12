import { redirect } from "react-router";
import type { Route } from "./+types/share-legacy-redirect";

export async function loader({ params }: Route.LoaderArgs) {
  const shareId = params.folderid;
  if (!shareId) {
    throw redirect("/");
  }

  throw redirect(`/share/${shareId}`);
}

export default function ShareLegacyRedirect() {
  return null;
}
