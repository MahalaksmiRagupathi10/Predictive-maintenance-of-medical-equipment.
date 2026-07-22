# MedMaint AI: Predictive Maintenance of Medical Equipment

MedMaint AI is a high-fidelity interactive simulation and analytics dashboard for the predictive maintenance of medical equipment. It allows clinical engineers and hospital administrators to monitor equipment telemetry, forecast failures in real-time, sandbox anomaly detector thresholds, and manage preventive service dispatching.

---

## 🛠️ Technology Stack
*   **Core**: HTML5 structure & Vanilla ES6 Javascript.
*   **Styling**: Vanilla CSS3 featuring a premium dark glassmorphism dashboard layout, custom typography (`Outfit` and `Inter` from Google Fonts), fluid hover-state transitions, and alarm animations.
*   **Telemetry Line Plotting**: Rendered dynamically using Chart.js (loaded via CDN).
*   **Runtime Requirements**: **Zero**. Runs completely client-side in the browser. No Node.js or Python runtime installations are needed. Simply open `index.html` in any web browser!

---

## 📈 Embedded Predictive Maintenance Algorithms

The system implements two distinct mathematics-driven models running locally inside the browser:

### 1. Multivariate Anomaly Score (Z-Score Distance)
Rather than relying on isolated static alert thresholds, the system computes the statistical distance of all telemetry inputs relative to historical baseline distributions (mean and standard deviation). The anomaly score is computed as the Root-Mean-Square (RMS) of Z-scores across all $N$ device-specific sensors:

$$D(\mathbf{x}) = \sqrt{\frac{1}{N} \sum_{i=1}^{N} \left( \frac{x_i - \mu_i}{\sigma_i} \right)^2}$$

Where:
*   $x_i$: The live sensor reading.
*   $\mu_i$: The baseline sensor mean under healthy conditions.
*   $\sigma_i$: The baseline sensor standard deviation.
*   $N$: Number of operational sensors on the device.

**Alert Severity Thresholds:**
*   **Normal**: $D(\mathbf{x}) < 2.0$ (User adjustable)
*   **Warning**: $2.0 \le D(\mathbf{x}) < 4.0$ (Indicates sensor drift, begins pre-emptive scheduling)
*   **Critical**: $D(\mathbf{x}) \ge 4.0$ (Component failure imminent, triggers service ticket)

---

### 2. Remaining Useful Life (RUL) Forecasting
When a sensor drift is detected, the predictive engine calculates the drift velocity of each telemetry signal. It uses an exponential decay curve to estimate the trajectory of the device's health index:

$$\text{Health}(t) = H_0 \cdot e^{-\alpha \cdot t}$$

Where:
*   $H_0$: Current health index (100%).
*   $\alpha$: Dynamic degradation coefficient. It is calculated via log-linear regression over a rolling-window history (last 20 sample ticks) of telemetry drift velocities.
*   $t$: Simulated operating time.

The forecasted RUL represents the simulated time remaining before the Health index falls below the catastrophic failure threshold (15%). If no anomalies are active, the system calculates RUL based on nominal age-related wear relative to expected lifespan.

---

## 📋 Simulating Medical Equipment Profiles

MedMaint AI monitors four common classes of medical devices:

1.  **MRI Scanner (High-Field 3T)**:
    *   *Sensors*: Cryogen Helium Temp (K), Coolant Pressure (PSI), Compressor Vibration (mm/s), Compressor Power Draw (kW).
    *   *Failures*: Helium Coolant Leak (pressure drop, cooling loss), Compressor Bearing Wear (vibration spike, power surge).
2.  **ICU Ventilator (Turbine-driven)**:
    *   *Sensors*: Air pressure ($\text{cmH}_2\text{O}$), Airflow Rate (L/min), Turbine Speed (kRPM), Battery backup (V).
    *   *Failures*: Solenoid Valve Contamination (occlusion, high pressure), Turbine Rotor Friction (low flow, high current).
3.  **Syringe Infusion Pump**:
    *   *Sensors*: Tube Occlusion Pressure (mmHg), Motor Current (mA), Pump Vibration (mm/s), Battery health (%).
    *   *Failures*: Gear Motor Friction (power drain, vibration), Patient Line Occlusion (rapid pressure rise).
4.  **CT Scanner / X-Ray Tube**:
    *   *Sensors*: Tube Anode Temp (°C), Vacuum Level (nTorr), Gantry Vibration (mm/s), Filament Current (A).
    *   *Failures*: Tube Vacuum Degradation (arcing, heat), Rotary Gantry Rotor Drift (vibration).

---

## 🕹️ Interactive Features in the Command Center

*   **Fleet Dashboard**: Overview metrics showing average fleet health, countdown to next service, and an active alert feed.
*   **Device Monitor**: Visualizes the detailed health profile of a single device. Interactive Chart.js graphs render live scrolling sensor data, health gauge rings, and real-time ML diagnostic summaries.
*   **Simulation Lab**: Allows users to dilate time (1x, 5x, 24x, 168x speed) to observe aging, select a target device, and manually inject failures. A rolling diagnostic console prints real-time logs of system operations.
*   **ML Model Sandbox**: Explains the math and displays dynamic sensor weight charts (which sensors contribute most to the anomaly). Offers interactive range sliders to adjust Warning and Critical thresholds to evaluate model sensitivity.
*   **Maintenance Logs**: Displays dispatch tickets recommending specific engineering tasks (e.g., "Check helium compression seals"). Dispatching an engineer fixes the machine, resets the telemetry history, and logs the service in the history archive.
*   **Export Fleet Dataset**: Generates and downloads a custom CSV file containing historical telemetry, anomaly scores, health indices, and device states (perfect for training offline Python ML models!).

---

## 🚀 How to Run the Application
1.  Navigate to the repository folder: `c:\Users\MAHALAKSHMI\OneDrive\Documents\medical equipment\predictive maintenance of medical equipment`
2.  Locate the file `index.html`.
3.  Double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.
4.  Enjoy the fully interactive, responsive predictive maintenance model!
