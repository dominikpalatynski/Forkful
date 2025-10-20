import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Utensils, Sparkles, Pencil } from "lucide-react";
import { Button } from "./button";
import { NavUser } from "@/components/NavUser";
const items = [
  {
    title: "Przepisy",
    url: "/recipes",
    icon: Utensils,
  },
];
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://github.com/shadcn.png",
};
export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/recipes">
                <Utensils className="!size-5" />
                <span className="text-base font-semibold">Forkful</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2 p-2">
              <SidebarMenuButton
                onClick={() => (window.location.href = "/recipes/new")}
                tooltip="Stwórz ręcznie"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <Pencil />
                <span>Stwórz ręcznie</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                onClick={() => (window.location.href = "/recipes/new-ai")}
              >
                <Sparkles />
                <span className="sr-only">Stwórz z AI</span>
              </Button>
            </SidebarMenuItem>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={mockUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
