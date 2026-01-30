/**
 * Central Chart.js Configuration
 * 
 * This file provides a centralized configuration for Chart.js to prevent
 * the "Canvas is already in use" error that occurs in React Strict Mode.
 * 
 * Import this file once in your app entry point (main.tsx) to apply global settings.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LogarithmicScale,
  RadialLinearScale,
} from 'chart.js';

// Register all Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Configure Chart.js defaults to prevent canvas reuse issues
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

// Override the default destroy behavior to ensure proper cleanup
const originalDestroy = ChartJS.prototype.destroy;
ChartJS.prototype.destroy = function() {
  // Clear the canvas before destroying
  if (this.canvas) {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  originalDestroy.call(this);
};

/**
 * Helper function to get all active Chart.js instances on a canvas
 * and destroy them before creating a new chart
 */
export function destroyChartInstance(canvasId: string): void {
  const existingChart = ChartJS.getChart(canvasId);
  if (existingChart) {
    existingChart.destroy();
  }
}

/**
 * Helper function to destroy all Chart.js instances
 * Useful for cleanup on route changes
 */
export function destroyAllCharts(): void {
  Object.keys(ChartJS.instances).forEach((key) => {
    const chart = ChartJS.instances[key as unknown as number];
    if (chart) {
      chart.destroy();
    }
  });
}

export { ChartJS };
