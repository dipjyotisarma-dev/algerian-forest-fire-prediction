import { PredictionInput, PredictionOutput, MetaResponse, HealthResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function getMetadata(): Promise<MetaResponse> {
  const res = await fetch(`${API_BASE_URL}/api/meta`);
  if (!res.ok) {
    throw new Error(`Failed to load metadata with status: ${res.status}`);
  }
  return res.json();
}

export async function predictFWI(input: PredictionInput): Promise<PredictionOutput> {
  const res = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.detail || `Inference request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}
