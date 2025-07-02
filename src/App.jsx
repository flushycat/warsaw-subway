import { useState, useEffect, useRef } from "react";
import MetroMap from "./warsaw-metro-map.svg?react";

// Add line property for each station for M1/M2 categorizing
const stations = [
  { id: "station-bemowo", name: "Bemowo", line: "M2" },
  { id: "station-urlychow", name: "Urlychów", line: "M2" },
  { id: "station-ksiecia-janusza", name: "Księcia Janusza", line: "M2" },
  { id: "station-mlynow", name: "Młynów", line: "M2" },
  { id: "station-plocka", name: "Płocka", line: "M2" },
  { id: "station-rondo-daszynskiego", name: "Rondo Daszyńskiego", line: "M2" },
  { id: "station-rondo-onz", name: "Rondo ONZ", line: "M2" },
  // Split Świętokrzyska into two virtual stations
  { id: "station-swietokrzyska-m1", name: "Świętokrzyska", line: "M1" },
  { id: "station-swietokrzyska-m2", name: "Świętokrzyska", line: "M2" },
  { id: "station-nowy-swiat-uniwersytet", name: "Nowy Świat-Uniwersytet", line: "M2" },
  { id: "station-centrum-nauki-kopernik", name: "Centrum Nauki Kopernik", line: "M2" },
  { id: "station-stadion-narodowy", name: "Stadion Narodowy", line: "M2" },
  { id: "station-dworzec-wilenski", name: "Dworzec Wileński", line: "M2" },
  { id: "station-szwedzka", name: "Szwedzka", line: "M2" },
  { id: "station-targowek-mieszkaniowy", name: "Targówek Mieszkaniowy", line: "M2" },
  { id: "station-trocka", name: "Trocka", line: "M2" },
  { id: "station-kondratowicza", name: "Kondratowicza", line: "M2" },
  { id: "station-zacisze", name: "Zacisze", line: "M2" },
  { id: "station-brodno", name: "Bródno", line: "M2" },

  { id: "station-mlociny", name: "Młociny", line: "M1" },
  { id: "station-wawrzyszew", name: "Wawrzyszew", line: "M1" },
  { id: "station-stare-bielany", name: "Stare Bielany", line: "M1" },
  { id: "station-slodowiec", name: "Słodowiec", line: "M1" },
  { id: "station-marymont", name: "Marymont", line: "M1" },
  { id: "station-plac-wilsona", name: "Plac Wilsona", line: "M1" },
  { id: "station-dworzec-gdanski", name: "Dworzec Gdański", line: "M1" },
  { id: "station-ratusz-arsenal", name: "Ratusz Arsenał", line: "M1" },
  { id: "station-politechnika", name: "Politechnika", line: "M1" },
  { id: "station-pole-mokotowskie", name: "Pole Mokotowskie", line: "M1" },
  { id: "station-raclawicka", name: "Racławicka", line: "M1" },
  { id: "station-wierzbno", name: "Wierzbno", line: "M1" },
  { id: "station-wilanowska", name: "Wilanowska", line: "M1" },
  { id: "station-sluzew", name: "Służew", line: "M1" },
  { id: "station-ursynow", name: "Ursynów", line: "M1" },
  { id: "station-stoklosy", name: "Stokłosy", line: "M1" },
  { id: "station-natolin", name: "Kabaty", line: "M1" },
  { id: "station-kabaty", name: "Kabaty", line: "M1" }
];

function getDefaultStatus() {
  const obj = {};
  stations.forEach(s => {
    obj[s.id] = { working: true, reports: [] };
  });
  return obj;
}

