/**
 * chart-manager.js
 * Handles real-time telemetry line charts and gauge animations using Chart.js.
 */

class TelemetryChartManager {
    constructor() {
        this.charts = {};
        // Theme color definitions
        this.colors = {
            cyan: { border: "rgba(0, 242, 254, 1)", fill: "rgba(0, 242, 254, 0.1)" },
            purple: { border: "rgba(185, 29, 250, 1)", fill: "rgba(185, 29, 250, 0.1)" },
            orange: { border: "rgba(255, 126, 95, 1)", fill: "rgba(255, 126, 95, 0.1)" },
            green: { border: "rgba(0, 227, 150, 1)", fill: "rgba(0, 227, 150, 0.1)" },
            grid: "rgba(255, 255, 255, 0.07)",
            text: "rgba(255, 255, 255, 0.7)"
        };
        this.colorOrder = ["cyan", "purple", "orange", "green"];
    }

    /**
     * Initializes 4 line charts for a selected device's sensors.
     * @param {Object} device The selected device object
     */
    initDeviceCharts(device) {
        this.destroyAll();

        const sensorKeys = Object.keys(device.sensors);
        sensorKeys.forEach((key, index) => {
            const sensor = device.sensors[key];
            const canvasId = `chart-sensor-${index}`;
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const colorKey = this.colorOrder[index % this.colorOrder.length];
            const themeColor = this.colors[colorKey];

            // Reconstruct initial x-axis labels (dummy timestamps or sequence indices)
            const histData = sensor.hist || [];
            const labels = histData.map((_, i) => `${histData.length - i}s ago`).reverse();

            const ctx = canvas.getContext('2d');
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, themeColor.fill);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.charts[key] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${sensor.name} (${sensor.unit})`,
                        data: [...histData],
                        borderColor: themeColor.border,
                        backgroundColor: gradient,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(21, 26, 48, 0.95)',
                            titleColor: '#fff',
                            bodyColor: '#ccc',
                            borderColor: themeColor.border,
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { display: false }
                        },
                        y: {
                            grid: { color: this.colors.grid },
                            ticks: {
                                color: this.colors.text,
                                font: { family: 'Outfit, sans-serif', size: 10 }
                            }
                        }
                    }
                }
            });
        });
    }

    /**
     * Updates all active line charts with new sensor values.
     * @param {Object} device The device containing updated values and history
     */
    updateDeviceCharts(device) {
        Object.keys(device.sensors).forEach(key => {
            const chart = this.charts[key];
            const sensor = device.sensors[key];
            if (chart && sensor) {
                // Update datasets
                chart.data.datasets[0].data = [...sensor.hist];
                
                // Keep labels array in sync
                const length = sensor.hist.length;
                chart.data.labels = sensor.hist.map((_, i) => `${length - i}s ago`).reverse();
                
                chart.update('none'); // Update without full animation for speed
            }
        });
    }

    /**
     * Destroys all active Chart.js instances.
     */
    destroyAll() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
            }
        });
        this.charts = {};
    }
}
