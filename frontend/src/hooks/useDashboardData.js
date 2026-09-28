import { useCallback, useEffect, useRef, useState } from "react";
import * as ds from "../services/dataService";

// Single hook feeding the whole dashboard.
// Polls the service layer (mock today, REST tomorrow). To go live-push
// later, replace the setInterval with a WebSocket/MQTT subscription
// that calls the same setState setters.
const POLL_MS = 3000;

export default function useDashboardData() {
  const [data, setData] = useState({
    rover: null, gases: [], prediction: null, map: null,
    history: [], telemetry: null, health: [], alerts: [],
    mission: null, env: null, video: null,
  });
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const refresh = useCallback(async (first = false) => {
    try {
      const [rover, gases, prediction, map, history, telemetry, health, alerts, mission, env, video] =
        await Promise.all([
          ds.getRoverStatus(), ds.getGasReadings(), ds.getGasPredictions(),
          first ? ds.getMapData() : Promise.resolve(null), // map is heavy: fetch once
          ds.getGasHistory(), ds.getTelemetry(), ds.getSystemHealth(),
          ds.getAlerts(), ds.getMissionInfo(), ds.getEnvironment(), ds.getVideoInfo(),
        ]);
      setData((d) => ({
        rover, gases, prediction, map: map ?? d.map,
        history, telemetry, health, alerts, mission, env, video,
      }));
    } catch (e) {
      console.error("dashboard refresh failed", e);
    } finally {
      if (first) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(true);
    timer.current = setInterval(() => refresh(false), POLL_MS);
    return () => clearInterval(timer.current);
  }, [refresh]);

  return { ...data, loading, refresh: () => refresh(false) };
}
