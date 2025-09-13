import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { RoutesMeta } from "@/routes/RoutesMeta";

const getBreadcrumbSegments = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { name: string; path: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const fullPath = "/" + segments.slice(0, i + 1).join("/");

    // Only push if fullPath has a readable name in meta
    if (RoutesMeta[fullPath]) {
      breadcrumbs.push({
        name: RoutesMeta[fullPath],
        path: fullPath,
      });
    }
  }

  return breadcrumbs;
};

function CustomBreadcrumb() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const crumbs = getBreadcrumbSegments(pathname);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          {
            crumbs.map((crumb, index) => (
              <BreadcrumbItem key={crumb.path}>
                {
                index < crumbs.length - 1 
                ? (
                  <>
                    <BreadcrumbLink>
                      <button 
                        onClick={() => navigate(crumb.path)}
                        className="cursor-pointer"
                      >{crumb.name}</button>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                  ) 
                : (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  )
                }
              </BreadcrumbItem>
            ))
          }
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}

export default CustomBreadcrumb;