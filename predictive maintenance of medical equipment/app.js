/**
 * app.js
 * Main Controller for MedMaint AI Predictive Maintenance application.
 * Connects UI events, simulator ticks, ML analysis, and chart displays.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Core modules instantiation
    const simulator = new DeviceSimulator();
    window.simulatorInstance = simulator;
    const mlEngine = new PredictiveMLEngine();
    window.mlEngineInstance = mlEngine;
    const chartManager = new TelemetryChartManager();

    // 2. Global State Variables
    let selectedMonitorId = "MRI-001";
    let selectedSimId = "MRI-001";
    let simSpeedHoursPerSec = 0.05; // Default speed multiplier (1 hour simulated per 20 seconds, or 3 mins per real-sec)
    let alertsLog = [];
    let activeTickets = [];
    let maintenanceHistory = [];
    let simIntervalId = null;

    // References to UI elements
    const viewTitle = document.getElementById("view-title");
    const navItems = document.querySelectorAll(".nav-item");
    const contentPanels = document.querySelectorAll(".content-panel");
    
    // Header Metric elements
    const healthyEl = document.getElementById("metric-healthy");
    const warningEl = document.getElementById("metric-warning");
    const criticalEl = document.getElementById("metric-critical");
    
    // Console log
    const simConsole = document.getElementById("sim-console");

    // 3. Navigation System
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetView = item.getAttribute("data-view");
            
            // Toggle active classes on tabs
            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");

            // Toggle active panels
            contentPanels.forEach(panel => {
                if (panel.id === targetView) {
                    panel.classList.add("active");
                } else {
                    panel.classList.remove("active");
                }
            });

            // Update Header Title
            viewTitle.textContent = item.textContent.trim();

            // Special actions when entering views
            if (targetView === "monitor-view") {
                const dev = simulator.getDevice(selectedMonitorId);
                chartManager.initDeviceCharts(dev);
            } else {
                chartManager.destroyAll();
            }

            if (targetView === "explainer-view") {
                updateExplainerView();
            }
        });
    });

    // 4. Device Selector (Monitor view)
    const monitorSelect = document.getElementById("monitor-device-select");
    monitorSelect.addEventListener("change", (e) => {
        selectedMonitorId = e.target.value;
        const dev = simulator.getDevice(selectedMonitorId);
        
        // Rebuild charts and static info
        chartManager.initDeviceCharts(dev);
        updateMonitorViewDetails(dev);
        logConsole(`[SYSTEM] Switched monitor view to ${dev.id}.`);
    });

    // Device Selector (Simulator view)
    const simSelect = document.getElementById("sim-device-select");
    simSelect.addEventListener("change", (e) => {
        selectedSimId = e.target.value;
        renderAnomalyTriggers(selectedSimId);
    });

    // 5. Action Handlers (Maintenance & Reset)
    const instantMaintBtn = document.getElementById("btn-monitor-perform-maint");
    instantMaintBtn.addEventListener("click", () => {
        performMaintenanceAction(selectedMonitorId);
    });

    const resetSimBtn = document.getElementById("btn-reset-simulation");
    resetSimBtn.addEventListener("click", () => {
        simulator.getDevices().forEach(dev => {
            simulator.performMaintenance(dev.id);
        });
        activeTickets = [];
        alertsLog = [];
        logConsole(`[SYSTEM] Factory reset complete. All device profiles recalibrated to 100% health.`);
        
        // Refresh active views
        updateDashboardView();
        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav && activeNav.getAttribute("data-view") === "monitor-view") {
            const dev = simulator.getDevice(selectedMonitorId);
            chartManager.initDeviceCharts(dev);
            updateMonitorViewDetails(dev);
        }
        renderActiveTickets();
    });

    // CSV Export
    const exportCsvBtn = document.getElementById("btn-export-csv");
    exportCsvBtn.addEventListener("click", () => {
        exportFleetTelemetryToCSV();
    });

    // Speed Controls
    const speedBtns = document.querySelectorAll(".speed-btn");
    speedBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            speedBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const hoursVal = parseInt(btn.getAttribute("data-speed"));
            if (hoursVal === 1) {
                simSpeedHoursPerSec = 0.05; // 3 minutes simulated per tick
                document.getElementById("clock-speed-text").textContent = "1x Speed (Realtime)";
                document.getElementById("global-pulse").className = "pulse-dot";
            } else if (hoursVal === 5) {
                simSpeedHoursPerSec = 0.25; // 15 minutes simulated per tick
                document.getElementById("clock-speed-text").textContent = "5x Speed (Fast)";
                document.getElementById("global-pulse").className = "pulse-dot warning";
            } else if (hoursVal === 24) {
                simSpeedHoursPerSec = 1.0; // 1 hour simulated per tick
                document.getElementById("clock-speed-text").textContent = "24x Speed (Accelerated)";
                document.getElementById("global-pulse").className = "pulse-dot critical";
            } else if (hoursVal === 168) {
                simSpeedHoursPerSec = 7.0; // 7 hours simulated per tick
                document.getElementById("clock-speed-text").textContent = "168x Speed (Max)";
                document.getElementById("global-pulse").className = "pulse-dot critical";
            }
            logConsole(`[SYSTEM] Simulation Speed dilated. Scaling factor: ${hoursVal}x.`);
        });
    });

    // 6. ML Threshold Configuration Sliders
    const sliderWarn = document.getElementById("slider-warn-thresh");
    const sliderCrit = document.getElementById("slider-crit-thresh");
    const lblWarn = document.getElementById("lbl-warn-thresh");
    const lblCrit = document.getElementById("lbl-crit-thresh");

    sliderWarn.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        mlEngine.settings.warningThreshold = val;
        lblWarn.textContent = val.toFixed(1);
        document.getElementById("det-warn-thresh").textContent = val.toFixed(1);
    });

    sliderCrit.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        mlEngine.settings.criticalThreshold = val;
        lblCrit.textContent = val.toFixed(1);
    });

    // 7. Core simulation tick logic
    function runSimulationStep() {
        // Run simulator time increments
        simulator.update(simSpeedHoursPerSec);

        // Run ML Analytics step on all devices
        let totalHealth = 0;
        let activeWarnings = 0;
        let activeCritical = 0;

        simulator.getDevices().forEach(dev => {
            // Apply ML anomaly and RUL algorithms
            const analysis = mlEngine.analyzeDevice(dev);
            const prediction = mlEngine.predictRUL(dev);

            const oldStatus = dev.status;

            dev.status = analysis.status;
            dev.anomalyScore = analysis.anomalyScore;
            dev.rul = prediction.rulHours;
            dev.rulText = prediction.rulFormatted;
            dev.rulConfidence = prediction.confidence;
            dev.contributions = analysis.contributions;

            totalHealth += dev.health;

            // Handle alert generation on status degradation
            if (dev.status !== "Normal" && oldStatus === "Normal") {
                triggerDeviceAlert(dev, "Warning", `Anomaly detected in ${dev.name}. Z-Score distance is ${dev.anomalyScore}. RUL dropped to ${dev.rulText}.`);
                triggerServiceTicket(dev, "Warning");
            } else if (dev.status === "Critical" && oldStatus !== "Critical") {
                triggerDeviceAlert(dev, "Critical", `CRITICAL: Immediate inspection needed for ${dev.name}. Structural bearing degradation or component failure imminent.`);
                triggerServiceTicket(dev, "Critical");
            } else if (dev.status === "Failure" && oldStatus !== "Failure") {
                triggerDeviceAlert(dev, "Failure", `SYSTEM FAILED: ${dev.name} has shut down automatically to protect equipment core. Call field specialist immediately.`);
                triggerServiceTicket(dev, "Failure");
            }

            if (dev.status === "Warning") activeWarnings++;
            if (dev.status === "Critical" || dev.status === "Failure") activeCritical++;
        });

        // Compute fleet metrics
        const fleetHealthAvg = Math.round(totalHealth / simulator.getDevices().length);
        const healthyCount = simulator.getDevices().length - activeWarnings - activeCritical;

        // Update header counter badges
        healthyEl.textContent = healthyCount;
        warningEl.textContent = activeWarnings;
        criticalEl.textContent = activeCritical;

        // Update active content panels
        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav) {
            const currentView = activeNav.getAttribute("data-view");
            if (currentView === "dashboard-view") {
                updateDashboardView(fleetHealthAvg);
            } else if (currentView === "monitor-view") {
                const dev = simulator.getDevice(selectedMonitorId);
                updateMonitorViewDetails(dev);
                chartManager.updateDeviceCharts(dev);
            } else if (currentView === "explainer-view") {
                updateExplainerView();
            }
        }
    }

    // 8. Alerts & Maintenance Work Orders Creation
    function triggerDeviceAlert(device, severity, message) {
        const timestamp = new Date().toLocaleTimeString();
        alertsLog.unshift({
            id: `ALT-${Math.floor(Math.random() * 10000)}`,
            deviceId: device.id,
            deviceName: device.name,
            severity,
            message,
            time: timestamp
        });

        if (alertsLog.length > 30) alertsLog.pop();

        logConsole(`[ALERT] [${severity.toUpperCase()}] Device ${device.id}: ${message}`);
        updateAlertFeedUI();
    }

    function triggerServiceTicket(device, severity) {
        // Prevent duplicate tickets
        if (activeTickets.find(t => t.deviceId === device.id)) return;

        let recommendation = "Perform routine diagnostics check.";
        if (device.type === "MRI") {
            recommendation = device.activeAnomaly === "coolant_leak" ? 
                "Check helium levels, verify cryogen compressor valve seals, replenish liquid helium." : 
                "Replace main bearing cage, align rotor shaft, and evaluate mechanical stress.";
        } else if (device.type === "Ventilator") {
            recommendation = device.activeAnomaly === "valve_blockage" ? 
                "Disassemble mixing block, clean solenoid gas valve, re-calibrate flow sensor." : 
                "Replace compressor turbine motor assembly and clean impeller housing.";
        } else if (device.type === "Infusion Pump") {
            recommendation = device.activeAnomaly === "motor_stiffness" ? 
                "Lubricate peristaltic rotor roller guide pins, check pump current load." : 
                "Inspect pressure sensor transducer calibration and bleed pump line.";
        } else if (device.type === "CT Scanner") {
            recommendation = device.activeAnomaly === "vacuum_deg" ? 
                "Check CT tube vacuum integrity seals, verify cooling oil flow, inspect filament." : 
                "Re-balance gantry drive belt, inspect gantry main bearings, adjust counterweights.";
        }

        activeTickets.unshift({
            id: `TKT-${Math.floor(Math.random() * 9000 + 1000)}`,
            deviceId: device.id,
            deviceName: device.name,
            severity,
            desc: recommendation,
            time: new Date().toISOString().slice(0, 16).replace("T", " ")
        });

        renderActiveTickets();
    }

    function performMaintenanceAction(deviceId) {
        const dev = simulator.getDevice(deviceId);
        if (!dev) return;

        logConsole(`[MAINTENANCE] Performing complete service on ${dev.name} (${dev.id})...`);
        
        // Perform reset
        simulator.performMaintenance(deviceId);

        // Complete ticket
        const ticketIdx = activeTickets.findIndex(t => t.deviceId === deviceId);
        let actionMessage = "Repaired faulty component and cleared telemetry anomaly drift.";
        if (ticketIdx !== -1) {
            actionMessage = activeTickets[ticketIdx].desc;
            activeTickets.splice(ticketIdx, 1);
        }

        // Add history log
        maintenanceHistory.unshift({
            date: new Date().toISOString().slice(0, 16).replace("T", " "),
            deviceId: dev.id,
            deviceName: dev.name,
            service: actionMessage,
            status: "Completed",
            tech: "AI Engine & Clinical Engineering Team"
        });

        logConsole(`[MAINTENANCE] ${dev.id} restored to 100% health index. Sensors recalibrated.`);

        // Refresh layouts
        renderActiveTickets();
        renderHistoryLogs();
        updateDashboardView();
        
        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav && activeNav.getAttribute("data-view") === "monitor-view") {
            const currentDev = simulator.getDevice(selectedMonitorId);
            chartManager.initDeviceCharts(currentDev);
            updateMonitorViewDetails(currentDev);
        }
    }

    // 9. UI Dynamic Generation Methods
    function updateDashboardView(avgHealth = 100) {
        document.getElementById("fleet-health-avg").textContent = `${avgHealth}%`;
        document.getElementById("active-alert-count").textContent = alertsLog.filter(a => a.severity !== "Warning").length;

        // Render Table
        const tbody = document.getElementById("fleet-table-body");
        tbody.innerHTML = "";

        simulator.getDevices().forEach(dev => {
            const tr = document.createElement("tr");
            tr.addEventListener("click", () => {
                selectedMonitorId = dev.id;
                monitorSelect.value = dev.id;
                
                // Switch view programmatically
                document.getElementById("nav-monitor").click();
            });

            const statusClass = dev.status.toLowerCase();
            const RULString = dev.status === "Failure" ? "Offline" : dev.rulText;

            tr.innerHTML = `
                <td><strong>${dev.id}</strong></td>
                <td>${dev.name}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="health-bar-container">
                            <div class="health-bar" style="width: ${dev.health}%; background: ${dev.health > 70 ? 'var(--color-normal)' : dev.health > 40 ? 'var(--color-warning)' : 'var(--color-critical)'}"></div>
                        </div>
                        <span>${dev.health}%</span>
                    </div>
                </td>
                <td>${dev.anomalyScore}</td>
                <td style="color: ${dev.health > 70 ? 'var(--color-cyan)' : dev.health > 40 ? 'var(--color-warning)' : 'var(--color-critical)'}">${RULString}</td>
                <td><span class="status-badge ${statusClass}">${dev.status}</span></td>
            `;
            tbody.appendChild(tr);
        });

        // Next maintenance countdown check
        let nextServiceStr = "No urgent work";
        const lowestRulDevice = [...simulator.getDevices()].sort((a,b) => a.rul - b.rul)[0];
        if (lowestRulDevice && lowestRulDevice.rul < (30 * 24)) {
            nextServiceStr = `${lowestRulDevice.id} in ${lowestRulDevice.rulText}`;
        }
        document.getElementById("next-service-countdown").textContent = nextServiceStr;
    }

    function updateMonitorViewDetails(dev) {
        document.getElementById("det-device-name").textContent = dev.name;
        document.getElementById("det-device-id").textContent = dev.id;
        document.getElementById("det-install-date").textContent = dev.installDate;
        document.getElementById("det-expected-life").textContent = `${dev.expectedLifespanYears} years`;
        
        // Status Badge
        const badge = document.getElementById("det-device-status-badge");
        badge.textContent = dev.status;
        badge.className = `status-badge ${dev.status.toLowerCase()}`;

        // Circular Gauge Animation
        document.getElementById("det-health-val").textContent = `${dev.health}%`;
        const circle = document.getElementById("det-health-ring");
        // Dash circumference is 377. (377 * (100 - health) / 100)
        const offset = 377 - (377 * dev.health / 100);
        circle.style.strokeDashoffset = offset;
        circle.style.stroke = dev.health > 70 ? 'var(--color-normal)' : dev.health > 40 ? 'var(--color-warning)' : 'var(--color-critical)';

        // Anomaly Score
        document.getElementById("det-anomaly-score").textContent = dev.anomalyScore;
        document.getElementById("det-anomaly-score").style.color = dev.status === "Normal" ? 'var(--text-primary)' : dev.status === "Warning" ? 'var(--color-warning)' : 'var(--color-critical)';

        // RUL
        const rulEl = document.getElementById("det-rul");
        if (dev.status === "Failure") {
            rulEl.textContent = "FATAL / OFFLINE";
            rulEl.style.color = "var(--color-critical)";
        } else {
            rulEl.textContent = dev.rulText;
            rulEl.style.color = dev.health > 70 ? 'var(--color-cyan)' : dev.health > 40 ? 'var(--color-warning)' : 'var(--color-critical)';
        }
        document.getElementById("det-rul-confidence").textContent = `${dev.rulConfidence}%`;

        // Accumulated hours
        document.getElementById("det-accum-hours").textContent = `${dev.accumulatedHours.toLocaleString(undefined, {maximumFractionDigits: 0})}h`;

        // Update sensor values text
        const sensorKeys = Object.keys(dev.sensors);
        sensorKeys.forEach((key, index) => {
            const sens = dev.sensors[key];
            document.getElementById(`lbl-sensor-${index}`).textContent = sens.name;
            document.getElementById(`val-sensor-${index}`).textContent = `${sens.val} ${sens.unit}`;
        });
    }

    function updateAlertFeedUI() {
        const container = document.getElementById("dashboard-alert-feed");
        if (alertsLog.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛡️</div>
                    <p>All systems functioning normally. No active anomalies detected.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = "";
        alertsLog.forEach(alt => {
            const div = document.createElement("div");
            div.className = `alert-item ${alt.severity.toLowerCase()}`;
            
            let iconSvg = "";
            if (alt.severity === "Warning") {
                iconSvg = `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>`;
            } else if (alt.severity === "Critical") {
                iconSvg = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
            } else {
                iconSvg = `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>`;
            }

            div.innerHTML = `
                <div class="alert-icon">${iconSvg}</div>
                <div class="alert-content">
                    <div class="alert-item-title">${alt.deviceName} (${alt.deviceId}) - ${alt.severity}</div>
                    <div class="alert-item-desc">${alt.message}</div>
                    <div class="alert-item-time">${alt.time}</div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function renderAnomalyTriggers(deviceId) {
        const dev = simulator.getDevice(deviceId);
        const container = document.getElementById("sim-anomaly-triggers");
        container.innerHTML = "";

        if (!dev) return;

        let anomalies = [];
        if (dev.type === "MRI") {
            anomalies = [
                { id: "coolant_leak", name: "Cryogen Coolant Leak", desc: "Helium boil-off, pressure loss, coil overheating." },
                { id: "compressor_wear", name: "Compressor Bearing Wear", desc: "Excess vibration, high noise, increased current." }
            ];
        } else if (dev.type === "Ventilator") {
            anomalies = [
                { id: "valve_blockage", name: "Valve Contamination", desc: "Airflow occlusion, pressure spikes, current overload." },
                { id: "turbine_friction", name: "Turbine Bearing Wear", desc: "Decreased motor speed, airflow output drop, thermal rise." }
            ];
        } else if (dev.type === "Infusion Pump") {
            anomalies = [
                { id: "motor_stiffness", name: "Gear Motor Friction", desc: "Stiff movement, battery drain, high current draw." },
                { id: "occlusion", name: "Patient Line Occlusion", desc: "Pressure spike inside tubing, motor stalling." }
            ];
        } else if (dev.type === "CT Scanner") {
            anomalies = [
                { id: "vacuum_deg", name: "X-Ray Tube Leakage", desc: "Vacuum loss, anode overheating, filament fluctuation." },
                { id: "gantry_unbalance", name: "Gantry Rotor Drift", desc: "Centrifugal vibration spike, gantry friction heat." }
            ];
        }

        anomalies.forEach(anomaly => {
            const card = document.createElement("div");
            card.className = "anomaly-card";
            card.innerHTML = `
                <div class="anomaly-name">${anomaly.name}</div>
                <div class="anomaly-desc">${anomaly.desc}</div>
            `;
            card.addEventListener("click", () => {
                if (dev.activeAnomaly) {
                    logConsole(`[SIMULATOR] Device ${dev.id} is already decaying under ${dev.activeAnomaly}. Clear anomaly first.`);
                    return;
                }
                simulator.injectAnomaly(dev.id, anomaly.id);
                logConsole(`[SIMULATOR] [INJECTION] Injected anomaly [${anomaly.id}] into target device ${dev.id}.`);
                
                // If simulator targeted current monitor view, refresh UI status immediately
                if (dev.id === selectedMonitorId) {
                    updateMonitorViewDetails(dev);
                }
            });
            container.appendChild(card);
        });
    }

    function renderActiveTickets() {
        const container = document.getElementById("maintenance-active-tickets");
        if (activeTickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <p>No active service tickets. All machines are healthy.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = "";
        activeTickets.forEach(ticket => {
            const div = document.createElement("div");
            div.className = `alert-item ${ticket.severity.toLowerCase()}`;
            
            div.innerHTML = `
                <div class="alert-icon">
                    <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <div class="alert-content">
                    <div class="alert-item-title">${ticket.deviceName} (${ticket.deviceId}) - ${ticket.severity} Service Ticket</div>
                    <div class="alert-item-desc" style="font-weight: 500; margin-top: 4px; color: var(--text-primary);">Suggested Actions: ${ticket.desc}</div>
                    <div class="alert-item-time" style="margin-top: 6px;">Triggered at: ${ticket.time}</div>
                    <button class="btn btn-secondary btn-maint-dispatch" style="padding: 6px 12px; font-size: 0.75rem; margin-top: 10px;" data-id="${ticket.deviceId}">Dispatch Engineer & Fix Now</button>
                </div>
            `;
            
            div.querySelector(".btn-maint-dispatch").addEventListener("click", () => {
                performMaintenanceAction(ticket.deviceId);
            });
            container.appendChild(div);
        });
    }

    function renderHistoryLogs() {
        const tbody = document.getElementById("maintenance-history-body");
        tbody.innerHTML = "";
        maintenanceHistory.forEach(log => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${log.date}</td>
                <td><strong>${log.deviceId}</strong></td>
                <td>${log.service}</td>
                <td><span class="status-badge normal">Completed</span></td>
                <td>${log.tech}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updateExplainerView() {
        const dev = simulator.getDevice(selectedMonitorId);
        if (!dev) return;

        // Render dynamic weights based on contributions
        const container = document.getElementById("explainer-sensor-contributions");
        container.innerHTML = "";

        const titleDiv = document.createElement("div");
        titleDiv.className = "card-subtext";
        titleDiv.style.marginBottom = "14px";
        titleDiv.textContent = `Analyzing Feature Importance for selected device: ${dev.id}`;
        container.appendChild(titleDiv);

        Object.keys(dev.sensors).forEach(key => {
            const sensor = dev.sensors[key];
            const weight = dev.contributions ? (dev.contributions[key] || 25) : 25;
            
            const row = document.createElement("div");
            row.className = "factor-row";
            row.innerHTML = `
                <div class="factor-info">
                    <span>${sensor.name} (${key})</span>
                    <span>${weight}%</span>
                </div>
                <div class="factor-bar-bg">
                    <div class="factor-bar-fill" style="width: ${weight}%"></div>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // Console logging helper
    function logConsole(message) {
        const cleanMsg = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        simConsole.innerHTML += `<br>${cleanMsg}`;
        simConsole.scrollTop = simConsole.scrollHeight;
    }

    // Telemetry CSV Export Helper
    function exportFleetTelemetryToCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "TimestampOffset,DeviceID,SensorName,SensorValue,SensorUnit,AnomalyScore,DeviceHealth,Status\n";

        simulator.getDevices().forEach(dev => {
            Object.keys(dev.sensors).forEach(sensorKey => {
                const s = dev.sensors[sensorKey];
                s.hist.forEach((val, idx) => {
                    const timeOffset = s.hist.length - idx;
                    csvContent += `${timeOffset}s ago,${dev.id},${s.name},${val},${s.unit},${dev.anomalyScore || 0.1},${dev.health},${dev.status}\n`;
                });
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `medmaint_fleet_telemetry_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        logConsole(`[SYSTEM] Exported telemetry dataset for 4 devices in CSV format.`);
    }

    // 10. Start simulation clock
    renderAnomalyTriggers(selectedSimId);
    
    // Run initial calibration tick to populate ML parameters and dashboard metrics
    runSimulationStep();
    
    renderActiveTickets();
    
    // Trigger tick every 1000ms
    simIntervalId = setInterval(runSimulationStep, 1000);
});
