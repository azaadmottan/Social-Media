import Logo from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { io } from "socket.io-client";
import { loginSchema } from "./schema/loginSchema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/helper/getMessage";
import { EyeIcon, EyeOffIcon, Loader } from "lucide-react";
import { useLoginUserMutation } from "@/redux/features/auth/authApi";
import { checkNetworkStatus } from "@/helper/networkStatus";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/features/auth/authSlice";
import { API_ENDPOINT } from "@/constants/apiEndpoint";
import { initSocket } from "@/helper/socket";


type LoginForm = z.infer<typeof loginSchema>;

function Login() {
  const navigate = useNavigate();

  // const socket = io("http://localhost:8080" as string, {
  //   // withCredentials: true,
  //   autoConnect: false,
  //   auth: {
  //     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2N2NkODEwZDg3MjNjYjBmMDdjYTgxNGMiLCJ1c2VyTmFtZSI6InNhY2hpbiIsImVtYWlsIjoic2FjaGlud2MyNDY4QGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NjQ2NjU0MywiZXhwIjoxNzQ2NTUyOTQzfQ.A0KSOJbClUKYyU7hHnjTPb2Vt432_RrBPCVMkECT8WA", // or wherever you store the token
  //   },
  // });

  // useEffect(() => {
  //   socket.connect();

  //   socket.on("connect", () => {
  //     console.log("Socket connected:", socket.id);
  //   });

  //   socket.on("joinRoomListener", (data) => {
  //     console.log("Join room:", data);
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  // const handleJoinRoom = () => {
  //   socket.emit("joinRoom", { roomID: "test-room-id" });
  // };

  const dispatch = useDispatch();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      if (!checkNetworkStatus()) return;

      const response = await loginUser(data).unwrap();
      if (response?.success) {
        toast.success(response?.message || "Login successful!");
        dispatch(setUser(response?.data));
        initSocket(response?.data?.token?.accessToken);

        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      const errorData = error?.data;
      if (errorData?.message) {
        toast.error(errorData.message);
      } else {
        toast.error("Something went wrong!");
      }

      // Handle nested errors
      // if (Array.isArray(errorData?.errors)) {
      //   errorData.errors.forEach((err: any) =>
      //     toast.error(`${err.field}: ${err.message}`)
      //   );
      // } 
    }
  };

  const onError = (formErrors: any) => {
    const errorMessage = getErrorMessage(formErrors);
    toast.error(errorMessage);
  };

  return (
    <>
    <div className="flex min-h-full flex-col justify-center py-4 lg:px-8 px-2">
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md border-[1.5px] border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-6 rounded-md">
        {/* Top section */}
        <div className="flex flex-col gap-2">
          <Logo />
          <h2 className="text-2xl font-medium">Hi, Welcome Back! 👋<br />Glad to see you again!</h2>
          <p className="text-base font-light">Enter your login information to continue</p>
        </div>

        {/* Form section */}
        <form 
          onSubmit={handleSubmit(onSubmit, onError)}
          method="POST">
          <div className="mt-10 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username / email</Label>
              <Input 
                id="identifier" 
                placeholder="Enter your username"
                { ...register("identifier") }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={`${showPassword ? "text" : "password"}`}
                  placeholder="Enter your password"
                  autoComplete="off"
                  { ...register("password") }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <EyeOffIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
            </div>
            <Button 
              // onClick={() => navigate("/admin/dashboard")}
              className="mt-4 cursor-pointer"
              type="submit"
              variant={"gradient"}
              disabled={isLoading}
            >
              {
                isLoading
                ? <span className="flex items-center gap-2">
                  <Loader className="animate-spin" /> Logging in...
                </span>
                : "Login"
              }
            </Button>
          </div>
        </form>

        {/* Bottom section */}
        <p className="mt-4 text-base font-light">Don't have an account? <Link to={"/register"} className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500">Sign Up</Link></p>
      </div>
    </div>
    </>
  )
}

export default Login; 