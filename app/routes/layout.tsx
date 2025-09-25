import { Outlet } from "react-router";
import { Background } from "~/components/background";

export default function Layout() {
  return (
    <Background>
      <div className="p-2 w-full h-full flex items-center justify-center">
        <Outlet />
      </div>
    </Background>
  );
}
