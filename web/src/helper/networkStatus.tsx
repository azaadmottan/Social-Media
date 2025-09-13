import { Loader } from "lucide-react";
import toast from "react-hot-toast";

let networkToastId: string | undefined;

export const checkNetworkStatus = () => {
  if (!navigator?.onLine) {
    // Show loading toast if not already shown
    if (!networkToastId) {
      networkToastId = toast.loading("No internet, please check your connection!", {
        icon: <Loader className="animate-spin" />,
        duration: Infinity,
      });
    }

    // Listen for when the internet comes back
    const removeToastOnReconnect = () => {
      if (networkToastId) {
        toast.remove(networkToastId);
        networkToastId = undefined;
      }
      window.removeEventListener("online", removeToastOnReconnect);
    };

    window.addEventListener("online", removeToastOnReconnect);
    return false;
  }

  return true;
};