import { Home } from "lucide-react";
import { Link } from "react-router";
import { BlurContainer } from "~/components/blur-container";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function NoFolderFound() {
  return (
      <BlurContainer>
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 text-white/70"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4H4C2.895 4 2 4.895 2 6v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V8c0-1.105-.895-2-2-2h-8l-2-2Z"
                  fill="currentColor"
                  opacity="0.3"
                />
                <path
                  d="M9 9L15 15M15 9L9 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-4xl font-bold text-white mb-4">
            No folder archived!
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">
            The folder you're looking for doesn't exist or may have been
            deleted.
          </p>

          {/* Action Link styled as button */}
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-medium inline-flex items-center gap-2",
            )}
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
        </div>
      </BlurContainer>
      
  );
}
