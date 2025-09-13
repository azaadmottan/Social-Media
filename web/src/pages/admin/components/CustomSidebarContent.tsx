import { 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "@/components/ui/sidebar";
import { 
  BellRing,
  ChartNoAxesCombined,
  Home, 
  LayoutList, 
  MessageSquareTextIcon, 
  MessagesSquare, 
  TriangleAlert,
  Users, 
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function CustomSidebarContent() {
  const navigate = useNavigate();

  const menuItems = useMemo(() => [
    {
      name: "Home",
      url: "/admin/dashboard",
      icon: <Home />,
    },
    {
      name: "Users",
      url: "/admin/dashboard/users",
      icon: <Users />,
    },
    {
      name: "Posts",
      url: "/admin/dashboard/posts",
      icon: <LayoutList />,
    },
    {
      name: "Comments",
      url: "/admin/dashboard/comments",
      icon: <MessagesSquare />,
    },
    {
      name: "Reports",
      url: "/admin/dashboard/reports",
      icon: <TriangleAlert />,
    },
    {
      name: "Analytics",
      url: "/admin/dashboard/analytics",
      icon: <ChartNoAxesCombined />,
    },
    {
      name: "Notifications",
      url: "/admin/dashboard/notifications",
      icon: <BellRing />,
    },
    {
      name: "Chat",
      url: "/admin/dashboard/chat",
      icon: <MessageSquareTextIcon />,
    },
  ], []);

  const pathname = location.pathname;

  // Match the most specific (longest) path first
  const activeItem = menuItems.findLast((item) =>
    pathname === item.url || pathname.startsWith(`${item.url}/`)
  );

  return (
  <>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-2">
            {
              menuItems?.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => {
                      if (pathname !== item.url) {
                        navigate(item.url);
                      }
                    }}
                    className="cursor-pointer tracking-wider"
                    isActive={item.url === activeItem?.url}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            }
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </>
  );
}

export default CustomSidebarContent;