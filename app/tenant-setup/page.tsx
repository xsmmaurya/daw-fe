// /Users/xsm/Documents/workspace/xtras/daw-fe/app/tenant-setup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function TenantSetupPage() {
  const router = useRouter();
  const { user, isDriver, setUser } = useAuthStore();

  const [name, setName] = useState(
    user?.email ? `${user.email.split("@")[0]}'s Tenant` : "My Tenant"
  );
  const [slug, setSlug] = useState(
    user?.id ? `tenant-${String(user.id).slice(0, 8)}` : "tenant-demo"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    // no user in store → back to login
    if (typeof window !== "undefined") {
      router.replace("/");
    }
    return null;
  }

  const onCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      const resp = await api.post("/tenants", { name, slug });
      // Backend shape: { status, code, message, data: { id, name, slug, ... } }
      const tenant = resp.data.data;

      // 🔥 IMPORTANT: update user in store with tenant_id
      setUser({
        ...user,
        tenant_id: tenant.id,
      });

      // After tenant creation, send to correct panel
      if (isDriver) {
        router.push("/driver");
      } else {
        router.push("/rider");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 w-full max-w-md">
        <h1 className="text-xl font-semibold">Set up your Tenant</h1>
        <p className="text-sm text-slate-600">
          You&apos;re logged in as <span className="font-mono">{user.email}</span>.
          We need a tenant (org / fleet) so we can separate data.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Tenant Name</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Tenant Slug</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Slug should be unique and URL-safe. e.g. <code>bangalore-fleet</code>
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={onCreate}
          disabled={loading}
          className="px-4 py-2 rounded bg-slate-900 text-white text-sm w-full"
        >
          {loading ? "Creating..." : "Create Tenant & Continue"}
        </button>
      </div>
    </div>
  );
}
