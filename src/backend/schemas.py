from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, List

class PredictionInput(BaseModel):
    temperature: float = Field(
        ...,
        ge=10.0,
        le=55.0,
        description="Noon temperature in degrees Celsius (10°C to 55°C)",
        examples=[30.0]
    )
    rh: float = Field(
        ...,
        ge=10.0,
        le=100.0,
        description="Relative Humidity in percentage (10% to 100%)",
        examples=[64.0]
    )
    ws: float = Field(
        ...,
        ge=1.0,
        le=60.0,
        description="Wind speed in km/h (1 to 60 km/h)",
        examples=[15.0]
    )
    rain: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Total rain in mm (0.0 to 100.0 mm)",
        examples=[0.0]
    )
    ffmc: float = Field(
        ...,
        ge=20.0,
        le=100.0,
        description="Fine Fuel Moisture Code (20.0 to 100.0)",
        examples=[86.0]
    )
    dmc: float = Field(
        ...,
        ge=0.0,
        le=150.0,
        description="Duff Moisture Code (0.0 to 150.0)",
        examples=[14.2]
    )
    isi: float = Field(
        ...,
        ge=0.0,
        le=50.0,
        description="Initial Spread Index (0.0 to 50.0)",
        examples=[5.7]
    )
    classes: int = Field(
        ...,
        ge=0,
        le=1,
        description="Fire occurrence observation (0 = Not Fire, 1 = Fire)",
        examples=[1]
    )
    region: int = Field(
        ...,
        ge=0,
        le=1,
        description="Region identifier (0 = Bejaia, 1 = Sidi Bel-abbes)",
        examples=[0]
    )

class PredictionOutput(BaseModel):
    fwi: float = Field(..., description="Predicted Fire Weather Index value")
    danger_level: Literal["Low", "Moderate", "High", "Very High", "Extreme"] = Field(
        ..., description="Standard CFFDRS fire danger classification"
    )
    danger_color: str = Field(..., description="Semantic color token for UI styling")
    description: str = Field(..., description="Concise interpretation of the danger index")
    features_used: Dict[str, Any] = Field(..., description="Key-value mapping of received features")

class PresetScenario(BaseModel):
    id: str
    name: str
    description: str
    values: PredictionInput

class MetaResponse(BaseModel):
    model_name: str
    scaler_name: str
    features: List[str]
    danger_thresholds: Dict[str, str]
    presets: List[PresetScenario]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    scaler_loaded: bool
