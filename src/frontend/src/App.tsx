import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/Navbar';
import { MetricInput } from './components/MetricInput';
import { DangerGauge } from './components/DangerGauge';
import { PresetsBar } from './components/PresetsBar';
import {
  PredictionInput,
  PredictionOutput,
  PresetScenario,
} from './types';
import { checkHealth, getMetadata, predictFWI } from './services/api';
import { Thermometer, Gauge, Compass } from 'lucide-react';

const DEFAULT_INPUTS: PredictionInput = {
  temperature: 30.0,
  rh: 64.0,
  ws: 15.0,
  rain: 0.0,
  ffmc: 86.0,
  dmc: 14.2,
  isi: 5.7,
  classes: 1,
  region: 0,
};

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [inputs, setInputs] = useState<PredictionInput>(DEFAULT_INPUTS);
  const [activePresetId, setActivePresetId] = useState<string | null>('moderate_summer');
  const [presets, setPresets] = useState<PresetScenario[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const [prediction, setPrediction] = useState<PredictionOutput>({
    fwi: 7.16,
    danger_level: 'Moderate',
    danger_color: 'amber',
    description: 'Surface fires may ignite and burn with moderate intensity. Controllable with standard resources.',
    features_used: {},
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize presets and health check
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [health, meta] = await Promise.all([checkHealth(), getMetadata()]);
        if (isMounted) {
          setIsOnline(health.status === 'healthy');
          if (meta.presets && meta.presets.length > 0) {
            setPresets(meta.presets);
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsOnline(false);
        }
      }
    }

    init();
    const interval = setInterval(init, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Perform inference query
  const executePrediction = useCallback(async (currentInputs: PredictionInput) => {
    try {
      setErrorMsg(null);
      const res = await predictFWI(currentInputs);
      startTransition(() => {
        setPrediction(res);
        setIsOnline(true);
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Prediction request failed');
    }
  }, []);

  // Debounced auto-prediction when inputs change
  useEffect(() => {
    const handler = setTimeout(() => {
      executePrediction(inputs);
    }, 150);

    return () => clearTimeout(handler);
  }, [inputs, executePrediction]);

  const updateField = (field: keyof PredictionInput, value: number) => {
    setActivePresetId(null);
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setActivePresetId(preset.id);
    setErrorMsg(null);
    setInputs(preset.values);
  };

  const handleReset = () => {
    setActivePresetId('moderate_summer');
    setErrorMsg(null);
    setInputs(DEFAULT_INPUTS);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar theme={theme} onToggleTheme={toggleTheme} isOnline={isOnline} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Scenarios bar */}
        {presets.length > 0 && (
          <PresetsBar
            presets={presets}
            activeId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onReset={handleReset}
          />
        )}

        {/* Error notification if API fails */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => executePrediction(inputs)}
              className="text-xs font-medium underline hover:no-underline ml-4"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Meteorological & Fire Index Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Meteorological Observations */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <h2>Surface Weather Observations</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricInput
                  id="temperature"
                  label="Noon Temperature"
                  value={inputs.temperature}
                  min={10}
                  max={50}
                  step={0.5}
                  unit="°C"
                  description="Ambient temperature at 12:00 solar noon"
                  onChange={(v) => updateField('temperature', v)}
                />

                <MetricInput
                  id="rh"
                  label="Relative Humidity"
                  value={inputs.rh}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  description="Ambient air moisture content"
                  onChange={(v) => updateField('rh', v)}
                />

                <MetricInput
                  id="ws"
                  label="Wind Speed"
                  value={inputs.ws}
                  min={1}
                  max={50}
                  step={1}
                  unit="km/h"
                  description="Average 10-meter open ground wind velocity"
                  onChange={(v) => updateField('ws', v)}
                />

                <MetricInput
                  id="rain"
                  label="24h Precipitation"
                  value={inputs.rain}
                  min={0.0}
                  max={30.0}
                  step={0.1}
                  unit="mm"
                  description="Cumulative rainfall in last 24 hours"
                  onChange={(v) => updateField('rain', v)}
                />
              </div>
            </section>

            {/* Fuel Moisture & Spread Indices */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Gauge className="w-4 h-4 text-orange-500" />
                <h2>Canadian Fire Weather Sub-Indices</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricInput
                  id="ffmc"
                  label="FFMC"
                  value={inputs.ffmc}
                  min={25}
                  max={100}
                  step={0.5}
                  unit=""
                  description="Fine Fuel Moisture Code (surface litter flammability)"
                  onChange={(v) => updateField('ffmc', v)}
                />

                <MetricInput
                  id="dmc"
                  label="DMC"
                  value={inputs.dmc}
                  min={1}
                  max={100}
                  step={0.5}
                  unit=""
                  description="Duff Moisture Code (organic layer dryness)"
                  onChange={(v) => updateField('dmc', v)}
                />

                <MetricInput
                  id="isi"
                  label="ISI"
                  value={inputs.isi}
                  min={0}
                  max={35}
                  step={0.5}
                  unit=""
                  description="Initial Spread Index (rate of fire spread)"
                  onChange={(v) => updateField('isi', v)}
                />
              </div>
            </section>

            {/* Region & Observation Categoricals */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Compass className="w-4 h-4 text-orange-500" />
                <h2>Geographic Region & Ground State</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Region selector */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xs">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200 block mb-1">
                    Study Region
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Geographic topography in Northern Algeria
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateField('region', 0)}
                      className={`text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                        inputs.region === 0
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      Bejaia (North-East)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('region', 1)}
                      className={`text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                        inputs.region === 1
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      Sidi Bel-abbes (North-West)
                    </button>
                  </div>
                </div>

                {/* Fire presence observation */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xs">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-200 block mb-1">
                    Ground Fire Observation
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Verified ground fire activity status
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateField('classes', 0)}
                      className={`text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                        inputs.classes === 0
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      No Fire Detected
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('classes', 1)}
                      className={`text-xs py-2 px-3 rounded-lg border font-medium transition-colors ${
                        inputs.classes === 1
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      Active Fire / Ignition
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: FWI Gauge & Meteorological Assessment (Sticky on Desktop) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <DangerGauge
              fwi={prediction.fwi}
              dangerLevel={prediction.danger_level}
              description={prediction.description}
              isLoading={isPending}
            />

            {/* Model Architecture Note */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Pipeline Specification
              </div>
              <p>
                Inference uses an optimized <span className="font-medium text-slate-800 dark:text-slate-200">Ridge Regression</span> estimator pre-trained with 5-fold cross-validation on normalized weather metrics. High-correlation parameters (<code className="font-mono">DC</code> and <code className="font-mono">BUI</code>) are excluded to prevent multicollinearity.
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>scikit-learn 1.9.0</span>
                <span>FastAPI + Vite</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
        <p>Algerian Forest Fire Prediction System — Fire Weather Index Modeling</p>
      </footer>
    </div>
  );
};

export default App;
