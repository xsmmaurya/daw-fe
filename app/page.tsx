// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const router = useRouter();
  const { setUser, setToken, setIsDriver, isDriver, token, isHydrated, user } =
    useAuthStore();
  const [step, setStep] = useState<"enter" | "verify">("enter");
  const [identifier, setIdentifier] = useState("test@example.com");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, send to correct panel or tenant setup
  useEffect(() => {
    if (!isHydrated) return;
    if (!token) return;

    if (!user?.tenant_id) {
      router.replace("/tenant-setup");
    } else {
      router.replace(isDriver ? "/driver" : "/rider");
    }
  }, [isHydrated, token, user, isDriver, router]);

  const onSendOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post("/auth/otp/send", { identifier, driver: isDriver });
      setStep("verify");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    try {
      setLoading(true);
      setError(null);

      const resp = await api.post("/auth/otp/verify", {
        identifier,
        otp,
        driver: isDriver,
      });

      // ⚠️ Adjust this based on your real backend shape.
      // If backend returns { status, code, message, data: { user, token } }
      // then use resp.data.data instead of resp.data.
      const { user, token } = resp.data.data ?? resp.data;

      if (!user || !token) {
        throw new Error("Invalid auth response (user/token missing)");
      }

      setUser(user);
      setToken(token);

      // New user without tenant → go to tenant setup
      if (!user.tenant_id) {
        router.push("/tenant-setup");
        return;
      }

      // Existing user with tenant → go straight to panel
      if (isDriver) router.push("/driver");
      else router.push("/rider");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-semibold">Login with OTP</h1>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Email / Identifier</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={step === "verify"}
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDriver}
            onChange={(e) => setIsDriver(e.target.checked)}
          />
          <span>Are you a driver?</span>
        </label>

        {step === "verify" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">OTP</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          {step === "enter" ? (
            <button
              onClick={onSendOtp}
              className="px-4 py-2 rounded bg-slate-900 text-white text-sm"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <button
              onClick={onVerifyOtp}
              className="px-4 py-2 rounded bg-slate-900 text-white text-sm"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
