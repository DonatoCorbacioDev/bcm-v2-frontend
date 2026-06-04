import axios from "axios";

const FORECAST_URL = process.env.NEXT_PUBLIC_FORECAST_URL ?? "http://localhost:8000";

export const forecastApi = axios.create({
  baseURL: FORECAST_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

// Expected FastAPI contract:
//
// GET /forecast?months=3|6
// { historical: [{month: "2024-01", amount: 15000}],
//   forecast:   [{month: "2024-04", amount: 16500, lower: 14000, upper: 19000}] }
//
// GET /risk-scores
// [{ contractId: 1, customerName: "Acme", riskScore: 0.75,
//    level: "HIGH"|"MEDIUM"|"LOW", anomalies: string[] }]
