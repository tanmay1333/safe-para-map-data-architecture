import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import "leaflet.heat";

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

import { db } from "./firebase";

/* =========================
   COLOR & SEVERITY
========================= */
const getColor = (type) => {
  switch (type) {
    case "Harassment Spot": return "#ff4d4d";
    case "Dark Alley": return "#9b59b6";
    case "Unsafe Road": return "#e67e22";
    case "Stray Dogs": return "#795548";
    default: return "#3498db";
  }
};

const getSeverity = (type) => {
  switch (type) {
    case "Harassment Spot": return 3;
    case "Dark Alley": return 2;
    case "Unsafe Road": return 1.5;
    case "Stray Dogs": return 1;
    default: return 1;
  }
};

/* =========================
   MAP CLICK HANDLER
========================= */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

/* =========================
   HEATMAP LAYER
========================= */
function HeatmapLayer({ points }) {
  const map = useMapEvents({});

  useEffect(() => {
    if (!map || points.length === 0) return;

    const layer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.2: "blue",
        0.4: "lime",
        0.6: "yellow",
        0.8: "orange",
        1.0: "red"
      }
    }).addTo(map);

    return () => map.removeLayer(layer);
  }, [map, points]);

  return null;
}

/* =========================
   MAIN APP
========================= */
export default function App() {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState(null);
  const [reportType, setReportType] = useState("Dark Alley");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  /* =========================
     GEOLOCATION
  ========================= */
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => console.warn("Location permission denied")
    );
  }, []);

  /* =========================
     FIRESTORE REALTIME
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setReports(data);
    });

    return () => unsub();
  }, []);

  /* =========================
     SAVE REPORT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReport) return;

    await addDoc(collection(db, "reports"), {
      lat: newReport.lat,
      lng: newReport.lng,
      type: reportType,
      createdAt: serverTimestamp()
    });

    setNewReport(null);
  };

  const heatPoints = reports.map((r) => [
    r.lat,
    r.lng,
    getSeverity(r.type)
  ]);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>

      {/* TOGGLE */}
      <button
        onClick={() => setShowHeatmap((p) => !p)}
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          zIndex: 9999,
          padding: "10px 14px",
          borderRadius: "8px",
          border: "none",
          background: "#2c3e50",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        {showHeatmap ? "Show Markers" : "Show Heatmap"}
      </button>

      {/* ✅ FIXED LEGEND */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "12px",
          zIndex: 9999,
          backgroundColor: "#ffffff",
          padding: "14px 16px",
          borderRadius: "10px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          fontSize: "14px",
          fontFamily: "Arial, sans-serif",
          color: "#111",
          border: "2px solid #ccc",
          minWidth: "170px"
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "10px",
            fontSize: "15px",
            borderBottom: "1px solid #ddd",
            paddingBottom: "6px"
          }}
        >
          Safety Issue Legend
        </div>

        {[
          ["Harassment Spot", "#ff4d4d"],
          ["Dark Alley", "#9b59b6"],
          ["Unsafe Road", "#e67e22"],
          ["Stray Dogs", "#795548"]
        ].map(([label, color]) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#111"
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: color,
                border: "1px solid #333"
              }}
            />
            {label}
          </div>
        ))}
      </div>

      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : [22.5726, 88.3639]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapClickHandler onMapClick={setNewReport} />

        {showHeatmap && <HeatmapLayer points={heatPoints} />}

        {!showHeatmap &&
          reports.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.lat, r.lng]}
              radius={8}
              pathOptions={{
                fillColor: getColor(r.type),
                color: "#fff",
                weight: 2,
                fillOpacity: 0.9
              }}
            >
              <Popup>{r.type}</Popup>
            </CircleMarker>
          ))}

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={10}
            pathOptions={{
              color: "#0066ff",
              fillColor: "#0066ff",
              fillOpacity: 1
            }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        )}

        {newReport && (
          <CircleMarker
            center={[newReport.lat, newReport.lng]}
            radius={10}
            pathOptions={{ color: "black", dashArray: "5,5" }}
          >
            <Popup>
              <form onSubmit={handleSubmit}>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="Dark Alley">Dark Alley</option>
                  <option value="Unsafe Road">Unsafe Road</option>
                  <option value="Harassment Spot">Harassment Spot</option>
                  <option value="Stray Dogs">Stray Dogs</option>
                </select>
                <br /><br />
                <button type="submit">Confirm</button>
              </form>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
