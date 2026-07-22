/**
 * diagnostics-engine.js
 * Handles dynamic diagnostic database, autocomplete inputs, live simulator synchronization,
 * components mapping, interactive checklist, and action plans for medical equipment.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Comprehensive Equipment Profiles Database
    const EQUIPMENT_DATABASE = {
        "mri scanner": {
            name: "MRI Scanner (Magnetic Resonance Imaging)",
            aliases: ["mri", "mri machine", "magnetic resonance imaging", "mri-001"],
            workingPrinciple: "Uses a superconducting electromagnet coupled with radiofrequency (RF) pulses to temporarily realign hydrogen nuclei (protons) in patient tissues. As protons relax back to their alignment, they emit radio signals that are detected by receiver coils and computed into high-contrast anatomical cross-sections.",
            components: [
                "Superconducting Magnet",
                "Gradient Coils",
                "RF Coils (Transmitters/Receivers)",
                "Cryogenic Helium Compressor",
                "Helium Coldhead & Cryostat",
                "Cooling Fluid Pump",
                "RF Shielded Room Shielding",
                "Patient Table Assembly"
            ],
            sensors: [
                { name: "Cryogen Temperature", key: "cryo_temp", unit: "K" },
                { name: "Coolant Pressure", key: "coolant_pressure", unit: "PSI" },
                { name: "Compressor Vibration", key: "compressor_vibration", unit: "mm/s" },
                { name: "Main Power Draw", key: "power_draw", unit: "kW" }
            ],
            faults: [
                { name: "Liquid Helium Boil-off / Leak", cause: "Vacuum seal decay or pressure valve malfunction leading to temperature rises.", severity: "Critical" },
                { name: "Compressor Bearing Mechanical Friction", cause: "Mechanical wear in the cryo compressor rotor resulting in thermal loading.", severity: "Warning" },
                { name: "Gradient Coil Thermal Stress", cause: "Prolonged duty cycle without sufficient water cooling loop flow.", severity: "Warning" }
            ],
            checklist: [
                "Verify liquid helium level is above 60% baseline",
                "Inspect cryo compressor vibration levels for bearing drift",
                "Check chilled water coolant supply pressure (48 - 62 PSI)",
                "Run RF noise test to check room shielding integrity",
                "Perform gradient field calibration sweep",
                "Verify safety quench valve path is clear of obstructions"
            ],
            schedulePreventive: "Daily RF receiver noise calibration, weekly liquid helium level audits, monthly cooling pump inspections, and semi-annual cryogenic compressor cartridge swaps.",
            recommendationPredictive: "Monitor cryogenic compressor vibration trends. If vibration Z-score exceeds 2.0 (above 1.5 mm/s), schedule cartridge seal servicing before a thermal quench hazard develops.",
            actionRecommended: "Refill liquid helium levels, tighten coolant line fittings, and recalibrate RF transmitter amplifiers.",
            defaultHealth: 98,
            defaultPriority: "Low",
            liveDeviceId: "MRI-001"
        },
        "ct scanner": {
            name: "CT Scanner (Computed Tomography)",
            aliases: ["ct", "ct scanner", "computed tomography", "rotary gantry", "ct-004"],
            workingPrinciple: "Employs a high-speed rotating gantry carrying an X-ray tube and opposed digital detector arrays. By rotating 360 degrees around the patient while emitting fan-beam radiation, the system records multiple projection data slices which are reconstructed mathematically into 3D volume views.",
            components: [
                "X-Ray Tube Insert",
                "Solid-State Detector Array",
                "Rotating Gantry Ring",
                "High-Voltage Generator",
                "Slip Ring Carbon Brushes",
                "Gantry Drive Belt & Motor",
                "Oil-to-Air Heat Exchanger",
                "Collimator Mechanism"
            ],
            sensors: [
                { name: "Anode Tube Temperature", key: "tube_temp", unit: "°C" },
                { name: "Vacuum Seal Level", key: "vacuum", unit: "nTorr" },
                { name: "Gantry Vibration Amplitude", key: "gantry_vibration", unit: "mm/s" },
                { name: "Filament Current", key: "filament_current", unit: "A" }
            ],
            faults: [
                { name: "Tube Vacuum Degradation", cause: "Micro-fissures in glass-metal seals causing air ingress and HV arcing.", severity: "Critical" },
                { name: "Slip Ring Carbon Dust Buildup", cause: "Continuous contact wear generating conductive dust and signal noise.", severity: "Warning" },
                { name: "Gantry Rotation Bearing Unbalance", cause: "Counterweight displacement or bearing decay causing mechanical drift.", severity: "Warning" }
            ],
            checklist: [
                "Perform X-ray tube seasoning warmup sequence",
                "Measure slip ring carbon brush wear and clean carbon deposits",
                "Check gantry drive belt tension and inspect for cracks",
                "Inspect heat exchanger radiator vents and test cooling fans",
                "Verify anode heat storage capacity calibration",
                "Perform water phantom slice thickness and noise calibration"
            ],
            schedulePreventive: "Daily tube calibration scan, weekly slip ring cleaning, monthly gantry balance test, quarterly collimator alignments, and annual generator dielectric oil testing.",
            recommendationPredictive: "Track tube vacuum levels. If vacuum climbs above 2.0 nTorr, schedule tube degassing or seasoning to prevent catastrophic high-voltage breakdown.",
            actionRecommended: "Run gantry bearing lubrication, replace slip ring carbon brushes, and verify generator focal spot calibration.",
            defaultHealth: 97,
            defaultPriority: "Low",
            liveDeviceId: "CT-004"
        },
        "icu ventilator": {
            name: "ICU Ventilator (Respirator)",
            aliases: ["ventilator", "icu ventilator", "respirator", "vent-002"],
            workingPrinciple: "Delivers breathing gas mixture to a patient via mechanical controls. Uses an internal turbine system or gas blender, mixing high-pressure oxygen and compressed air. Dynamic valve regulators adjust flow rate, pressure, and tidal volume in response to active patient monitoring loops.",
            components: [
                "Turbine Compressor Motor",
                "Oxygen-Air Gas Mixer",
                "Solenoid Flow Valves",
                "Exhalation Valve Assembly",
                "Oxygen Concentration Cell",
                "Humidifier Chamber",
                "Backup Battery Pack",
                "Expiratory Flow Sensor Cartridge"
            ],
            sensors: [
                { name: "Airway Pressure", key: "air_pressure", unit: "cmH2O" },
                { name: "Airflow Rate", key: "flow_rate", unit: "L/min" },
                { name: "Turbine Speed", key: "motor_speed", unit: "kRPM" },
                { name: "Battery Output Voltage", key: "voltage", unit: "V" }
            ],
            faults: [
                { name: "Oxygen Gas Mixer Occlusion", cause: "Particulate buildup inside the gas inlet filter screens.", severity: "Critical" },
                { name: "Turbine Rotor Frictional Loading", cause: "Bearing friction in high-RPM motor reducing flow capacity.", severity: "Critical" },
                { name: "Expiratory Flow Sensor Contamination", cause: "Patient humidity condensing on thermal hot-wires, causing sensor drift.", severity: "Warning" }
            ],
            checklist: [
                "Perform pre-use circuit self-test (leak and compliance test)",
                "Calibrate oxygen concentration cell at 21% and 100% O2",
                "Inspect exhalation valve diaphragm seal for cracks",
                "Check turbine intake and bacterial filters for debris",
                "Verify alarms (patient disconnect, high pressure limit)",
                "Test backup battery supply hold-time (charge check)"
            ],
            schedulePreventive: "Daily circuit sterilizations, weekly O2 cell calibrations, monthly exhalation membrane changes, quarterly intake filter cleanings, and annual complete PM parts replacements.",
            recommendationPredictive: "Monitor turbine speed vs airflow rates. A rising RPM-to-flow ratio indicates airway blockage or turbine bearing decay. Replace blower before motor lockup.",
            actionRecommended: "Exchange exhalation flow sensor, clean turbine cooling ports, and calibrate gas delivery solenoids.",
            defaultHealth: 99,
            defaultPriority: "Low",
            liveDeviceId: "VENT-002"
        },
        "syringe infusion pump": {
            name: "Syringe Infusion Pump (Drug Delivery)",
            aliases: ["infusion pump", "syringe pump", "pump", "inf-003"],
            workingPrinciple: "Administers micro-dose fluids and medication intravenously. Driven by a high-resolution stepper motor connected to a lead screw assembly, which translates rotational steps into precise linear displacements against a loaded syringe plunger.",
            components: [
                "Stepper Motor Drive",
                "Plunger Lead Screw",
                "Syringe Size Detection Clamp",
                "Occlusion Force Strain Gauge",
                "Ultrasonic Bubble Sensor",
                "Keypad Input Membrane",
                "LCD Status Monitor",
                "Anti-Free-Flow Mechanism"
            ],
            sensors: [
                { name: "Occlusion Pressure", key: "occ_pressure", unit: "mmHg" },
                { name: "Motor Drive Current", key: "motor_current", unit: "mA" },
                { name: "Housing Vibration", key: "device_vibration", unit: "mm/s" },
                { name: "Battery Health State", key: "battery_health", unit: "%" }
            ],
            faults: [
                { name: "Lead Screw Drive Binding", cause: "Hardened grease or fiber contamination in the thread channels.", severity: "Warning" },
                { name: "Occlusion Sensor Calibration Shift", cause: "Mechanical creep in the plunger pressure transducer sensor.", severity: "Warning" },
                { name: "Ultrasonic Transmitter Degradation", cause: "Piezoelectric sensor aging in air bubble detectors.", severity: "Warning" }
            ],
            checklist: [
                "Test syringe barrel clamp size measurement sensors",
                "Verify occlusion alarm trigger force using pressure tester",
                "Perform ultrasonic bubble alarm verification (air lock check)",
                "Clean and lubricate linear slider and drive screw",
                "Inspect housing for fluid ingress or stress cracks",
                "Run battery capacity calibration cycle"
            ],
            schedulePreventive: "Weekly cleaning of plunger guides, monthly accuracy tests, quarterly lead screw grease applications, and annual electrical safety leakage scans.",
            recommendationPredictive: "Monitor motor current. A rise in idle current indicates drive train friction. Lubricate the drive screw before torque limits trigger false occlusion alerts.",
            actionRecommended: "Clean and grease lead screw, recalibrate plunger pressure sensor, and test battery charge cycle.",
            defaultHealth: 99,
            defaultPriority: "Low",
            liveDeviceId: "INF-003"
        },
        "x-ray machine": {
            name: "X-Ray Machine (Digital Radiography)",
            aliases: ["xray", "x-ray", "x-ray machine", "radiography"],
            workingPrinciple: "Generates high-energy electromagnetic radiation (X-rays) by accelerating electrons from a heated cathode filament onto a rotating tungsten anode target. The resultant photons pass through the patient onto a flat-panel digital detector, creating shadowgraphs based on differential tissue densities.",
            components: [
                "X-Ray Tube Insert",
                "Collimator Shutter Assembly",
                "Digital Flat Panel Detector",
                "High Voltage Tank/Generator",
                "Anti-Scatter Grid",
                "Articulated Tube Support Stand",
                "Exposure Hand-Switch",
                "Operator Control Console"
            ],
            sensors: [
                { name: "Tube Heat Load", key: "tube_heat", unit: "%" },
                { name: "Filament Current", key: "filament_curr", unit: "A" },
                { name: "Collimator Blade Shift", key: "collimator_align", unit: "mm" },
                { name: "Power Supply Voltage", key: "line_voltage", unit: "V" }
            ],
            faults: [
                { name: "Filament Thinning & Fracture", cause: "Evaporative loss of tungsten over prolonged exposure cycles.", severity: "Critical" },
                { name: "Collimator Shutter Misalignment", cause: "Gear slippage or motor drift in the light-field blades.", severity: "Warning" },
                { name: "Detector Scintillating Panel Aging", cause: "Radiation wear causing sensor pixel failures.", severity: "Warning" }
            ],
            checklist: [
                "Inspect tube casing for housing oil leaks",
                "Verify light field to radiation field congruence alignment",
                "Test exposure safety interlocks on laboratory doors",
                "Check digital detector calibration for dead pixels",
                "Measure high-voltage exposure timer accuracy",
                "Inspect lead shielding aprons and barriers for cracks"
            ],
            schedulePreventive: "Weekly digital flat-panel calibrations, monthly collimator light alignments, quarterly safety switch checks, semi-annual dose calibrations, and annual structural load audits.",
            recommendationPredictive: "Monitor filament current values. A drift in standby current indicates filament wear. Replace the tube insert before open-circuit failure triggers emergency down-time.",
            actionRecommended: "Recalibrate collimator blade motors, execute panel pixel mappings, and check power line surge filters.",
            defaultHealth: 96,
            defaultPriority: "Low",
            liveDeviceId: null
        },
        "ecg machine": {
            name: "ECG Machine (Electrocardiograph)",
            aliases: ["ecg", "ecg machine", "ekg", "electrocardiograph"],
            workingPrinciple: "Monitors electrical activity of the heart. Detects minute biopotential voltages on the patient's skin using adhesive electrodes. Amplifies, filters out electrical noise, and displays or prints the raw cardiac waveforms.",
            components: [
                "ECG Patient Trunk Cable",
                "Biopotential Amplifier Board",
                "Analog-to-Digital Converter",
                "Thermal Printhead Assembly",
                "Lead Wire Connectors",
                "Internal Charging Board",
                "Lead-Off Detection Circuit",
                "Liquid Crystal Display (LCD)"
            ],
            sensors: [
                { name: "Input Contact Impedance", key: "electrode_imp", unit: "kΩ" },
                { name: "Battery Charge Reserve", key: "charge_res", unit: "%" },
                { name: "Printer Head Temperature", key: "print_temp", unit: "°C" },
                { name: "System Noise Floor", key: "noise_floor", unit: "μV" }
            ],
            faults: [
                { name: "Patient Cable Copper Fatigue", cause: "Continuous flexing fracturing internal wire braids.", severity: "Warning" },
                { name: "Amplifier Channel Gain Drift", cause: "Thermal degradation of input resistors, distorting ECG waves.", severity: "Warning" },
                { name: "Thermal Printer Element Failure", cause: "Resistor wear in printhead line causing white streaks on paper.", severity: "Warning" }
            ],
            checklist: [
                "Verify lead wire electrical continuity and check insulation",
                "Clean thermal printer head with isopropyl alcohol pads",
                "Perform internal baseline test print calibration page",
                "Check lead-off alert thresholds with clinical simulator",
                "Measure safety patient leakage current with safety tester",
                "Calibrate input signal filters (50/60Hz notch, baseline filters)"
            ],
            schedulePreventive: "Daily cable inspections, weekly printer cleanings, monthly safety leakage checks, quarterly calibration testing, and annual rechargeable battery swaps.",
            recommendationPredictive: "Track system noise floor. A rise in baseline noise signals shielding decay or patient cable deterioration. Replace the trunk line before artifact noise corrupts clinical diagnostic ECGs.",
            actionRecommended: "Replace patient lead wire set, clean printer drive gears, and calibrate ADC gains.",
            defaultHealth: 98,
            defaultPriority: "Low",
            liveDeviceId: null
        },
        "ultrasound machine": {
            name: "Ultrasound Machine (Diagnostic Sonograph)",
            aliases: ["ultrasound", "ultrasound machine", "sonography", "echo"],
            workingPrinciple: "Propagates high-frequency ultrasound waves into internal organs using array transducers. As waves bounce off anatomical interfaces, returning echo signals are processed by a beamformer to render real-time grayscale or color Doppler visual images.",
            components: [
                "Piezoelectric Transducer Probe",
                "Digital Beamformer Card",
                "TGC Slide Control Panel",
                "Transducer Connector Ports",
                "Central Graphics Processor",
                "Control Keyboard/Trackball",
                "Power Distribution Unit",
                "Thermal Video Printer"
            ],
            sensors: [
                { name: "GPU/Processor Temp", key: "gpu_temp", unit: "°C" },
                { name: "Transducer Pulse Echo Peak", key: "echo_peak", unit: "V" },
                { name: "Power Supply Ripple", key: "power_ripple", unit: "mV" },
                { name: "Fan Exhaust Velocity", key: "fan_speed", unit: "RPM" }
            ],
            faults: [
                { name: "Piezo Crystal Element Dropout", cause: "Physical drops fracturing crystal arrays, leaving blind scan lines.", severity: "Warning" },
                { name: "Transducer Acoustic Lens Delamination", cause: "Chemical gel cleaning erosion separating acoustic matching layers.", severity: "Critical" },
                { name: "PDU Filter Capacitance Decay", cause: "Thermal drying of electrolytics, introducing noise artifacts.", severity: "Warning" }
            ],
            checklist: [
                "Inspect transducer acoustic face for cuts and lens swelling",
                "Perform air-scan pattern checks to search for dead crystal dropouts",
                "Clean system cooling intake foam filters",
                "Clean control console keyboard, trackball, and sliders",
                "Verify scan connection lock mechanism contacts",
                "Perform phantom scans for resolution and contrast checks"
            ],
            schedulePreventive: "Daily transducer disinfection checks, weekly cooling intake air filter cleanings, monthly phantom checks, quarterly safety testing, and semi-annual deep hardware diagnostic cycles.",
            recommendationPredictive: "Monitor echo peak voltages during self-calibration. A drop in peak voltage signals crystal depolarization or connection decay. Refurbish probe before imaging artifacts affect diagnoses.",
            actionRecommended: "Disassemble and clean trackball, replace delaminated probe lens, and swap cooling fans.",
            defaultHealth: 95,
            defaultPriority: "Low",
            liveDeviceId: null
        },
        "patient monitor": {
            name: "Patient Monitor (Multiparameter Monitor)",
            aliases: ["patient monitor", "monitor", "vital signs monitor"],
            workingPrinciple: "Consolidates and monitors patient vital signs. Integrates modular interfaces for NIBP blood pressure pumps, pulse oximetry, ECG leads, and temperature probes. Continuously processes these biosignals to drive displays and alarm triggers.",
            components: [
                "Main System Processor",
                "NIBP Air Compressor Pump",
                "NIBP Cuff Inflation Valve",
                "SpO2 Optical LED Driver",
                "ECG Biosignal Interface",
                "Backup Battery Module",
                "High-Decibel Speaker Horn",
                "Display Screen Panel"
            ],
            sensors: [
                { name: "NIBP Manifold Pressure", key: "nibp_press", unit: "mmHg" },
                { name: "SpO2 Signal Strength", key: "spo2_signal", unit: "mA" },
                { name: "Board Enclosure Temp", key: "board_temp", unit: "°C" },
                { name: "Battery Backup Charge", key: "batt_charge", unit: "%" }
            ],
            faults: [
                { name: "NIBP Pump Compressor Failure", cause: "Piston ring degradation in the NIBP micro-compressor.", severity: "Warning" },
                { name: "SpO2 Red/IR LED Intensity Decay", cause: "Optical diode wear reducing emitter light power output.", severity: "Warning" },
                { name: "NIBP Valve Manifold Air Leak", cause: "Dry rot in internal rubber tubes or check-valve dirt.", severity: "Warning" }
            ],
            checklist: [
                "Inspect patient cabling and SpO2 sensor clips for physical damage",
                "Calibrate NIBP manometer pressure gauge against standard reference",
                "Verify alarm audio sound volume output and visual alerts",
                "Clean cabinet casing surfaces and verify battery backup kick-in",
                "Perform leakage safety test on patient modules",
                "Verify NIBP cuff bladder inflation and check for slow leaks"
            ],
            schedulePreventive: "Daily sensor lead cleanings, weekly alarm checks, monthly NIBP calibration audits, quarterly safety leakage tests, and annual battery checks.",
            recommendationPredictive: "Monitor NIBP inflation timings. A rise in inflation duration beyond 15 seconds indicating slow pneumatic leaks or compressor wear. Inspect hose lines and cuffs.",
            actionRecommended: "Replace SpO2 sensor cable, swap leaking NIBP bladder cuff, and replace internal backup battery.",
            defaultHealth: 97,
            defaultPriority: "Low",
            liveDeviceId: null
        }
    };

    // 2. Master list of components for absent checking
    const MASTER_COMPONENTS = [
        "Superconducting Magnet", "Gradient Coils", "RF Coils (Transmitters/Receivers)",
        "Cryogenic Helium Compressor", "Helium Coldhead & Cryostat", "Cooling Fluid Pump",
        "RF Shielded Room Shielding", "X-Ray Tube Insert", "Solid-State Detector Array",
        "Rotating Gantry Ring", "High-Voltage Generator", "Slip Ring Carbon Brushes",
        "Gantry Drive Belt & Motor", "Oil-to-Air Heat Exchanger", "Collimator Mechanism",
        "Digital Flat Panel Detector", "Anti-Scatter Grid", "ECG Patient Trunk Cable",
        "Biopotential Amplifier Board", "Thermal Printhead Assembly", "Turbine Compressor Motor",
        "Oxygen-Air Gas Mixer", "Solenoid Flow Valves", "Exhalation Valve Assembly",
        "Oxygen Concentration Cell", "Expiratory Flow Sensor Cartridge", "Piezoelectric Transducer Probe",
        "Digital Beamformer Card", "TGC Slide Control Panel", "NIBP Air Compressor Pump",
        "NIBP Cuff Inflation Valve", "SpO2 Optical LED Driver", "Stepper Motor Plunger",
        "Plunger Lead Screw", "Ultrasonic Bubble Sensor"
    ];

    // Keep track of active interactive checklists status
    const checklistState = {};

    // 3. UI References
    const searchInput = document.getElementById("diag-search-input");
    const suggestionsBox = document.getElementById("diag-search-suggestions");
    const dropdownSelect = document.getElementById("diag-select-dropdown");
    const btnAnalyze = document.getElementById("btn-diag-analyze");

    const emptyState = document.getElementById("diag-empty-state");
    const resultsContainer = document.getElementById("diag-results-container");

    const healthVal = document.getElementById("diag-health-val");
    const healthSubtext = document.getElementById("diag-health-subtext");
    const statusBadge = document.getElementById("diag-status-badge");
    const liveTag = document.getElementById("diag-live-tag");

    const priorityVal = document.getElementById("diag-priority-val");
    const priorityBadge = document.getElementById("diag-priority-badge");
    const prioritySubtext = document.getElementById("diag-priority-subtext");

    const compSummary = document.getElementById("diag-comp-summary");
    const sensorSummary = document.getElementById("diag-sensor-summary");
    const liveRulRow = document.getElementById("diag-live-rul-row");
    const liveRulVal = document.getElementById("diag-live-rul-val");

    const workingPrincipleText = document.getElementById("diag-working-principle");
    const componentsPresentList = document.getElementById("diag-components-present");
    const componentsAbsentList = document.getElementById("diag-components-absent");
    const sensorsListGrid = document.getElementById("diag-sensors-list");
    const faultsListContainer = document.getElementById("diag-faults-list");
    const checklistContainer = document.getElementById("diag-checklist");

    const schedulePreventiveText = document.getElementById("diag-schedule-preventive");
    const recommendationPredictiveText = document.getElementById("diag-recommendation-predictive");
    const actionRecommendedText = document.getElementById("diag-action-recommended");

    let liveUpdateIntervalId = null;
    let activeEquipmentKey = null;

    // 4. Autocomplete Event Listeners
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length === 0) {
            suggestionsBox.classList.remove("active");
            suggestionsBox.innerHTML = "";
            return;
        }

        const matches = Object.keys(EQUIPMENT_DATABASE).filter(key => {
            const item = EQUIPMENT_DATABASE[key];
            return item.name.toLowerCase().includes(query) || 
                   item.aliases.some(alias => alias.toLowerCase().includes(query));
        });

        if (matches.length > 0) {
            suggestionsBox.innerHTML = "";
            matches.forEach(matchKey => {
                const item = EQUIPMENT_DATABASE[matchKey];
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.textContent = item.name;
                div.addEventListener("click", () => {
                    searchInput.value = item.name;
                    dropdownSelect.value = matchKey;
                    suggestionsBox.classList.remove("active");
                    triggerAnalysis(matchKey);
                });
                suggestionsBox.appendChild(div);
            });
            suggestionsBox.classList.add("active");
        } else {
            // No direct matches, but user could type a custom device name
            suggestionsBox.innerHTML = "";
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.style.fontStyle = "italic";
            div.textContent = `Analyze Custom Device: "${e.target.value}"`;
            div.addEventListener("click", () => {
                suggestionsBox.classList.remove("active");
                triggerCustomAnalysis(e.target.value);
            });
            suggestionsBox.appendChild(div);
            suggestionsBox.classList.add("active");
        }
    });

    // Close suggestions box when clicking outside
    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.classList.remove("active");
        }
    });

    // Dropdown change listener
    dropdownSelect.addEventListener("change", (e) => {
        const key = e.target.value;
        if (key && EQUIPMENT_DATABASE[key]) {
            searchInput.value = EQUIPMENT_DATABASE[key].name;
            triggerAnalysis(key);
        }
    });

    // Analyze button click listener
    btnAnalyze.addEventListener("click", () => {
        const textValue = searchInput.value.trim();
        const dropValue = dropdownSelect.value;

        if (dropValue && EQUIPMENT_DATABASE[dropValue]) {
            triggerAnalysis(dropValue);
        } else if (textValue.length > 0) {
            // Find key match
            const keyMatch = Object.keys(EQUIPMENT_DATABASE).find(key => {
                const item = EQUIPMENT_DATABASE[key];
                return item.name.toLowerCase() === textValue.toLowerCase() ||
                       item.aliases.some(alias => alias.toLowerCase() === textValue.toLowerCase());
            });

            if (keyMatch) {
                triggerAnalysis(keyMatch);
            } else {
                triggerCustomAnalysis(textValue);
            }
        }
    });

    // 5. Normal Analysis Execution
    function triggerAnalysis(key) {
        if (liveUpdateIntervalId) {
            clearInterval(liveUpdateIntervalId);
            liveUpdateIntervalId = null;
        }

        activeEquipmentKey = key;
        const eqData = EQUIPMENT_DATABASE[key];

        // Hide empty state, show results
        emptyState.style.display = "none";
        resultsContainer.style.display = "flex";

        // Check if there is an active simulator mapping
        if (eqData.liveDeviceId && window.simulatorInstance) {
            // Dynamic Live Update Loop
            updateDiagnosticValuesFromSimulator(key);
            liveUpdateIntervalId = setInterval(() => {
                updateDiagnosticValuesFromSimulator(key);
            }, 1000);
        } else {
            // Static display
            liveTag.style.display = "none";
            liveRulRow.style.display = "none";

            // Static Health & Status badge
            healthVal.textContent = `${eqData.defaultHealth}%`;
            healthSubtext.textContent = "Standard baseline health score";
            
            statusBadge.className = "status-badge normal";
            statusBadge.textContent = "Healthy";

            // Static Priority
            priorityVal.textContent = "Standard Care";
            priorityVal.style.color = "var(--color-normal)";
            priorityBadge.className = "priority-badge low";
            priorityBadge.textContent = "LOW";
            prioritySubtext.textContent = "Standard scheduled maintenance checks";

            // Static sensors count
            sensorSummary.textContent = `${eqData.sensors.length} Active Sensors`;

            // Static text fields
            schedulePreventiveText.textContent = eqData.schedulePreventive;
            recommendationPredictiveText.textContent = eqData.recommendationPredictive;
            actionRecommendedText.textContent = eqData.actionRecommended;

            // Render static sensors badge layout
            renderSensorsStatic(eqData.sensors);
        }

        // Common components mapping, faults and checklist
        workingPrincipleText.textContent = eqData.workingPrinciple;
        renderComponentsList(eqData.components);
        renderFaultsList(eqData.faults);
        renderChecklist(key, eqData.checklist);

        // Scroll view to results container
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 6. Custom typed analysis (Dynamic Heuristic Generator)
    function triggerCustomAnalysis(customName) {
        if (liveUpdateIntervalId) {
            clearInterval(liveUpdateIntervalId);
            liveUpdateIntervalId = null;
        }

        // Clean name
        const cleanName = customName.replace(/[^\w\s-]/g, '').trim();
        activeEquipmentKey = `custom_${cleanName.toLowerCase()}`;

        // Heuristic detection based on matching letters
        const lowerName = cleanName.toLowerCase();
        let baseTemplate = null;

        if (lowerName.includes("mri") || lowerName.includes("magnetic")) {
            baseTemplate = EQUIPMENT_DATABASE["mri scanner"];
        } else if (lowerName.includes("ct") || lowerName.includes("gantry") || lowerName.includes("tomography")) {
            baseTemplate = EQUIPMENT_DATABASE["ct scanner"];
        } else if (lowerName.includes("vent") || lowerName.includes("respirator") || lowerName.includes("anesthesia")) {
            baseTemplate = EQUIPMENT_DATABASE["icu ventilator"];
        } else if (lowerName.includes("pump") || lowerName.includes("infusion") || lowerName.includes("syringe")) {
            baseTemplate = EQUIPMENT_DATABASE["syringe infusion pump"];
        } else if (lowerName.includes("xray") || lowerName.includes("x-ray") || lowerName.includes("radiography")) {
            baseTemplate = EQUIPMENT_DATABASE["x-ray machine"];
        } else if (lowerName.includes("ecg") || lowerName.includes("ekg") || lowerName.includes("cardiograph")) {
            baseTemplate = EQUIPMENT_DATABASE["ecg machine"];
        } else if (lowerName.includes("ultrasound") || lowerName.includes("sonar") || lowerName.includes("probe") || lowerName.includes("echo")) {
            baseTemplate = EQUIPMENT_DATABASE["ultrasound machine"];
        } else if (lowerName.includes("monitor") || lowerName.includes("vital")) {
            baseTemplate = EQUIPMENT_DATABASE["patient monitor"];
        }

        // Generate synthetic data
        let syntheticProfile = {};
        if (baseTemplate) {
            // Inherit template values
            syntheticProfile = {
                name: `${cleanName} (Custom Profile)`,
                workingPrinciple: baseTemplate.workingPrinciple,
                components: [...baseTemplate.components],
                sensors: [...baseTemplate.sensors],
                faults: [...baseTemplate.faults],
                checklist: [...baseTemplate.checklist],
                schedulePreventive: baseTemplate.schedulePreventive,
                recommendationPredictive: baseTemplate.recommendationPredictive,
                actionRecommended: baseTemplate.actionRecommended,
                defaultHealth: baseTemplate.defaultHealth - 5, // slightly lower baseline confidence
                defaultPriority: baseTemplate.defaultPriority,
                liveDeviceId: null
            };
        } else {
            // General clinical hardware fallback profile
            syntheticProfile = {
                name: `${cleanName} (General Medical Device)`,
                workingPrinciple: `The ${cleanName} operates as a micro-controlled medical appliance utilizing electronic sensors and signal filtration modules. It monitors and calibrates operational output values dynamically to ensure electrical safety and compliance under continuous clinical workflows.`,
                components: [
                    "Main Controller Motherboard",
                    "Switched Mode Power Supply (SMPS)",
                    "Internal Battery Pack (UPS)",
                    "LCD Graphic Display Panel",
                    "Sensor Interface Board",
                    "Signal Conditioning Amplifier"
                ],
                sensors: [
                    { name: "Enclosure Core Temperature", key: "custom_temp", unit: "°C" },
                    { name: "Input Current Load", key: "custom_current", unit: "mA" },
                    { name: "Signal Noise Floor", key: "custom_noise", unit: "μV" }
                ],
                faults: [
                    { name: "Power Supply Thermal Overload", cause: "Dust clogging ventilation vents or capacitor wear causing power ripple.", severity: "Warning" },
                    { name: "Internal System Gain Calibration Drift", cause: "Biosignal pre-amp resistors drifting under continuous heat cycles.", severity: "Warning" },
                    { name: "Rechargeable Lithium Battery Degradation", cause: "Continuous trickle charge causing cell internal resistance rise.", severity: "Warning" }
                ],
                checklist: [
                    "Inspect chassis enclosure for liquid ingress or structural cracks",
                    "Measure power supply outlet voltage calibration stability",
                    "Test display screen backlight brightness and touch grids",
                    "Run internal calibration diagnostics self-test cycle",
                    "Inspect power cord insulation and verify fuse rating integrity",
                    "Check backup battery performance in power outage simulation"
                ],
                schedulePreventive: "Weekly surface cleaning and diagnostic self-tests, monthly battery checks, and annual electrical safety leakage certifications.",
                recommendationPredictive: "Monitor internal heat dissipation. If core heat drifts upwards under normal cooling fan RPMs, schedule exhaust filter cleaning.",
                actionRecommended: "Inspect internal fuses, grease mechanical sliders (if applicable), and clear dust blocks from exhaust grills.",
                defaultHealth: 95,
                defaultPriority: "Low",
                liveDeviceId: null
            };
        }

        // Hide empty state, show results
        emptyState.style.display = "none";
        resultsContainer.style.display = "flex";
        liveTag.style.display = "none";
        liveRulRow.style.display = "none";

        // Populate details
        healthVal.textContent = `${syntheticProfile.defaultHealth}%`;
        healthSubtext.textContent = "Estimated custom equipment health baseline";
        
        statusBadge.className = "status-badge normal";
        statusBadge.textContent = "Healthy";

        priorityVal.textContent = "Standard Care";
        priorityVal.style.color = "var(--color-normal)";
        priorityBadge.className = "priority-badge low";
        priorityBadge.textContent = "LOW";
        prioritySubtext.textContent = "Standard care profile. No active degradation anomalies detected.";

        workingPrincipleText.textContent = syntheticProfile.workingPrinciple;
        schedulePreventiveText.textContent = syntheticProfile.schedulePreventive;
        recommendationPredictiveText.textContent = syntheticProfile.recommendationPredictive;
        actionRecommendedText.textContent = syntheticProfile.actionRecommended;

        // Render sections
        renderComponentsList(syntheticProfile.components);
        renderSensorsStatic(syntheticProfile.sensors);
        renderFaultsList(syntheticProfile.faults);
        renderChecklist(activeEquipmentKey, syntheticProfile.checklist);

        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 7. Live Simulator Synchronization
    function updateDiagnosticValuesFromSimulator(key) {
        if (!window.simulatorInstance || !window.mlEngineInstance) return;

        const eqData = EQUIPMENT_DATABASE[key];
        const dev = window.simulatorInstance.getDevice(eqData.liveDeviceId);
        if (!dev) return;

        // Pull active prediction and status
        const analysis = window.mlEngineInstance.analyzeDevice(dev);
        const prediction = window.mlEngineInstance.predictRUL(dev);

        // 1. Live health & status
        healthVal.textContent = `${dev.health}%`;
        statusBadge.textContent = analysis.status;
        statusBadge.className = `status-badge ${analysis.status.toLowerCase()}`;
        
        liveTag.style.display = "inline-flex";
        healthSubtext.textContent = `Real-time health of Live Unit ${dev.id}`;

        // 2. Live Priority calculation
        let priority = "LOW";
        let priorityColor = "var(--color-normal)";
        let priorityName = "Standard Care";
        let priorityDesc = "All sensors within nominal baselines. No action required.";

        if (analysis.status === "Warning") {
            priority = "MEDIUM";
            priorityColor = "var(--color-warning)";
            priorityName = "Medium Priority";
            priorityDesc = "Predictive engine alert! Sensor deviations detected. Plan maintenance.";
        } else if (analysis.status === "Critical" || analysis.status === "Failure") {
            priority = "HIGH";
            priorityColor = "var(--color-critical)";
            priorityName = "High Priority";
            priorityDesc = "Urgent attention required! Severe telemetry decay. Dispatch engineer.";
        }

        priorityVal.textContent = priorityName;
        priorityVal.style.color = priorityColor;
        
        priorityBadge.className = `priority-badge ${priority.toLowerCase()}`;
        priorityBadge.textContent = priority;
        prioritySubtext.textContent = priorityDesc;

        // 3. Live RUL row
        liveRulRow.style.display = "flex";
        liveRulVal.textContent = dev.status === "Failure" ? "OFFLINE" : dev.rulText;
        liveRulVal.style.color = dev.health > 70 ? 'var(--color-cyan)' : dev.health > 40 ? 'var(--color-warning)' : 'var(--color-critical)';

        // 4. Live sensor readings rendering
        renderSensorsLive(dev);

        // 5. Update schedules if live anomaly occurs
        if (dev.activeAnomaly) {
            let activeAnomalyObj = null;
            if (dev.type === "MRI") {
                activeAnomalyObj = dev.activeAnomaly === "coolant_leak" ? 
                    { rec: "HELIUM LOSS PREDICTION: Cryo temperature rising. Schedule immediate liquid helium refill and replace compressor seal.", act: "Check helium safety valve pressure immediately, verify coldhead seal integrity, and refill liquid helium cryostat." } :
                    { rec: "CRYOGEN COMPRESSOR BEARING VIBRATION: Mechanical wear signature. Replace compressor cylinder bearing before cooling loop failure.", act: "Replace bearing cartridge assembly, grease compressor mounts, and check power line current." };
            } else if (dev.type === "Ventilator") {
                activeAnomalyObj = dev.activeAnomaly === "valve_blockage" ? 
                    { rec: "SOLENOID BLOCKAGE PREDICTION: Airway pressure spiking. Schedule solenoid gas valve replacement.", act: "Disassemble exhalation mixing manifold, replace blocking O-ring valve, and run breathing leak self-test." } :
                    { rec: "TURBINE COMPRESSOR FRICTION: Heat buildup detected. Blower failure forecast in 48 hours. Service compressor core.", act: "Replace turbine bearing casing assembly, blow clean cooling intake channels, and calibrate flow valves." };
            } else if (dev.type === "Infusion Pump") {
                activeAnomalyObj = dev.activeAnomaly === "motor_stiffness" ? 
                    { rec: "STEPPER MOTOR FRICTION WARNING: Gear stiffness. Battery draining fast. Schedule drive screw lubrication.", act: "Lubricate guide rails and stepper plunger drive screw, replace battery core, and check current draw values." } :
                    { rec: "LINE OCCLUSION DETECTED: Strain gauge pressure spiking. Clear infusion line kink.", act: "Inspect patient infusion tubing, clear occlusion blockages, and perform pressure sensor strain gauge calibration check." };
            } else if (dev.type === "CT Scanner") {
                activeAnomalyObj = dev.activeAnomaly === "vacuum_deg" ? 
                    { rec: "TUBE ARCS PREDICTION: Vacuum seal degradation in X-Ray tube. Tube failure forecast in 36 hours. Schedule replacement.", act: "Check tube oil heat exchanger fans, replace X-Ray tube insert, and run high voltage conditioning seasoning cycles." } :
                    { rec: "GANTRY BALANCING FAULT: Rotary unbalance vibration spikes. Speed limited automatically. Schedule belt servicing.", act: "Calibrate gantry balancing counterweights, check drive belt tension alignment, and grease main gantry rotary bearings." };
            }

            if (activeAnomalyObj) {
                recommendationPredictiveText.textContent = `[ACTIVE FAULT WARNING] ${activeAnomalyObj.rec}`;
                recommendationPredictiveText.style.color = "var(--color-warning)";
                actionRecommendedText.textContent = activeAnomalyObj.act;
                actionRecommendedText.parentNode.style.background = "rgba(255, 42, 95, 0.08)";
                actionRecommendedText.parentNode.style.borderColor = "rgba(255, 42, 95, 0.25)";
            }
        } else {
            // Restore default schedule texts if device is healthy
            recommendationPredictiveText.textContent = eqData.recommendationPredictive;
            recommendationPredictiveText.style.color = "var(--text-secondary)";
            actionRecommendedText.textContent = eqData.actionRecommended;
            actionRecommendedText.parentNode.style.background = "rgba(0, 242, 254, 0.04)";
            actionRecommendedText.parentNode.style.borderColor = "rgba(0, 242, 254, 0.15)";
        }
    }

    // 8. Components Mapping Generator
    function renderComponentsList(presentComponents) {
        componentsPresentList.innerHTML = "";
        componentsAbsentList.innerHTML = "";

        // Available components
        presentComponents.forEach(comp => {
            const li = document.createElement("li");
            li.textContent = comp;
            componentsPresentList.appendChild(li);
        });

        // Compute Not Present components (from master list)
        const absentComponents = MASTER_COMPONENTS.filter(comp => {
            // Check if not present in the current device's components list
            return !presentComponents.some(presentComp => 
                presentComp.toLowerCase().includes(comp.toLowerCase()) || 
                comp.toLowerCase().includes(presentComp.toLowerCase())
            );
        });

        // Take a random 6-7 absent components of other devices to display contrast
        const selectedAbsent = absentComponents.slice(0, 7);
        selectedAbsent.forEach(comp => {
            const li = document.createElement("li");
            li.textContent = comp;
            componentsAbsentList.appendChild(li);
        });

        // Update component summary counts
        compSummary.textContent = `${presentComponents.length} Present / ${selectedAbsent.length} Absent`;
    }

    // 9. Static Sensors Renderer
    function renderSensorsStatic(sensors) {
        sensorsListGrid.innerHTML = "";
        sensors.forEach(sens => {
            const div = document.createElement("div");
            div.className = "sensor-badge";
            
            div.innerHTML = `
                <span class="sensor-badge-name">${sens.name}</span>
                <span class="sensor-badge-unit">Tracking (${sens.unit})</span>
            `;
            sensorsListGrid.appendChild(div);
        });
    }

    // Live Sensors Renderer
    function renderSensorsLive(device) {
        sensorsListGrid.innerHTML = "";
        const sensorKeys = Object.keys(device.sensors);
        
        sensorKeys.forEach(key => {
            const sens = device.sensors[key];
            const div = document.createElement("div");
            div.className = "sensor-badge";
            
            // Check if active anomaly causes deviation
            let isAnomalyVal = false;
            if (device.activeAnomaly) {
                if (device.type === "MRI" && ((device.activeAnomaly === "coolant_leak" && (key === "cryo_temp" || key === "coolant_pressure")) || (device.activeAnomaly === "compressor_wear" && key === "compressor_vibration"))) {
                    isAnomalyVal = true;
                } else if (device.type === "Ventilator" && ((device.activeAnomaly === "valve_blockage" && (key === "air_pressure" || key === "flow_rate")) || (device.activeAnomaly === "turbine_friction" && key === "motor_speed"))) {
                    isAnomalyVal = true;
                } else if (device.type === "Infusion Pump" && ((device.activeAnomaly === "motor_stiffness" && key === "motor_current") || (device.activeAnomaly === "occlusion" && key === "occ_pressure"))) {
                    isAnomalyVal = true;
                } else if (device.type === "CT Scanner" && ((device.activeAnomaly === "vacuum_deg" && (key === "vacuum" || key === "tube_temp")) || (device.activeAnomaly === "gantry_unbalance" && key === "gantry_vibration"))) {
                    isAnomalyVal = true;
                }
            }

            const valueColor = isAnomalyVal ? "var(--color-critical)" : "var(--color-cyan)";
            const glowBorder = isAnomalyVal ? "border-color: rgba(255, 42, 95, 0.4);" : "";

            div.setAttribute("style", glowBorder);
            div.innerHTML = `
                <span class="sensor-badge-name" style="${isAnomalyVal ? 'color: var(--color-critical); font-weight:600;' : ''}">${sens.name}</span>
                <span class="sensor-badge-unit" style="color: ${valueColor};">${sens.val} ${sens.unit}</span>
            `;
            sensorsListGrid.appendChild(div);
        });

        sensorSummary.textContent = `${sensorKeys.length} Active Sensors`;
    }

    // 10. Common Faults & Failure Analysis Renderer
    function renderFaultsList(faults) {
        faultsListContainer.innerHTML = "";
        faults.forEach(fault => {
            const div = document.createElement("div");
            div.className = `fault-item-card ${fault.severity === 'Critical' ? 'critical-fault' : ''}`;
            
            div.innerHTML = `
                <div class="fault-title">
                    <span>${fault.name}</span>
                    <span class="status-badge ${fault.severity.toLowerCase()}" style="font-size: 0.65rem;">${fault.severity}</span>
                </div>
                <div class="fault-reason">Possible cause of failure: ${fault.cause}</div>
            `;
            faultsListContainer.appendChild(div);
        });
    }

    // 11. Interactive Checklist Renderer & State Handler
    function renderChecklist(eqKey, checklistItems) {
        checklistContainer.innerHTML = "";

        // Init checklist status dictionary
        if (!checklistState[eqKey]) {
            checklistState[eqKey] = new Array(checklistItems.length).fill(false);
        }

        checklistItems.forEach((task, index) => {
            const li = document.createElement("li");
            const isChecked = checklistState[eqKey][index];

            if (isChecked) {
                li.className = "checked";
            }

            li.innerHTML = `
                <input type="checkbox" ${isChecked ? 'checked' : ''}>
                <span>${task}</span>
            `;

            // Toggle click listener on checkbox item
            li.addEventListener("click", (e) => {
                // Prevent duplicate trigger if clicking directly on checkbox input
                if (e.target.tagName !== "INPUT") {
                    const cb = li.querySelector("input");
                    cb.checked = !cb.checked;
                }

                const checkedStatus = li.querySelector("input").checked;
                checklistState[eqKey][index] = checkedStatus;
                
                if (checkedStatus) {
                    li.className = "checked";
                } else {
                    li.className = "";
                }
            });

            checklistContainer.appendChild(li);
        });
    }

    // 12. Connect tab navigations to reload diagnostics if they are active
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetView = item.getAttribute("data-view");
            if (targetView !== "diagnostics-view" && liveUpdateIntervalId) {
                clearInterval(liveUpdateIntervalId);
                liveUpdateIntervalId = null;
            } else if (targetView === "diagnostics-view" && activeEquipmentKey) {
                // Trigger reload
                const baseKey = activeEquipmentKey.replace("custom_", "");
                if (activeEquipmentKey.startsWith("custom_")) {
                    triggerCustomAnalysis(baseKey);
                } else {
                    triggerAnalysis(activeEquipmentKey);
                }
            }
        });
    });
});
