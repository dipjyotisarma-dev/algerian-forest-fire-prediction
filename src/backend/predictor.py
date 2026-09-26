import pickle
from pathlib import Path
from typing import Dict, Any, Tuple
import pandas as pd

class ForestFirePredictor:
    """Service to load pre-trained artifacts and perform FWI inference."""

    FEATURE_ORDER = [
        "Temperature",
        "RH",
        "Ws",
        "Rain",
        "FFMC",
        "DMC",
        "ISI",
        "Classes",
        "Region",
    ]

    def __init__(self, models_dir: Path | None = None):
        if models_dir is None:
            # Default to repo root / models
            models_dir = Path(__file__).resolve().parents[2] / "models"
        
        self.models_dir = models_dir
        self.scaler_path = self.models_dir / "scaler.pkl"
        self.model_path = self.models_dir / "ridge.pkl"
        
        self.scaler = None
        self.model = None
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        if not self.scaler_path.exists():
            raise FileNotFoundError(f"Scaler artifact missing at: {self.scaler_path}")
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model artifact missing at: {self.model_path}")

        with open(self.scaler_path, "rb") as f:
            self.scaler = pickle.load(f)

        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)

    @property
    def is_ready(self) -> bool:
        return self.scaler is not None and self.model is not None

    @staticmethod
    def classify_danger(fwi: float) -> Tuple[str, str, str]:
        """Maps FWI to CFFDRS danger level, semantic color, and description."""
        if fwi < 5.2:
            return (
                "Low",
                "emerald",
                "Fires do not ignite easily. Little spread potential and minimal spotting danger.",
            )
        elif fwi < 13.0:
            return (
                "Moderate",
                "amber",
                "Surface fires may ignite and burn with moderate intensity. Controllable with standard resources.",
            )
        elif fwi < 21.3:
            return (
                "High",
                "orange",
                "Fires ignite easily and spread rapidly. Direct suppression challenges may occur.",
            )
        elif fwi < 38.0:
            return (
                "Very High",
                "rose",
                "Intense, erratic fire behavior. Potential torching and high rates of spread.",
            )
        else:
            return (
                "Extreme",
                "purple",
                "Explosive wildfire conditions. Head fire suppression nearly impossible.",
            )

    def predict(self, inputs: Dict[str, Any]) -> Tuple[float, str, str, str]:
        """Runs feature transformation and regression inference.
        
        Returns:
            Tuple of (fwi_value, danger_level, danger_color, description)
        """
        if not self.is_ready:
            raise RuntimeError("Model or scaler artifacts are not initialized.")

        # Construct DataFrame with exact column names that StandardScaler was fitted with
        input_row = {
            "Temperature": float(inputs["temperature"]),
            "RH": float(inputs["rh"]),
            "Ws": float(inputs["ws"]),
            "Rain": float(inputs["rain"]),
            "FFMC": float(inputs["ffmc"]),
            "DMC": float(inputs["dmc"]),
            "ISI": float(inputs["isi"]),
            "Classes": int(inputs["classes"]),
            "Region": int(inputs["region"]),
        }
        df = pd.DataFrame([input_row])

        # Scale features using pre-fitted StandardScaler with matching feature names
        scaled_features = self.scaler.transform(df[self.FEATURE_ORDER])

        # Predict continuous FWI with Ridge Regression
        raw_prediction = float(self.model.predict(scaled_features)[0])

        # FWI index in meteorological practice is bounded at 0.0
        fwi = max(0.0, round(raw_prediction, 2))

        danger_level, danger_color, description = self.classify_danger(fwi)

        return fwi, danger_level, danger_color, description
