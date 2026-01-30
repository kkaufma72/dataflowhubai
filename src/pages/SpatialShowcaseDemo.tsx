import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import type * as Plotly from 'plotly.js';
import LandingNav from '../components/LandingNav';
import RobotAppQA from '../components/landing/RobotAppQA';
import { SplineScene } from '../components/ui/splite';

type DemoMode = 'classification' | 'regression';

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export default function SpatialShowcaseDemo() {
  const [mode, setMode] = useState<DemoMode>('classification');

  const [classSeparation, setClassSeparation] = useState(1.2);
  const [classNoise, setClassNoise] = useState(0.55);
  const [regressionAmplitude, setRegressionAmplitude] = useState(1.0);
  const [regressionNoise, setRegressionNoise] = useState(0.18);

  const classification = useMemo(() => {
    const rand = mulberry32(42);

    const classA = { x: [] as number[], y: [] as number[], z: [] as number[] };
    const classB = { x: [] as number[], y: [] as number[], z: [] as number[] };

    const n = 220;
    for (let i = 0; i < n; i++) {
      // Two separable clusters in 3D
      const ax = -classSeparation + classNoise * gaussian(rand);
      const ay = classSeparation / 2 + classNoise * gaussian(rand);
      const az = -0.2 + classNoise * gaussian(rand);
      classA.x.push(ax);
      classA.y.push(ay);
      classA.z.push(az);

      const bx = classSeparation + classNoise * gaussian(rand);
      const by = -classSeparation / 2 + classNoise * gaussian(rand);
      const bz = 0.2 + classNoise * gaussian(rand);
      classB.x.push(bx);
      classB.y.push(by);
      classB.z.push(bz);
    }

    // Simple separating plane: z = a*x + b*y + c
    const a = -0.35;
    const b = 0.35;
    const c = 0.0;
    const grid = 25;
    const gx: number[] = [];
    const gy: number[] = [];
    const gz: number[][] = [];

    for (let i = 0; i < grid; i++) {
      const x = -2.5 + (5 * i) / (grid - 1);
      gx.push(x);
    }

    for (let j = 0; j < grid; j++) {
      const y = -2.5 + (5 * j) / (grid - 1);
      gy.push(y);
    }

    for (let j = 0; j < grid; j++) {
      const row: number[] = [];
      for (let i = 0; i < grid; i++) {
        row.push(a * gx[i] + b * gy[j] + c);
      }
      gz.push(row);
    }

    return { classA, classB, plane: { gx, gy, gz } };
  }, [classNoise, classSeparation]);

  const regression = useMemo(() => {
    const rand = mulberry32(7);

    // Surface grid
    const grid = 40;
    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];

    for (let i = 0; i < grid; i++) {
      x.push(-3 + (6 * i) / (grid - 1));
      y.push(-3 + (6 * i) / (grid - 1));
    }

    for (let j = 0; j < grid; j++) {
      const row: number[] = [];
      for (let i = 0; i < grid; i++) {
        const xi = x[i];
        const yj = y[j];
        row.push(regressionAmplitude * (Math.sin(xi) + Math.cos(yj)));
      }
      z.push(row);
    }

    // Sampled points with noise
    const points = { x: [] as number[], y: [] as number[], z: [] as number[] };
    const n = 260;
    for (let i = 0; i < n; i++) {
      const px = -3 + 6 * rand();
      const py = -3 + 6 * rand();
      const noise = regressionNoise * gaussian(rand);
      const pz = regressionAmplitude * (Math.sin(px) + Math.cos(py)) + noise;
      points.x.push(px);
      points.y.push(py);
      points.z.push(pz);
    }

    return { surface: { x, y, z }, points };
  }, [regressionAmplitude, regressionNoise]);

  const isClassification = mode === 'classification';

  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNav />

      <main className="container-custom px-4 md:px-6 py-10">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold">3D Model Demo</h1>
          <p className="mt-2 text-white/70 text-sm md:text-base">
            Interactive 3D charts for classification and regression.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('classification')}
            className={
              mode === 'classification'
                ? 'btn btn-primary'
                : 'btn btn-secondary'
            }
          >
            Classification
          </button>
          <button
            type="button"
            onClick={() => setMode('regression')}
            className={mode === 'regression' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Regression
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/40 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {isClassification ? '3D Classification' : '3D Regression'}
                </h2>
                <p className="text-sm text-white/70">
                  {isClassification
                    ? 'Two clusters with a separating plane.'
                    : 'A non-linear surface with noisy observations.'}
                </p>
              </div>
              <div className="text-sm text-white/70">
                {isClassification ? 'Model: Logistic classifier (demo)' : 'Model: Ridge regressor (demo)'}
              </div>
            </div>

            <div className="mt-4">
              {isClassification ? (
                <Plot
                  data={[
                    {
                      type: 'scatter3d',
                      mode: 'markers',
                      name: 'Class A',
                      x: classification.classA.x,
                      y: classification.classA.y,
                      z: classification.classA.z,
                      marker: { size: 4, color: 'rgba(59,130,246,0.9)' },
                    },
                    {
                      type: 'scatter3d',
                      mode: 'markers',
                      name: 'Class B',
                      x: classification.classB.x,
                      y: classification.classB.y,
                      z: classification.classB.z,
                      marker: { size: 4, color: 'rgba(16,185,129,0.9)' },
                    },
                    {
                      type: 'surface',
                      name: 'Decision Plane',
                      x: classification.plane.gx,
                      y: classification.plane.gy,
                      z: classification.plane.gz,
                      opacity: 0.35,
                      showscale: false,
                      colorscale: [
                        [0, 'rgba(255,255,255,0.15)'],
                        [1, 'rgba(255,255,255,0.15)'],
                      ],
                      hoverinfo: 'skip',
                    },
                  ] as Plotly.Data[]}
                  layout={{
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    height: 520,
                    margin: { l: 0, r: 0, t: 10, b: 0 },
                    legend: { font: { color: 'rgba(255,255,255,0.8)' } },
                    scene: {
                      bgcolor: 'rgba(0,0,0,0)',
                      xaxis: { title: { text: 'Feature 1' }, color: 'rgba(255,255,255,0.7)', gridcolor: 'rgba(255,255,255,0.08)' },
                      yaxis: { title: { text: 'Feature 2' }, color: 'rgba(255,255,255,0.7)', gridcolor: 'rgba(255,255,255,0.08)' },
                      zaxis: { title: { text: 'Feature 3' }, color: 'rgba(255,255,255,0.7)', gridcolor: 'rgba(255,255,255,0.08)' },
                    },
                  } as Partial<Plotly.Layout>}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: '100%' }}
                />
              ) : (
                <Plot
                  data={[
                    {
                      type: 'surface',
                      name: 'Prediction Surface',
                      x: regression.surface.x,
                      y: regression.surface.y,
                      z: regression.surface.z,
                      opacity: 0.85,
                      colorscale: 'Viridis',
                      showscale: false,
                    },
                    {
                      type: 'scatter3d',
                      mode: 'markers',
                      name: 'Observed Points',
                      x: regression.points.x,
                      y: regression.points.y,
                      z: regression.points.z,
                      marker: { size: 3.5, color: 'rgba(255,255,255,0.85)' },
                    },
                  ] as Plotly.Data[]}
                  layout={{
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    height: 520,
                    margin: { l: 0, r: 0, t: 10, b: 0 },
                    legend: { font: { color: 'rgba(255,255,255,0.8)' } },
                    scene: {
                      bgcolor: 'rgba(0,0,0,0)',
                      xaxis: { title: { text: 'X' }, color: 'rgba(255,255,255,0.7)', gridcolor: 'rgba(255,255,255,0.08)' },
                      yaxis: { title: { text: 'Y' }, color: 'rgba(255,255,255,0.7)', gridcolor: 'rgba(255,255,255,0.08)' },
                      zaxis: { title: { text: 'Z' }, color: 'rgba(255,255,255,0.7)', gridcolor: 'rgba(255,255,255,0.08)' },
                    },
                  } as Partial<Plotly.Layout>}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: '100%' }}
                />
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isClassification ? (
                <>
                  <label className="text-sm text-white/80">
                    Cluster separation: <span className="font-medium">{classSeparation.toFixed(2)}</span>
                    <input
                      type="range"
                      min={0.6}
                      max={2.0}
                      step={0.05}
                      value={classSeparation}
                      onChange={(e) => setClassSeparation(Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    Noise: <span className="font-medium">{classNoise.toFixed(2)}</span>
                    <input
                      type="range"
                      min={0.2}
                      max={1.2}
                      step={0.05}
                      value={classNoise}
                      onChange={(e) => setClassNoise(Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="text-sm text-white/80">
                    Amplitude: <span className="font-medium">{regressionAmplitude.toFixed(2)}</span>
                    <input
                      type="range"
                      min={0.5}
                      max={1.8}
                      step={0.05}
                      value={regressionAmplitude}
                      onChange={(e) => setRegressionAmplitude(Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                  <label className="text-sm text-white/80">
                    Noise: <span className="font-medium">{regressionNoise.toFixed(2)}</span>
                    <input
                      type="range"
                      min={0.0}
                      max={0.6}
                      step={0.02}
                      value={regressionNoise}
                      onChange={(e) => setRegressionNoise(Number(e.target.value))}
                      className="mt-2 w-full"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <aside className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="text-sm font-semibold text-white/90">Robot Copilot</div>
                <div className="text-xs text-white/60">Drag to move the robot. Ask it to explain the chart.</div>
              </div>
              <div className="h-[240px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="w-full h-full"
                />
              </div>
            </div>

            <RobotAppQA
              context={
                isClassification
                  ? {
                      mode: 'classification',
                      params: { separation: classSeparation, noise: classNoise },
                    }
                  : {
                      mode: 'regression',
                      params: { amplitude: regressionAmplitude, noise: regressionNoise },
                    }
              }
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
