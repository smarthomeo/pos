import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Link } from "react-router-dom";
import { UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen flex-col">
            <header className="border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <ThemeToggle />
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <UserCircle2 className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
            </header>
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}