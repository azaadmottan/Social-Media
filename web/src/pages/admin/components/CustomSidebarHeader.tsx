import Logo from "@/components/shared/Logo";
import { 
  SidebarHeader,
} from "@/components/ui/sidebar";

function CustomSidebarHeader() {

  return (
  <>
    <SidebarHeader className="w-full h-16 flex flex-row items-center">
      <div className="flex items-end gap-2">
        <Logo isMainLogo={false} />
      </div>
    </SidebarHeader>
  </>
  );
}

export default CustomSidebarHeader;