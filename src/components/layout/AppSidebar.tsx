import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { BarChart3, LineChart, Users, UserCircle2, LifeBuoy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  {
    title: "Portfolio",
    icon: BarChart3,
    path: "/dashboard",
  },
  {
    title: "Forex Trading",
    icon: LineChart,
    path: "/forex",
  },
  {
    title: "Referrals",
    icon: Users,
    path: "/referrals",
  },
  {
    title: "Profile",
    icon: UserCircle2,
    path: "/profile",
  },
  {
    title: "Support",
    icon: LifeBuoy,
    path: "https://t.me/blueskyinvestments",
    external: true,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <Link 
          to="/" 
          className="flex items-center space-x-3 group" 
          onClick={handleClick}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
            <img 
              src="/logo.svg" 
              alt="Bluesky Investments" 
              className="h-9 w-9 relative transform group-hover:scale-110 transition-transform duration-300" 
            />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground group-hover:text-primary transition-colors duration-300">
            Bluesky
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs uppercase tracking-wider text-sidebar-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = !item.external && location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="group relative"
                    >
                      {item.external ? (
                        <a 
                          href={item.path} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={handleClick}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-sidebar-accent group-hover:shadow-md"
                        >
                          <div className="relative">
                            <div className={`absolute inset-0 rounded-full ${isActive ? 'bg-primary/20' : 'bg-transparent'} blur-sm group-hover:blur-md transition-all duration-300`} />
                            <item.icon className="h-5 w-5 relative text-sidebar-foreground/70 group-hover:text-primary transition-colors duration-300" />
                          </div>
                          <span className="text-sidebar-foreground/90 group-hover:text-primary transition-colors duration-300">
                            {item.title}
                          </span>
                        </a>
                      ) : (
                        <Link 
                          to={item.path} 
                          onClick={handleClick}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-sidebar-accent group-hover:shadow-md"
                        >
                          <div className="relative">
                            <div className={`absolute inset-0 rounded-full ${isActive ? 'bg-primary/20' : 'bg-transparent'} blur-sm group-hover:blur-md transition-all duration-300`} />
                            <item.icon className="h-5 w-5 relative text-sidebar-foreground/70 group-hover:text-primary transition-colors duration-300" />
                          </div>
                          <span className="text-sidebar-foreground/90 group-hover:text-primary transition-colors duration-300">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}