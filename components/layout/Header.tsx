"use client";

import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

interface HeaderProps {
  readonly onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 fixed top-0 left-0 right-0 z-30">
      <div className="h-full px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Hamburger button - visible only on mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            BCM
          </h1>
          <span className="hidden sm:inline text-sm text-gray-500">
            Business Contracts Manager
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm text-right">
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-gray-500">{user?.roleId || "ADMIN"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}