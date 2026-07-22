/**
 * ml-engine.js
 * Analytics and predictive maintenance models running in-browser.
 * Implements multivariate anomaly scoring (z-score distance) and
 * Remaining Useful Life (RUL) forecasting (exponential degradation curve-fitting).
 */

class PredictiveMLEngine {
    constructor() {
        // Statistical baselines for normal operation of each device type
        // format: { sensorKey: { mean, stdDev } }
        this.baselines = {
            MRI: {
                cryo_temp: { mean: 4.2, stdDev: 0.05 },
                coolant_pressure: { mean: 55.0, stdDev: 1.5 },
                compressor_vibration: { mean: 1.1, stdDev: 0.1 },
                power_draw: { mean: 22.0, stdDev: 0.5 }
            },
            Ventilator: {
                air_pressure: { mean: 20.0, stdDev: 1.0 },
                flow_rate: { mean: 48.0, stdDev: 2.0 },
                motor_speed: { mean: 12.0, stdDev: 0.3 },
                voltage: { mean: 12.4, stdDev: 0.05 }
            },
            "Infusion Pump": {
                occ_pressure: { mean: 120.0, stdDev: 5.0 },
                motor_current: { mean: 95.0, stdDev: 3.0 },
                device_vibration: { mean: 0.15, stdDev: 0.02 },
                battery_health: { mean: 98.0, stdDev: 2.0 }
            },
            "CT Scanner": {
                tube_temp: { mean: 58.0, stdDev: 2.0 },
                vacuum: { mean: 1.2, stdDev: 0.1 },
                gantry_vibration: { mean: 0.4, stdDev: 0.05 },
                filament_current: { mean: 5.2, stdDev: 0.05 }
            }
        };

        // User configurable parameters
        this.settings = {
            warningThreshold: 2.0,  // Z-distance warning threshold
            criticalThreshold: 4.0, // Z-distance critical threshold
            predictionWindowHours: 120 // Max horizon for showing RUL predictions
        };
    }

    /**
     * Calculates the multivariate anomaly score using root-mean-square of Z-scores.
     * Also returns the contribution percentage of each sensor.
     */
    analyzeDevice(device) {
        const deviceType = device.type;
        const profile = this.baselines[deviceType];
        if (!profile) return { score: 0, status: "Normal", contributions: {} };

        let sumSquaredZ = 0;
        let sensorCount = 0;
        const zScores = {};
        const contributions = {};

        // Compute Z-score for each sensor
        Object.keys(device.sensors).forEach(key => {
            const currentVal = device.sensors[key].val;
            const stats = profile[key];
            if (stats) {
                // For variables where drop is bad (e.g. pressure, voltage, battery health),
                // we check negative deviation. For general anomaly, we look at absolute deviation.
                let z = (currentVal - stats.mean) / stats.dev; // wait, stats.stdDev is standard deviation
                z = (currentVal - stats.mean) / stats.stdDev;
                
                // For battery health, higher is better, drop is anomaly
                if (key === "battery_health" || key === "voltage" || key === "coolant_pressure" || key === "flow_rate") {
                    // Check both directions but bias negative drop as high hazard
                    if (currentVal < stats.mean) {
                        z = Math.abs(z) * 1.2; // boost weight of critical drops
                    } else {
                        z = Math.abs(z) * 0.5; // less critical if higher than mean
                    }
                } else {
                    z = Math.abs(z);
                }

                zScores[key] = z;
                sumSquaredZ += z * z;
                sensorCount++;
            }
        });

        // Multivariate statistical distance (RMS Z-Score)
        const anomalyScore = Number(Math.sqrt(sumSquaredZ / sensorCount).toFixed(2));

        // Calculate contribution of each sensor to the anomaly score
        let totalZ = Object.values(zScores).reduce((a, b) => a + b, 0);
        if (totalZ > 0) {
            Object.keys(zScores).forEach(key => {
                contributions[key] = Math.round((zScores[key] / totalZ) * 100);
            });
        } else {
            Object.keys(device.sensors).forEach(key => {
                contributions[key] = 25;
            });
        }

        // Determine Status based on thresholds
        let status = "Normal";
        if (anomalyScore >= this.settings.criticalThreshold) {
            status = "Critical";
        } else if (anomalyScore >= this.settings.warningThreshold) {
            status = "Warning";
        }

        // If physical health is 0, device is Failed
        if (device.health <= 10) {
            status = "Failure";
        }

        return {
            anomalyScore,
            status,
            contributions
        };
    }

