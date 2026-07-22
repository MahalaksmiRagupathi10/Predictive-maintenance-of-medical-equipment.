/**
 * simulator.js
 * Simulates medical equipment telemetry, natural wear, and anomalies.
 */

class DeviceSimulator {
    constructor() {
        this.devices = [
            {
                id: "MRI-001",
                name: "MRI Scanner (High-Field 3T)",
                type: "MRI",
                installDate: "2024-03-12",
                expectedLifespanYears: 10,
                accumulatedHours: 12450,
                health: 100, // percentage
                status: "Normal", // Normal, Warning, Critical, Failure
                activeAnomaly: null, // "coolant_leak", "compressor_wear"
                anomalySeverity: 0, // 0 to 1
                sensors: {
                    cryo_temp: { name: "Cryogen Temp", unit: "K", val: 4.2, normalMin: 4.1, normalMax: 4.3, hist: [] },
                    coolant_pressure: { name: "Coolant Pressure", unit: "PSI", val: 55.0, normalMin: 48.0, normalMax: 62.0, hist: [] },
                    compressor_vibration: { name: "Compressor Vibration", unit: "mm/s", val: 1.1, normalMin: 0.5, normalMax: 1.8, hist: [] },
                    power_draw: { name: "Power Draw", unit: "kW", val: 22.0, normalMin: 19.0, normalMax: 25.0, hist: [] }
                }
            },
            {
                id: "VENT-002",
                name: "ICU Ventilator (Turbine)",
                type: "Ventilator",
                installDate: "2025-01-15",
                expectedLifespanYears: 5,
                accumulatedHours: 4820,
                health: 100,
                status: "Normal",
                activeAnomaly: null, // "valve_blockage", "turbine_friction"
                anomalySeverity: 0,
                sensors: {
                    air_pressure: { name: "Air Pressure", unit: "cmH2O", val: 20.0, normalMin: 14.0, normalMax: 26.0, hist: [] },
                    flow_rate: { name: "Airflow Rate", unit: "L/min", val: 48.0, normalMin: 38.0, normalMax: 58.0, hist: [] },
                    motor_speed: { name: "Turbine Speed", unit: "kRPM", val: 12.0, normalMin: 10.0, normalMax: 14.0, hist: [] },
                    voltage: { name: "Battery Voltage", unit: "V", val: 12.4, normalMin: 11.8, normalMax: 12.8, hist: [] }
                }
            },
            {
                id: "INF-003",
                name: "Syringe Infusion Pump",
                type: "Infusion Pump",
                installDate: "2025-06-20",
                expectedLifespanYears: 3,
                accumulatedHours: 1920,
                health: 100,
                status: "Normal",
                activeAnomaly: null, // "motor_stiffness", "occlusion"
                anomalySeverity: 0,
                sensors: {
                    occ_pressure: { name: "Occlusion Pressure", unit: "mmHg", val: 120.0, normalMin: 90.0, normalMax: 160.0, hist: [] },
                    motor_current: { name: "Motor Current", unit: "mA", val: 95.0, normalMin: 80.0, normalMax: 115.0, hist: [] },
                    device_vibration: { name: "Pump Vibration", unit: "mm/s", val: 0.15, normalMin: 0.05, normalMax: 0.25, hist: [] },
                    battery_health: { name: "Battery Health", unit: "%", val: 98.0, normalMin: 80.0, normalMax: 100.0, hist: [] }
                }
            },
            {
                id: "CT-004",
                name: "CT Rotary Gantry & Tube",
                type: "CT Scanner",
                installDate: "2023-08-05",
                expectedLifespanYears: 8,
                accumulatedHours: 18900,
                health: 100,
                status: "Normal",
                activeAnomaly: null, // "vacuum_deg", "gantry_unbalance"
                anomalySeverity: 0,
                sensors: {
                    tube_temp: { name: "Anode Temp", unit: "°C", val: 58.0, normalMin: 40.0, normalMax: 78.0, hist: [] },
                    vacuum: { name: "Vacuum Level", unit: "nTorr", val: 1.2, normalMin: 0.8, normalMax: 2.2, hist: [] },
                    gantry_vibration: { name: "Gantry Vibration", unit: "mm/s", val: 0.40, normalMin: 0.20, normalMax: 0.70, hist: [] },
                    filament_current: { name: "Filament Current", unit: "A", val: 5.2, normalMin: 4.9, normalMax: 5.5, hist: [] }
                }
            }
        ];

        // Seed initial history
        this.devices.forEach(dev => {
            for (let i = 0; i < 50; i++) {
                this.updateDeviceTelemetry(dev, 0, false);
            }
        });
    }

    getDevices() {
        return this.devices;
    }

    getDevice(id) {
        return this.devices.find(d => d.id === id);
    }

    injectAnomaly(deviceId, anomalyType) {
        const dev = this.getDevice(deviceId);
        if (dev) {
            dev.activeAnomaly = anomalyType;
            dev.anomalySeverity = 0.05; // start low and increase
        }
    }

