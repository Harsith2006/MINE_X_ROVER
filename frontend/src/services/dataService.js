// dataService.js — thin pass-through over services/api.js.
// Components/hooks call THESE functions (never api.js or mockData directly),
// so if endpoint shapes change you can normalise/adapt in exactly one place.
import * as api from "./api";

export const getRoverStatus    = () => api.getRoverStatus();
export const getGasReadings    = () => api.getGasReadings();
export const getGasPredictions = () => api.getGasPredictions();
export const getMapData        = () => api.getMapData();
export const getGasHistory     = () => api.getGasHistory();
export const getTelemetry      = () => api.getTelemetry();
export const getSystemHealth   = () => api.getSystemHealth();
export const getAlerts         = () => api.getAlerts();
export const getMissionInfo    = () => api.getMissionInfo();
export const getEnvironment    = () => api.getEnvironment();
export const getVideoInfo      = () => api.getVideoInfo();