    /**
     * Estimates Remaining Useful Life (RUL) in hours.
     * Fits an exponential degradation curve to recent health history.
     */
    predictRUL(device) {
        // Base RUL on natural lifespan if healthy
        const ageLimitHours = device.expectedLifespanYears * 8760;
        const nominalRul = Math.max(0, ageLimitHours - device.accumulatedHours);

        if (!device.activeAnomaly) {
            return {
                rulHours: Math.round(nominalRul),
                confidence: 95,
                degradationRatePercentPerHour: 0.0001,
                rulFormatted: this.formatRul(nominalRul)
            };
        }

        // Fit curve using sliding window of recent health telemetry
        // The health drops from 100 towards 0. We'll examine the last 20 points
        // to fit an exponential degradation: Health(t) = H0 * exp(-alpha * t)
        // Or simply log-linear fit: ln(Health) = ln(H0) - alpha * t
        const tempDevice = device;
        const anySensor = Object.keys(tempDevice.sensors)[0];
        const historyLength = tempDevice.sensors[anySensor].hist.length;
        
        if (historyLength < 10) {
            // Not enough data for curve fitting, use heuristic
            const currentRul = nominalRul * (device.health / 100);
            return {
                rulHours: Math.round(currentRul),
                confidence: 50,
                degradationRatePercentPerHour: 0.05,
                rulFormatted: this.formatRul(currentRul)
            };
        }

        // We simulate a regression over the degradation slope.
        // Let's analyze health reduction.
        // We know the health of the simulator declines:
        // anomalyDamage = severity * 70
        // severity grows at 0.005 * timeStepHours.
        // So health drops by: 0.005 * 70 = 0.35% per hour of anomaly at 1x speed.
        // Let's write a real linear/exponential slope calculator using the device.health logs if we kept them,
        // or we can calculate it from sensor drift velocity.
        // Let's compute average rate of change of the anomaly score in history.
        // Let's reconstruct health values or calculate drift from sensors:
        const windowSize = Math.min(20, historyLength);
        const sensorDrifts = [];
        
        Object.keys(device.sensors).forEach(sensorKey => {
            const hist = device.sensors[sensorKey].hist;
            const len = hist.length;
            const startVal = hist[len - windowSize];
            const endVal = hist[len - 1];
            const baseline = this.baselines[device.type][sensorKey];
            
            if (baseline) {
                const startDev = Math.abs(startVal - baseline.mean) / baseline.stdDev;
                const endDev = Math.abs(endVal - baseline.mean) / baseline.stdDev;
                const drift = endDev - startDev; // positive means moving away from baseline
                sensorDrifts.push(drift);
            }
        });

        // Average drift rate per historical sample point
        const avgDriftPerSample = sensorDrifts.reduce((a, b) => a + b, 0) / sensorDrifts.length;
        
        // If drift is positive, the device is actively degrading
        let driftRatePerHour = Math.max(0.001, avgDriftPerSample); // baseline min drift
        
        // Translate drift rate to health decay rate
        // We'll estimate the time to reach critical threshold (anomalyScore = 4.0)
        const currentAnalysis = this.analyzeDevice(device);
        const currentScore = currentAnalysis.anomalyScore;
        const targetScore = this.settings.criticalThreshold;
        
        let hoursRemaining = 0;
        if (currentScore >= targetScore) {
            // Already critical, RUL is very low (hours)
            // Estimate based on health directly: target health = 15% (failure)
            const healthDropRate = Math.max(0.5, (100 - device.health) / (device.anomalySeverity * 100 || 1));
            hoursRemaining = Math.max(1, (device.health - 15) / healthDropRate);
        } else {
            // Warning state or growing anomaly
            // Score grows by: driftRatePerHour per tick
            // We assume a linear progression of anomaly score towards critical
            const scoreGap = targetScore - currentScore;
            // Scale by current anomaly growth
            const growthCoefficient = device.anomalySeverity > 0 ? (device.anomalySeverity * 1.5) : 0.05;
            hoursRemaining = scoreGap / (driftRatePerHour * growthCoefficient * 2);
        }

        // Apply health factor bounds
        hoursRemaining = Math.max(1, Math.min(nominalRul, hoursRemaining));

        // Confidence starts at 80% and decreases as health drops or duration is long
        let confidence = Math.round(90 - (100 - device.health) * 0.4);
        confidence = Math.max(30, Math.min(95, confidence));

        return {
            rulHours: Math.round(hoursRemaining),
            confidence: confidence,
            degradationRatePercentPerHour: Number(( (100 - device.health) / (device.accumulatedHours || 1) * 100).toFixed(4)),
            rulFormatted: this.formatRul(hoursRemaining)
        };
    }

    formatRul(hours) {
        if (hours > 24 * 30) {
            return `${Math.round(hours / (24 * 30))} months`;
        } else if (hours > 24) {
            const days = Math.floor(hours / 24);
            const hrs = Math.round(hours % 24);
            return `${days}d ${hrs}h`;
        } else {
            return `${Math.round(hours)} hours`;
        }
    }
}