const STATUS_KEY = "warsaw-metro-station-status";
const THRESHOLD_KEY = "warsaw-metro-threshold";

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [autoVerifyThreshold, setAutoVerifyThreshold] = useState(() => {
    const saved = localStorage.getItem(THRESHOLD_KEY);
    return saved ? Number(saved) : 3;
  });
  const [thresholdInput, setThresholdInput] = useState(autoVerifyThreshold);
  const [stationStatus, setStationStatus] = useState(() => {
    const saved = localStorage.getItem(STATUS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const def = getDefaultStatus();
        for (const id in def) {
          if (!parsed[id]) parsed[id] = def[id];
          if (parsed[id] && !Array.isArray(parsed[id].reports)) {
            parsed[id].reports = [];
          }
        }
        return parsed;
      } catch {
        return getDefaultStatus();
      }
    }
    return getDefaultStatus();
  });
  const [userId] = useState(() => "user" + Math.floor(Math.random() * 100000));
  const [selectedStation, setSelectedStation] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("warsaw-metro-theme") || "dark");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const observerRef = useRef(null);

  // Theme colors
  const colors = theme === "dark"
    ? {
        bg: "#181818",
        card: "#222",
        text: "#fff",
        accent: "#1976d2",
        border: "#444",
        tableRow: "#2e7d32",
        tableRowInactive: "#b71c1c",
        stationActive: "#263238",
        stationInactive: "#b71c1c",
        dotActive: "#43d16d",
        dotInactive: "#e53935",
        notWorkingBg: "#b71c1c",
        notWorkingText: "#fff"
      }
    : {
        bg: "#f5f5f5",
        card: "#fff",
        text: "#222",
        accent: "#1976d2",
        border: "#bbb",
        tableRow: "#e8f5e9",
        tableRowInactive: "#ffebee",
        stationActive: "#e3f2fd",
        stationInactive: "#ffcdd2",
        dotActive: "#43d16d",
        dotInactive: "#e53935",
        notWorkingBg: "#ffcdd2",
        notWorkingText: "#b71c1c"
      };

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(stationStatus));
  }, [stationStatus]);

  useEffect(() => {
    localStorage.setItem(THRESHOLD_KEY, String(autoVerifyThreshold));
  }, [autoVerifyThreshold]);

  useEffect(() => {
    localStorage.setItem("warsaw-metro-theme", theme);
  }, [theme]);

  function toggleStation(id) {
    if (!isAdmin) return;
    setStationStatus(prev => ({
      ...prev,
      [id]: { ...prev[id], working: !prev[id].working }
    }));
  }

  function reportStation(id) {
    setStationStatus(prev => {
      const prevReports = prev[id].reports;
      if (prevReports.includes(userId)) return prev;
      const reports = [...prevReports, userId];
      const working = reports.length >= autoVerifyThreshold ? false : prev[id].working;
      return {
        ...prev,
        [id]: { working, reports }
      };
    });
  }

  function verifyStation(id) {
    setStationStatus(prev => ({
      ...prev,
      [id]: { ...prev[id], working: false, reports: [] } // Clear reports after verifying
    }));
  }

  // Helper: get station ids in order
  const stationIdsInOrder = stations.map(s => s.id);

  // Report a range of stations as not working
  function reportRange(startId, endId) {
    if (!startId || !endId) return;
    const startIdx = stationIdsInOrder.indexOf(startId);
    const endIdx = stationIdsInOrder.indexOf(endId);
    if (startIdx === -1 || endIdx === -1) return;
    const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const idsToReport = stationIdsInOrder.slice(from, to + 1);
    setStationStatus(prev => {
      const updated = { ...prev };
      idsToReport.forEach(id => {
        if (
          updated[id].working &&
          !updated[id].reports.includes(userId)
        ) {
          const reports = [...updated[id].reports, userId];
          const working = reports.length >= autoVerifyThreshold ? false : updated[id].working;
          updated[id] = { ...updated[id], reports, working };
        }
      });
      return updated;
    });
  }

  // --- SVG coloring: update instantly, even if SVG loads after render ---
  useEffect(() => {
    function colorStations() {
      stations.forEach(station => {
        let svgId = station.id;
        if (svgId === "station-swietokrzyska-m1" || svgId === "station-swietokrzyska-m2") {
          svgId = "station-swietokrzyska";
        }
        const el = document.querySelector(`circle#${svgId}`);
        if (el) {
          // If both are working, green; if either is not working, red
          if (svgId === "station-swietokrzyska") {
            const m1 = stationStatus["station-swietokrzyska-m1"]?.working !== false;
            const m2 = stationStatus["station-swietokrzyska-m2"]?.working !== false;
            el.setAttribute("fill", m1 && m2 ? colors.dotActive : colors.dotInactive);
          } else {
            el.setAttribute("fill", stationStatus[station.id].working ? colors.dotActive : colors.dotInactive);
          }
          // Use a much lighter outline for dark theme, normal for light theme
          el.setAttribute("stroke", theme === "dark" ? "#eee" : "#222");
          el.setAttribute("stroke-width", "0.5");
        }
      });
    }
    colorStations();
    if (observerRef.current) observerRef.current.disconnect();
    const svg = document.querySelector("svg");
    if (svg) {
      observerRef.current = new MutationObserver(colorStations);
      observerRef.current.observe(svg, { childList: true, subtree: true });
    }
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [stationStatus, theme]);

  // Categorize stations by line
  const m1Stations = stations.filter(s => s.line === "M1");
  const m2Stations = stations.filter(s => s.line === "M2");
  const notWorkingStations = stations.filter(s => !stationStatus[s.id].working);

  // --- USER VIEW ---
  if (!isAdmin) {
    return (
      <div
        style={{
          fontFamily: "sans-serif",
          background: colors.bg,
          minHeight: "100vh",
          minWidth: 0,
          width: "100vw",
          margin: 0,
          padding: 0,
          transition: "background 0.2s",
          boxSizing: "border-box",
          overflowX: "hidden"
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              background: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              padding: "4px 14px",
              cursor: "pointer"
            }}
          >
            Switch to {theme === "dark" ? "Light" : "Dark"} Theme
          </button>
        </div>
        <h2 style={{ textAlign: "center", color: colors.text, marginTop: 12 }}>Warsaw Metro Map – Outages</h2>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          minHeight: "80vh"
        }}>
          <div style={{
            width: "100%",
            maxWidth: 900,
            minWidth: 0,
            margin: "0 auto",
            background: colors.card,
            borderRadius: 12,
            boxShadow: theme === "dark" ? "0 2px 12px #0003" : "0 2px 12px #bbb3",
            padding: 16,
            marginBottom: 24,
            transition: "background 0.2s",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <MetroMap
              style={{
                width: "100%",
                height: "auto",
                minHeight: 300,
                minWidth: 0,
                display: "block",
                margin: "0 auto"
              }}
              className={theme === "dark" ? "metro-map-dark-text" : ""}
            />
          </div>
          <div style={{
            width: "100%",
            maxWidth: 700,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            justifyContent: "center"
          }}>
            <div>
              <h4 style={{ color: colors.dotInactive, margin: "8px 0" }}>Stations not working</h4>
              {notWorkingStations.length === 0 ? (
                <div style={{ color: colors.text, fontSize: 16, marginBottom: 8 }}>All stations are working.</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {notWorkingStations.map(station => (
                    <li key={station.id} style={{
                      color: colors.notWorkingText,
                      background: colors.notWorkingBg,
                      borderRadius: 4,
                      padding: "4px 10px",
                      marginBottom: 4,
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <span style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: colors.dotInactive,
                        marginRight: 8,
                        border: `1px solid ${colors.border}`
                      }} />
                      {station.name}
                      <span style={{ color: colors.text, fontSize: 13, marginLeft: 8 }}>
                        ({station.line})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 style={{ color: colors.text, margin: "8px 0" }}>Report a station as not working</h4>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (selectedStation) {
                    reportStation(selectedStation);
                    setSelectedStation("");
                  }
                }}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <select
                  value={selectedStation}
                  onChange={e => setSelectedStation(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: `1px solid ${colors.border}`,
                    fontSize: 15,
                    background: colors.card,
                    color: colors.text
                  }}
                >
                  <option value="">Select station...</option>
                  {stations
                    .filter(s =>
                      stationStatus[s.id].working &&
                      !stationStatus[s.id].reports.includes(userId)
                    )
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.line})
                      </option>
                    ))}
                </select>
                <button
                  type="submit"
                  disabled={!selectedStation}
                  style={{
                    background: colors.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 18px",
                    fontSize: 15,
                    cursor: selectedStation ? "pointer" : "not-allowed"
                  }}
                >
                  Report as not working
                </button>
              </form>
            </div>
            <div>
              <h4 style={{ color: colors.text, margin: "8px 0" }}>Report a range of stations as not working</h4>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (rangeStart && rangeEnd) {
                    reportRange(rangeStart, rangeEnd);
                    setRangeStart("");
                    setRangeEnd("");
                  }
                }}
                style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
              >
                <select
                  value={rangeStart}
                  onChange={e => setRangeStart(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: `1px solid ${colors.border}`,
                    fontSize: 15,
                    background: colors.card,
                    color: colors.text
                  }}
                >
                  <option value="">From station...</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.line})
                    </option>
                  ))}
                </select>
                <span style={{ color: colors.text }}>to</span>
                <select
                  value={rangeEnd}
                  onChange={e => setRangeEnd(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 4,
                    border: `1px solid ${colors.border}`,
                    fontSize: 15,
                    background: colors.card,
                    color: colors.text
                  }}
                >
                  <option value="">To station...</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.line})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!rangeStart || !rangeEnd}
                  style={{
                    background: colors.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 18px",
                    fontSize: 15,
                    cursor: rangeStart && rangeEnd ? "pointer" : "not-allowed"
                  }}
                >
                  Report range
                </button>
              </form>
            </div>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: "#ffd600", margin: "8px 0" }}>M1 stations</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {m1Stations.map(station => (
                  <span key={station.id} style={{
                    color: stationStatus[station.id].working ? colors.text : colors.dotInactive,
                    background: stationStatus[station.id].working ? colors.stationActive : colors.stationInactive,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 14
                  }}>
                    {station.name}
                    {station.id === "station-swietokrzyska-m1" && (
                      <span style={{ fontSize: 13, marginLeft: 4 }}>(M1)</span>
                    )}
                  </span>
                ))}
              </div>
              <h4 style={{ color: "#00b0ff", margin: "16px 0 8px 0" }}>M2 stations</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {m2Stations.map(station => (
                  <span key={station.id} style={{
                    color: stationStatus[station.id].working ? colors.text : colors.dotInactive,
                    background: stationStatus[station.id].working ? colors.stationActive : colors.stationInactive,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 14
                  }}>
                    {station.name}
                    {station.id === "station-swietokrzyska-m2" && (
                      <span style={{ fontSize: 13, marginLeft: 4 }}>(M2)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", margin: "24px 0" }}>
          {/* Admin login with password */}
          <form
            onSubmit={e => {
              e.preventDefault();
              if (adminInput === "admin") {
                setIsAdmin(true);
                setAdminError("");
                setAdminInput("");
              } else {
                setAdminError("Incorrect password.");
              }
            }}
            style={{ display: "inline-block" }}
          >
            <input
              type="password"
              value={adminInput}
              onChange={e => setAdminInput(e.target.value)}
              placeholder="Admin password"
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                border: `1px solid ${colors.border}`,
                fontSize: 15,
                background: colors.card,
                color: colors.text,
                marginRight: 8
              }}
            />
            <button
              type="submit"
              style={{
                background: colors.card,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: 4,
                padding: "6px 18px",
                fontSize: 15,
                cursor: "pointer"
              }}
            >
              Admin login
            </button>
          </form>
          {adminError && (
            <div style={{ color: "#e53935", marginTop: 8 }}>{adminError}</div>
          )}
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        minHeight: "100vh",
        minWidth: 0,
        width: "100vw",
        margin: 0,
        padding: 0,
        background: colors.bg,
        transition: "background 0.2s",
        boxSizing: "border-box",
        overflowX: "hidden"
      }}
    >
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 24,
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              background: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              padding: "4px 14px",
              cursor: "pointer"
            }}
          >
            Switch to {theme === "dark" ? "Light" : "Dark"} Theme
          </button>
        </div>
        <h2 style={{ textAlign: "center", color: colors.text }}>Warsaw Metro Map – Outages</h2>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <button onClick={() => setIsAdmin(false)} style={{
            background: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            padding: "6px 18px",
            fontSize: 15,
            cursor: "pointer"
          }}>
            Switch to User Mode
          </button>
        </div>
        <div style={{ margin: "10px 0", textAlign: "center" }}>
          <label>
            Auto-verify threshold:{" "}
            <input
              type="number"
              value={thresholdInput}
              min={1}
              onChange={e => setThresholdInput(Number(e.target.value))}
              style={{ width: 40, marginRight: 8, background: colors.card, color: colors.text, border: `1px solid ${colors.border}` }}
            />
          </label>
          <button
            onClick={() => setAutoVerifyThreshold(thresholdInput)}
            style={{
              background: colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "4px 14px",
              fontSize: 15,
              cursor: "pointer"
            }}
          >
            Save
          </button>
          <span style={{ color: colors.text, marginLeft: 12 }}>
            Current: {autoVerifyThreshold}
          </span>
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          alignItems: "flex-start",
          justifyContent: "center"
        }}>
          <div style={{
            flex: "1 1 350px",
            minWidth: 320,
            maxWidth: 420,
            background: colors.card,
            borderRadius: 8,
            padding: 16,
            boxShadow: theme === "dark" ? "0 2px 8px #0001" : "0 2px 8px #bbb3"
          }}>
            <h3 style={{ marginTop: 0, color: colors.text }}>Stations status</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", color: colors.text }}>Station</th>
                  <th style={{ color: colors.text }}>Status</th>
                  <th style={{ color: colors.text }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stations.map(station => (
                  <tr key={station.id} style={{
                    background: stationStatus[station.id].working ? colors.tableRow : colors.tableRowInactive
                  }}>
                    <td style={{ color: colors.text }}>
                      {station.name}
                      {station.id === "station-swietokrzyska-m1" && (
                        <span style={{ fontSize: 13, marginLeft: 4 }}>(M1)</span>
                      )}
                      {station.id === "station-swietokrzyska-m2" && (
                        <span style={{ fontSize: 13, marginLeft: 4 }}>(M2)</span>
                      )}
                    </td>
                    <td style={{ color: colors.text }}>
                      <span style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: stationStatus[station.id].working ? colors.dotActive : colors.dotInactive,
                        marginRight: 8,
                        border: `1px solid ${colors.border}`
                      }} />
                      {stationStatus[station.id].working ? "Working" : "Not working"}
                    </td>
                    <td>
                      <button
                        style={{
                          background: stationStatus[station.id].working ? colors.dotActive : colors.dotInactive,
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          padding: "2px 10px",
                          marginRight: 4,
                          cursor: "pointer"
                        }}
                        onClick={() => toggleStation(station.id)}
                      >
                        Toggle
                      </button>
                      {stationStatus[station.id].reports.length > 0 && (
                        <button
                          style={{
                            background: "#ffa726",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            padding: "2px 10px",
                            cursor: "pointer"
                          }}
                          onClick={() => verifyStation(station.id)}
                        >
                          Verify ({stationStatus[station.id].reports.length} reports)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            flex: "2 1 700px",
            minWidth: 400,
            maxWidth: 900,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <div style={{
              width: "100%",
              maxWidth: 900,
              minWidth: 400
            }}>
              <MetroMap style={{ width: "100%", height: "auto", minHeight: 700, minWidth: 400, display: "block" }} />
            </div>
          </div>
        </div>
      </div>
      <style>
      {`
        .metro-map-dark-text text,
        .metro-map-dark-text tspan {
          fill: #fff !important;
          stroke: none !important;
        }
      `}
      </style>
    </div>
  );
}