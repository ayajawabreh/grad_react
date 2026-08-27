import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { SyncListener } from "../sync/SyncListener";

export default function App() {
  return (
    <AuthProvider>
      <SyncListener />
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
