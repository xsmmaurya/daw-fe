// /Users/xsm/Documents/workspace/xtras/daw-fe/app/driver/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuthStore } from "@/store/authStore";
import { useDriverStore } from "@/store/driverStore";
import { useWsClient, WsNotification } from "@/hooks/useWsClient";
import api from "@/lib/api";

interface IncomingRide {
  id: string;
  status: string;
  pickup_address?: string | null;
  dest_address?: string | null;
}

interface DriverEvent {
  id: string;
  kind: string;
  payload?: any;
  created_at?: string;
}

export default function DriverPage() {
  useAuthGuard();

  const { user, logout, setUser } = useAuthStore();

  // ✅ global driver store (can be persisted with zustand/persist)
  const {
    online,
    setOnline,
    assignments,
    addAssignment,
    removeAssignment,
  } = useDriverStore();

  const [location] = useState({ lat: 12.9716, lon: 77.5946 });
  const [incomingRide, setIncomingRide] = useState<IncomingRide | null>(null);
  const [currentRide, setCurrentRide] = useState<IncomingRide | null>(null);
  const [wsEvents, setWsEvents] = useState<string[]>([]);
  const [driverEvents, setDriverEvents] = useState<DriverEvent[]>([]);
  const [busy, setBusy] = useState(false);

  const appendWsEvent = (msg: string) =>
    setWsEvents((prev) => [msg, ...prev].slice(0, 20));

  /* ----------------------- WS HANDLER ---------------------- */
  const handleWsMessage = useCallback(
    (msg: WsNotification) => {
      switch (msg.kind) {
        case "ride_assigned_to_driver": {
          const ride = msg.payload?.ride;
          if (ride) {
            // store in local UI state
            setIncomingRide({
              id: ride.id,
              status: ride.status,
              pickup_address: ride.pickup?.address,
              dest_address: ride.destination?.address,
            });

            // also store in global driverStore as an assignment
            addAssignment({
              ride_id: ride.id,
              status: ride.status,
              pickup: ride.pickup,
              destination: ride.destination,
            });

            appendWsEvent(`Incoming ride ${ride.id}`);
          }
          break;
        }

        case "ride_accepted_for_driver": {
          appendWsEvent(`Ride accepted: ${msg.payload?.ride_id}`);
          break;
        }

        case "ride_started_for_driver": {
          appendWsEvent(`Ride started: ${msg.payload?.ride_id}`);
          break;
        }

        case "ride_completed_for_driver": {
          const dist = msg.payload?.distance_km;
          const fare = msg.payload?.fare_amount;
          const rideId = msg.payload?.ride_id;

          appendWsEvent(
            `Ride completed: ${rideId} (Dist=${
              dist?.toFixed?.(2) ?? "?"
            }km Fare=${fare ?? "?"})`,
          );

          setCurrentRide(null);

          if (rideId) {
            // remove from assignments list once completed
            removeAssignment(rideId);
          }
          break;
        }

        default: {
          appendWsEvent(`WS: ${msg.kind}`);
        }
      }
    },
    [addAssignment, removeAssignment],
  );

  const { connected } = useWsClient(handleWsMessage);

  /* ---------------------- DRIVER EVENT HISTORY (DB) --------------------- */
  useEffect(() => {
    if (!user?.driver_id) return;

    const loadDriverEvents = async () => {
      try {
        const resp = await api.get(
          `/events/drivers/${user.driver_id}/events`,
          {
            headers: {
              "X-Requested-Page": "1",
              "X-Requested-Limit": "50",
            },
          },
        );

        setDriverEvents(resp.data?.data || []);
      } catch (err) {
        // silent fail is okay for now; can hook toast later
        console.error("[events] failed to load driver events", err);
      }
    };

    loadDriverEvents();
  }, [user?.driver_id]);

  /* ------------------------- API ACTIONS --------------------------- */
  const goOnline = async () => {
    setBusy(true);
    try {
      const resp = await api.post("/drivers/online", location);
      const data = resp.data?.data;

      setOnline(true);
      appendWsEvent("You are online");

      // store driver_id into user so we can fetch events by id later
      if (data?.driver_id && user) {
        setUser({
          ...user,
          driver_id: data.driver_id,
        });
      }
    } catch (err) {
      console.error("[driver] goOnline failed", err);
    } finally {
      setBusy(false);
    }
  };

  const goOffline = async () => {
    setBusy(true);
    try {
      await api.post("/drivers/offline");
      setOnline(false);
      appendWsEvent("You are offline");
    } catch (err) {
      console.error("[driver] goOffline failed", err);
    } finally {
      setBusy(false);
    }
  };

  const acceptRide = async () => {
    if (!incomingRide) return;
    setBusy(true);
    try {
      const id = incomingRide.id;
      const resp = await api.post(`/rides/${id}/accept`);
      const ride = resp.data?.data;

      setCurrentRide({
        id: ride.id,
        status: ride.status,
        pickup_address: ride.pickup_address,
        dest_address: ride.dest_address,
      });

      setIncomingRide(null);
    } catch (err) {
      console.error("[driver] acceptRide failed", err);
    } finally {
      setBusy(false);
    }
  };

  const rejectRide = async () => {
    if (!incomingRide) return;
    setBusy(true);
    try {
      const id = incomingRide.id;
      await api.post(`/rides/${id}/reject`);
      setIncomingRide(null);

      // you might want to remove from assignments as well
      removeAssignment(id);
    } catch (err) {
      console.error("[driver] rejectRide failed", err);
    } finally {
      setBusy(false);
    }
  };

  const startRide = async () => {
    if (!currentRide) return;
    setBusy(true);
    try {
      const resp = await api.post(`/rides/${currentRide.id}/start`);
      const ride = resp.data?.data;

      setCurrentRide((prev) =>
        prev ? { ...prev, status: ride.status } : prev,
      );
    } catch (err) {
      console.error("[driver] startRide failed", err);
    } finally {
      setBusy(false);
    }
  };

  const completeRide = async () => {
    if (!currentRide) return;
    setBusy(true);
    try {
      const resp = await api.post(`/rides/${currentRide.id}/complete`);
      const ride = resp.data?.data;

      setCurrentRide((prev) =>
        prev ? { ...prev, status: ride.status } : prev,
      );

      // Completion WS event will also remove assignment via handler
    } catch (err) {
      console.error("[driver] completeRide failed", err);
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------- UI ---------------------------- */
  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Driver Panel</h1>
          <p className="text-xs text-slate-500">
            Logged in as {user?.email ?? user?.id}
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              connected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            WS: {connected ? "Connected" : "Disconnected"}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded bg-slate-900 text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        {/* Online/Offline */}
        <section className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Availability</h2>
            <p className="text-xs text-slate-500">
              {online ? "You are online" : "You are offline"}
            </p>
          </div>

          <button
            onClick={online ? goOffline : goOnline}
            disabled={busy}
            className={`px-4 py-2 rounded text-sm ${
              online
                ? "bg-red-600 text-white"
                : "bg-emerald-600 text-white"
            } disabled:opacity-60`}
          >
            {online ? "Go Offline" : "Go Online"}
          </button>
        </section>

        {/* Incoming Ride */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">Incoming Ride</h2>
          {incomingRide ? (
            <div className="border rounded p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Ride ID</span>
                <span className="font-mono text-xs">{incomingRide.id}</span>
              </div>

              <div className="flex justify-between">
                <span>Pickup</span>
                <span>{incomingRide.pickup_address ?? "Pickup"}</span>
              </div>

              <div className="flex justify-between">
                <span>Destination</span>
                <span>{incomingRide.dest_address ?? "Destination"}</span>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={acceptRide}
                  disabled={busy}
                  className="px-3 py-1 rounded bg-emerald-600 text-white text-xs"
                >
                  Accept
                </button>

                <button
                  onClick={rejectRide}
                  disabled={busy}
                  className="px-3 py-1 rounded bg-red-600 text-white text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No incoming ride. You&apos;ll see requests here when dispatch
              assigns you.
            </p>
          )}
        </section>

        {/* Current Ride */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">Current Ride</h2>
          {currentRide ? (
            <div className="border rounded p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Ride ID</span>
                <span className="font-mono text-xs">{currentRide.id}</span>
              </div>

              <div className="flex justify-between">
                <span>Status</span>
                <span className="capitalize">{currentRide.status}</span>
              </div>

              <div className="flex justify-between">
                <span>Pickup</span>
                <span>{currentRide.pickup_address ?? "Pickup"}</span>
              </div>

              <div className="flex justify-between">
                <span>Destination</span>
                <span>{currentRide.dest_address ?? "Destination"}</span>
              </div>

              <div className="flex gap-3 mt-2">
                {currentRide.status === "accepted" && (
                  <button
                    onClick={startRide}
                    disabled={busy}
                    className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
                  >
                    Start Ride
                  </button>
                )}

                {currentRide.status === "in_progress" && (
                  <button
                    onClick={completeRide}
                    disabled={busy}
                    className="px-3 py-1 rounded bg-emerald-600 text-white text-xs"
                  >
                    Complete Ride
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No active ride.</p>
          )}
        </section>

        {/* Assignments from driverStore (WS-driven history) */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-sm">
            Assignments (recent, from WebSocket)
          </h2>
          {assignments.length === 0 ? (
            <p className="text-xs text-slate-400">
              No assignments yet. When you get rides, they&apos;ll appear here.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {assignments.map((a) => (
                <li
                  key={a.ride_id}
                  className="border rounded px-3 py-2 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold capitalize">
                      {a.status || "assigned"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {a.pickup?.address || "Pickup"} →{" "}
                      {a.destination?.address || "Destination"}
                    </div>
                  </div>
                  <div className="font-mono text-[10px]">{a.ride_id}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* History From DB (driver_events table) */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-sm">History (Driver Events)</h2>

          {!user?.driver_id ? (
            <p className="text-xs text-slate-400">
              Go online at least once to start recording driver events.
            </p>
          ) : driverEvents.length === 0 ? (
            <p className="text-xs text-slate-400">No events recorded yet.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {driverEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex justify-between text-slate-600"
                >
                  <span className="font-mono text-[10px] uppercase">
                    {ev.kind}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {ev.created_at
                      ? new Date(ev.created_at).toLocaleString()
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Live WS Events (raw log) */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2 text-sm">Live WebSocket Events</h2>
          {wsEvents.length === 0 ? (
            <p className="text-xs text-slate-400">No events yet.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {wsEvents.map((e, idx) => (
                <li key={idx} className="text-slate-600">
                  • {e}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
