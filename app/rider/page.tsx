"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuthStore } from "@/store/authStore";
import { useWsClient, WsNotification } from "@/hooks/useWsClient";
import api from "@/lib/api";

interface Ride {
  id: string;
  status: string;
  pickup_address?: string | null;
  dest_address?: string | null;
}

interface RideEvent {
  id: string;
  kind: string;
  payload?: any;
  created_at?: string;
}

export default function RiderPage() {
  useAuthGuard();
  const { user, logout } = useAuthStore();

  const [rides, setRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [rideEvents, setRideEvents] = useState<RideEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsEvents, setWsEvents] = useState<string[]>([]);

  const appendWsEvent = (msg: string) =>
    setWsEvents((prev) => [msg, ...prev].slice(0, 20));

  /* ------------------------ WS HANDLER ----------------------- */
  const handleWsMessage = useCallback((msg: WsNotification) => {
    switch (msg.kind) {
      case "ride_assigned":
        appendWsEvent("Driver assigned to your ride");
        break;

      case "ride_accepted":
        appendWsEvent("Driver accepted your ride");
        break;

      case "ride_started":
        appendWsEvent("Ride started");
        break;

      case "ride_completed": {
        const dist = msg.payload?.distance_km;
        const fare = msg.payload?.fare_amount;
        appendWsEvent(
          `Ride completed. Distance=${dist?.toFixed?.(2) ??
            "?"} km Fare=${fare ?? "?"}`
        );
        break;
      }

      case "ride_rejected_by_driver":
        appendWsEvent("Driver rejected your ride");
        break;

      default:
        appendWsEvent(`WS: ${msg.kind}`);
    }
  }, []);

  const { connected } = useWsClient(handleWsMessage);

  /* ------------------------ LOAD RIDES ------------------------ */
  const loadRides = async () => {
    try {
      const resp = await api.get("/rides", { params: { limit: 10, offset: 0 } });
      const list: Ride[] = resp.data?.data?.rides || [];
      setRides(list);
      setCurrentRide(list[0] ?? null);
    } catch {}
  };

  useEffect(() => {
    loadRides();
  }, []);

  /* -------------------- LOAD RIDE TIMELINE -------------------- */
  useEffect(() => {
    if (!currentRide) {
      setRideEvents([]);
      return;
    }

    const fetchEvents = async () => {
      try {
        const resp = await api.get(`/events/rides/${currentRide.id}/events`, {
          headers: {
            "X-Requested-Page": "1",
            "X-Requested-Limit": "50",
          },
        });

        setRideEvents(resp.data?.data || []);
      } catch {}
    };

    fetchEvents();
  }, [currentRide?.id]);

  /* ------------------------ REQUEST RIDE ---------------------- */
  const onRequestRide = async () => {
    setLoading(true);
    try {
      const resp = await api.post("/rides/request", {
        pickup: {
          lat: 12.9716,
          lon: 77.5946,
          address: "Pickup",
        },
        destination: {
          lat: 12.9352,
          lon: 77.6245,
          address: "Destination",
        },
        tier: "standard",
        payment_method_id: "card-1",
      });

      const ride = resp.data?.data?.ride;
      if (ride) {
        setCurrentRide(ride);
        setRides((prev) => [ride, ...prev]);
        setRideEvents([]);
      }
    } catch {}
    setLoading(false);
  };

  /* ---------------------------- UI ---------------------------- */
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Rider Panel</h1>
          <p className="text-xs text-slate-500">
            Logged in as {user?.email ?? user?.id}
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              connected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
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

        {/* Request Ride */}
        <section className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Request a Ride</h2>
            <button
              onClick={onRequestRide}
              disabled={loading}
              className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-60"
            >
              {loading ? "Requesting..." : "Request Ride"}
            </button>
          </div>

          {currentRide ? (
            <div className="mt-3 border rounded p-3 text-sm">
              <div className="flex justify-between">
                <span>Ride ID</span>
                <span className="font-mono text-xs">{currentRide.id}</span>
              </div>

              <div className="flex justify-between mt-1">
                <span>Status</span>
                <span className="capitalize">{currentRide.status}</span>
              </div>

              <div className="flex justify-between mt-1">
                <span>Pickup</span>
                <span>{currentRide.pickup_address}</span>
              </div>

              <div className="flex justify-between mt-1">
                <span>Destination</span>
                <span>{currentRide.dest_address}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              No ride yet. Click request to start.
            </p>
          )}
        </section>

        {/* Rides List */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Recent Rides</h2>

          {rides.length === 0 ? (
            <p className="text-sm text-slate-500">No rides yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {rides.map((r) => (
                <li
                  key={r.id}
                  onClick={() => setCurrentRide(r)}
                  className="border rounded p-2 cursor-pointer hover:bg-slate-50 transition flex justify-between"
                >
                  <div>
                    <div className="font-semibold capitalize">{r.status}</div>
                    <div className="text-xs text-slate-500">
                      {r.pickup_address} → {r.dest_address}
                    </div>
                  </div>
                  <div className="font-mono text-[10px]">{r.id}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ride Timeline */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3 text-sm">Ride Timeline</h2>

          {!currentRide ? (
            <p className="text-xs text-slate-400">
              Select a ride to view the event timeline.
            </p>
          ) : rideEvents.length === 0 ? (
            <p className="text-xs text-slate-400">
              No events recorded for this ride yet.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {rideEvents.map((ev) => (
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

        {/* Live WS Events */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3 text-sm">Live Events</h2>

          {wsEvents.length === 0 ? (
            <p className="text-xs text-slate-400">No events yet.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {wsEvents.map((e, idx) => (
                <li key={idx} className="text-slate-600">• {e}</li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </main>
  );
}
