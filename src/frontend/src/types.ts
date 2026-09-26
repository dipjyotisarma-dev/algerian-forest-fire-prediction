export type DangerLevel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

export interface PredictionInput {
  temperature: number;
  rh: number;
  ws: number;
  rain: number;
  ffmc: number;
  dmc: number;
  isi: number;
  classes: number;
  region: number;
}

export interface PredictionOutput {
  fwi: number;
  danger_level: DangerLevel;
  danger_color: string;
  description: string;
  features_used: Record<string, number>;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  values: PredictionInput;
}

export interface MetaResponse {
  model_name: string;
  scaler_name: string;
  features: string[];
  danger_thresholds: Record<string, string>;
  presets: PresetScenario[];
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  scaler_loaded: boolean;
}
