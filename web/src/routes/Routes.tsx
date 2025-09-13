import App from "@/App";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminProfile from "@/pages/admin/pages/AdminProfile";
import AdminSettings from "@/pages/admin/pages/AdminSettings";
import Analytics from "@/pages/admin/pages/Analytics";
import Chat from "@/pages/admin/pages/Chat";
import Comment from "@/pages/admin/pages/Comment";
import Notification from "@/pages/admin/pages/Notification";
import Post from "@/pages/admin/pages/Post";
import Report from "@/pages/admin/pages/Report";
import User from "@/pages/admin/pages/User";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },

  // Auth routes
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />
  },

  // Admin routes
  {
    path: "/admin/dashboard",
    element: <AdminLayout />,
    children: [
      {
        path: "users",
        element: <User />
      },
      {
        path: "posts",
        element: <Post />
      },
      {
        path: "comments",
        element: <Comment />
      },
      {
        path: "reports",
        element: <Report />
      },
      {
        path: "analytics",
        element: <Analytics />
      },
      {
        path: "notifications",
        element: <Notification />
      },
      {
        path: "chat",
        element: <Chat />,
        children: [
          
        ]
      },
      {
        path: "profile",
        element: <AdminProfile />
      },
      {
        path: "settings",
        element: <AdminSettings />
      },
    ]
  }

]);

const Routes = () => {
  return (
    <RouterProvider router={router} />
  );
}

export default Routes;