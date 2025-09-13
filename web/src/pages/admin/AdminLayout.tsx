import { Button } from '@/components/ui/button';
import { 
  Sidebar, 
  SidebarProvider, 
  useSidebar
} from '@/components/ui/sidebar';
import { AlignLeft, ArrowLeft, ArrowRight } from 'lucide-react';
import CustomSidebarHeader from './components/CustomSidebarHeader';
import CustomSidebarContent from './components/CustomSidebarContent';
import CustomSidebarFooter from './components/CustomSidebarFooter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import CustomBreadcrumb from '@/components/shared/CustomBreadcrumb';
import { Outlet, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

function AdminLayout() {

  return (
    <>
      <SidebarProvider>
        <DashboardLayout />
      </SidebarProvider>
    </>
  )
}

function DashboardLayout() {
  const { open, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  return (
    <>
      <Sidebar 
        variant="floating" 
        collapsible="icon"
      >  
        <CustomSidebarHeader />

        <Separator />

        <CustomSidebarContent />

        <CustomSidebarFooter />
      </Sidebar>

      {/* Main section */}
      <section className="w-full h-screen pl-0 p-2">
        <div
          className="h-full rounded-lg border"
        >
          {/* Top bar */}
          <div>
            {/* Sidebar toggler */}
            <div className="px-4 py-2">
              <TooltipProvider>
                <Tooltip>
                  <div 
                    onClick={() => toggleSidebar()}
                    className="px-1.5 py-1 w-fit rounded-md hover:bg-slate-200 dark:hover:bg-slate-900 transition-all duration-200 ease-out cursor-pointer"
                  >
                    <TooltipTrigger asChild>
                      {/* <SidebarTrigger /> */}
                      <AlignLeft />
                    </TooltipTrigger>
                  </div>
                  <TooltipContent side="right">
                    {
                      open ? "Close Sidebar" : "Open Sidebar"
                    }
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Breadcrumb */}
            <div className="px-4 py-2">
              <CustomBreadcrumb />
            </div>
          </div>

          {/* Top navbar */}
          <nav className="px-4 py-2 sticky top-0 flex items-center justify-between backdrop-blur-md bg-slate-200 dark:bg-slate-900">
            <Button 
              onClick={() => navigate(-1)}
              variant="secondary"
              className="cursor-pointer"
            >
              <ArrowLeft />
            </Button>
            <Button 
              onClick={() => navigate(+1)}
              variant="secondary"
              className="cursor-pointer"
            >
              <ArrowRight />
            </Button>
          </nav>

          {/* Dynamic screens */}
          <main className="h-[75vh]">
            <ScrollArea className="flex-1 h-full">
              {
                <div className='px-4 py-2'>
                  <Outlet />
                </div>
              }
            </ScrollArea>
          </main>

        </div>
      </section>
    </>
  );
}

export default AdminLayout;