    clearAnomaly(deviceId) {
        const dev = this.getDevice(deviceId);
        if (dev) {
            dev.activeAnomaly = null;
            dev.anomalySeverity = 0;
        }
    }

    performMaintenance(deviceId) {
        const dev = this.getDevice(deviceId);
        if (dev) {
            dev.health = 100;
            dev.status = "Normal";
            dev.activeAnomaly = null;
            dev.anomalySeverity = 0;
            
            // Reset sensor baselines to normal values
            if (dev.type === "MRI") {
                dev.sensors.cryo_temp.val = 4.2;
                dev.sensors.coolant_pressure.val = 55.0;
                dev.sensors.compressor_vibration.val = 1.1;
                dev.sensors.power_draw.val = 22.0;
            } else if (dev.type === "Ventilator") {
                dev.sensors.air_pressure.val = 20.0;
                dev.sensors.flow_rate.val = 48.0;
                dev.sensors.motor_speed.val = 12.0;
                dev.sensors.voltage.val = 12.4;
            } else if (dev.type === "Infusion Pump") {
                dev.sensors.occ_pressure.val = 120.0;
                dev.sensors.motor_current.val = 95.0;
                dev.sensors.device_vibration.val = 0.15;
                dev.sensors.battery_health.val = 100.0;
            } else if (dev.type === "CT Scanner") {
                dev.sensors.tube_temp.val = 58.0;
                dev.sensors.vacuum.val = 1.2;
                dev.sensors.gantry_vibration.val = 0.4;
                dev.sensors.filament_current.val = 5.2;
            }
            
            // Re-seed history with healthy data
            Object.keys(dev.sensors).forEach(key => {
                dev.sensors[key].hist = [];
            });
            for (let i = 0; i < 50; i++) {
                this.updateDeviceTelemetry(dev, 0, false);
            }
        }
    }

    update(timeStepHours) {
        this.devices.forEach(dev => {
            // Natural aging and wear increment
            dev.accumulatedHours += timeStepHours;
            
            // Propagate active anomalies (make them worse over time)
            if (dev.activeAnomaly) {
                // Growth rate of anomaly depends on severity
                dev.anomalySeverity = Math.min(1.0, dev.anomalySeverity + 0.005 * timeStepHours);
            }
            
            // Calculate health index based on accumulated wear + active anomaly
            let anomalyDamage = dev.activeAnomaly ? (dev.anomalySeverity * 70) : 0; // up to 70% drop
            let ageDamage = (dev.accumulatedHours / (dev.expectedLifespanYears * 8760)) * 25; // up to 25% drop at lifespan
            dev.health = Math.max(0, Math.round(100 - anomalyDamage - ageDamage));
            
            // Generate next telemetry data point
            this.updateDeviceTelemetry(dev, timeStepHours, true);
        });
    }

