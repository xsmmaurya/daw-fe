"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <button
      onClick={onLogout}
      className="px-3 py-1 text-sm rounded border border-slate-300 hover:bg-slate-100"
    >
      Logout
    </button>
  );
}
