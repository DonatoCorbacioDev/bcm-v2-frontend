"use client";

import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 fixed top-0 left-0 right-0 z-10">
      <div className="h-full px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            BCM
          </h1>
          <span className="text-sm text-gray-500">
            Business Contracts Manager
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-gray-500">{user?.role || "ADMIN"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