    updateDeviceTelemetry(dev, dt, pushToHistory = true) {
        const sev = dev.anomalySeverity;

        if (dev.type === "MRI") {
            // Base states with random walk noise
            let targetCryo = 4.2 + (Math.random() - 0.5) * 0.02;
            let targetPress = 55.0 + (Math.random() - 0.5) * 0.8;
            let targetVib = 1.1 + (Math.random() - 0.5) * 0.05;
            let targetPow = 22.0 + (Math.random() - 0.5) * 0.25;

            // Apply anomalies
            if (dev.activeAnomaly === "coolant_leak") {
                targetCryo += sev * 1.5; // Up to 5.7 K (Quench hazard!)
                targetPress -= sev * 30.0; // Drops to 25 PSI
                targetVib += sev * 1.2; // Vibration rises due to cooling instability
                targetPow += sev * 6.0; // Compressor works harder
            } else if (dev.activeAnomaly === "compressor_wear") {
                targetVib += sev * 2.8; // Vibration spikes to 3.9 mm/s
                targetPow += sev * 4.0; // High friction draw
                targetCryo += sev * 0.4; // Minor warming
            }

            // Normal aging drift
            const ageRatio = dev.accumulatedHours / (dev.expectedLifespanYears * 8760);
            targetVib += ageRatio * 0.3; // Older compressor vibrates slightly more

            // Update sensor current values (simple low-pass filter for smooth transitions)
            dev.sensors.cryo_temp.val = Number((dev.sensors.cryo_temp.val * 0.8 + targetCryo * 0.2).toFixed(3));
            dev.sensors.coolant_pressure.val = Number((dev.sensors.coolant_pressure.val * 0.8 + targetPress * 0.2).toFixed(2));
            dev.sensors.compressor_vibration.val = Number((dev.sensors.compressor_vibration.val * 0.8 + targetVib * 0.2).toFixed(2));
            dev.sensors.power_draw.val = Number((dev.sensors.power_draw.val * 0.8 + targetPow * 0.2).toFixed(2));

        } else if (dev.type === "Ventilator") {
            let targetPress = 20.0 + (Math.random() - 0.5) * 0.6;
            let targetFlow = 48.0 + (Math.random() - 0.5) * 1.2;
            let targetSpeed = 12.0 + (Math.random() - 0.5) * 0.15;
            let targetVolt = 12.4 + (Math.random() - 0.5) * 0.02;

            if (dev.activeAnomaly === "valve_blockage") {
                targetPress += sev * 18.0; // Pressure spikes up to 38 cmH2O
                targetFlow -= sev * 28.0; // Flow collapses to 20 L/min
                targetSpeed += sev * 3.5; // Turbine speeds up to vent excess
            } else if (dev.activeAnomaly === "turbine_friction") {
                targetSpeed -= sev * 4.0; // Speed drops
                targetPress -= sev * 8.0; // Pressure drops
                targetFlow -= sev * 15.0; // Flow drops
                // Voltage might drop under load spike
                targetVolt -= sev * 0.8;
            }

            const ageRatio = dev.accumulatedHours / (dev.expectedLifespanYears * 8760);
            targetVolt -= ageRatio * 0.5; // battery capacity decay

            dev.sensors.air_pressure.val = Number((dev.sensors.air_pressure.val * 0.8 + targetPress * 0.2).toFixed(2));
            dev.sensors.flow_rate.val = Number((dev.sensors.flow_rate.val * 0.8 + targetFlow * 0.2).toFixed(2));
            dev.sensors.motor_speed.val = Number((dev.sensors.motor_speed.val * 0.8 + targetSpeed * 0.2).toFixed(2));
            dev.sensors.voltage.val = Number((dev.sensors.voltage.val * 0.8 + targetVolt * 0.2).toFixed(2));

        } else if (dev.type === "Infusion Pump") {
            let targetOcc = 120.0 + (Math.random() - 0.5) * 4.0;
            let targetCurr = 95.0 + (Math.random() - 0.5) * 2.0;
            let targetVib = 0.15 + (Math.random() - 0.5) * 0.02;
            let targetBatt = 98.0 - (dev.accumulatedHours * 0.001) % 20; // baseline charge behavior

            if (dev.activeAnomaly === "motor_stiffness") {
                targetCurr += sev * 120.0; // Current spikes to 215mA
                targetVib += sev * 0.6; // High vibration
            } else if (dev.activeAnomaly === "occlusion") {
                targetOcc += sev * 200.0; // Massive occlusion pressure spike
                targetCurr += sev * 45.0; // Higher load
            }

            const ageRatio = dev.accumulatedHours / (dev.expectedLifespanYears * 8760);
            let battHealth = 100 - ageRatio * 30; // Max battery capacity decay
            if (dev.activeAnomaly === "motor_stiffness") {
                battHealth -= sev * 15.0; // Drain battery health
            }

            dev.sensors.occ_pressure.val = Number((dev.sensors.occ_pressure.val * 0.8 + targetOcc * 0.2).toFixed(1));
            dev.sensors.motor_current.val = Number((dev.sensors.motor_current.val * 0.8 + targetCurr * 0.2).toFixed(1));
            dev.sensors.device_vibration.val = Number((dev.sensors.device_vibration.val * 0.8 + targetVib * 0.2).toFixed(3));
            dev.sensors.battery_health.val = Number(Math.max(0, Math.min(100, battHealth)).toFixed(1));

        } else if (dev.type === "CT Scanner") {
            let targetTemp = 58.0 + (Math.random() - 0.5) * 1.5;
            let targetVac = 1.2 + (Math.random() - 0.5) * 0.05;
            let targetVib = 0.40 + (Math.random() - 0.5) * 0.03;
            let targetFil = 5.2 + (Math.random() - 0.5) * 0.03;

            if (dev.activeAnomaly === "vacuum_deg") {
                targetVac += sev * 5.0; // Vacuum pressure degrades to 6.2 nTorr
                targetTemp += sev * 35.0; // Temperature rises due to thermal insulation loss
                targetFil -= sev * 0.8; // Filament current instability
            } else if (dev.activeAnomaly === "gantry_unbalance") {
                targetVib += sev * 2.2; // Vibration spikes up to 2.6 mm/s
                targetTemp += sev * 15.0; // Friction heating
            }

            const ageRatio = dev.accumulatedHours / (dev.expectedLifespanYears * 8760);
            targetVib += ageRatio * 0.2; // Gantry wear vibration

            dev.sensors.tube_temp.val = Number((dev.sensors.tube_temp.val * 0.8 + targetTemp * 0.2).toFixed(1));
            dev.sensors.vacuum.val = Number((dev.sensors.vacuum.val * 0.8 + targetVac * 0.2).toFixed(2));
            dev.sensors.gantry_vibration.val = Number((dev.sensors.gantry_vibration.val * 0.8 + targetVib * 0.2).toFixed(3));
            dev.sensors.filament_current.val = Number((dev.sensors.filament_current.val * 0.8 + targetFil * 0.2).toFixed(2));
        }

        // Push to history
        if (pushToHistory) {
            Object.keys(dev.sensors).forEach(key => {
                const s = dev.sensors[key];
                s.hist.push(s.val);
                if (s.hist.length > 100) {
                    s.hist.shift();
                }
            });
        }
    }
}
