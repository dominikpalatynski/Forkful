import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/store/auth.store";
import type { UserDto } from "@/types";

interface LayoutWrapperProps {
  children: React.ReactNode;
  user?: UserDto | null;
}

export function LayoutWrapper({ children, user }: LayoutWrapperProps) {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <header className="flex h-16 items-center gap-4 border-b px-6">
          <SidebarTrigger />
        </header>
        <div className="p-6">{children}</div>
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
