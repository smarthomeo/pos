import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen flex-col">
            <header className="border-b p-4 flex items-center justify-between">
              <SidebarTrigger />
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
      <Sonner />
    </SidebarProvider>
  );
}