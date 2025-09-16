import { createHonoServer } from "react-router-hono-server/bun";
import { setupHonoServer } from "./hono";

export default await createHonoServer({
  app: setupHonoServer(),
});
