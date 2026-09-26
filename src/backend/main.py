import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure project root and backend dir are in sys.path for IDEs and direct execution
_root_dir = Path(__file__).resolve().parents[2]
_backend_dir = Path(__file__).resolve().parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from .schemas import (
        PredictionInput,
        PredictionOutput,
        HealthResponse,
        MetaResponse,
        PresetScenario,
    )
    from .predictor import ForestFirePredictor
except (ImportError, ValueError):
    from schemas import (  # type: ignore
        PredictionInput,
        PredictionOutput,
        HealthResponse,
        MetaResponse,
        PresetScenario,
    )
    from predictor import ForestFirePredictor  # type: ignore

# Initialize predictor instance at module level
try:
    predictor: ForestFirePredictor | None = ForestFirePredictor()
except Exception as exc:
    print(f"[Warning] Failed to initialize model artifacts on import: {exc}")
    predictor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global predictor
    if predictor is None:
        try:
            predictor = ForestFirePredictor()
        except Exception as exc:
            print(f"[Warning] Failed to initialize model artifacts on startup: {exc}")
    yield

app = FastAPI(
    title="Algerian Forest Fire FWI Prediction API",
    description="Inference API for Canadian Fire Weather Index (FWI) using Ridge Regression and StandardScaler.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRESETS = [
    PresetScenario(
        id="safe_baseline",
        name="Post-Rain Safe Baseline",
        description="Cooler temperatures with high humidity and recent rainfall.",
        values=PredictionInput(
            temperature=24.0,
            rh=78.0,
            ws=14.0,
            rain=4.5,
            ffmc=42.0,
            dmc=3.2,
            isi=0.5,
            classes=0,
            region=0,
        ),
    ),
    PresetScenario(
        id="moderate_summer",
        name="Typical Mediterranean Summer",
        description="Warm noon temperatures, moderate humidity, and dry fuels.",
        values=PredictionInput(
            temperature=30.0,
            rh=64.0,
            ws=15.0,
            rain=0.0,
            ffmc=86.0,
            dmc=14.2,
            isi=5.7,
            classes=1,
            region=0,
        ),
    ),
    PresetScenario(
        id="extreme_heatwave",
        name="Severe Heatwave & Drought",
        description="High noon heat, strong wind gusts, low relative humidity, and dry fuels.",
        values=PredictionInput(
            temperature=39.0,
            rh=32.0,
            ws=19.0,
            rain=0.0,
            ffmc=92.5,
            dmc=55.0,
            isi=14.8,
            classes=1,
            region=1,
        ),
    ),
]

@app.get("/api/health", response_model=HealthResponse, tags=["Diagnostics"])
def health_check():
    """Health check endpoint to verify backend and model readiness."""
    is_ready = predictor is not None and predictor.is_ready
    return HealthResponse(
        status="healthy" if is_ready else "degraded",
        model_loaded=is_ready,
        scaler_loaded=is_ready,
    )

@app.get("/api/meta", response_model=MetaResponse, tags=["Metadata"])
def get_metadata():
    """Returns model metadata, CFFDRS danger ranges, and sample presets."""
    return MetaResponse(
        model_name="Ridge Regression (scikit-learn 1.9.0)",
        scaler_name="StandardScaler (scikit-learn 1.9.0)",
        features=ForestFirePredictor.FEATURE_ORDER,
        danger_thresholds={
            "Low": "FWI < 5.2",
            "Moderate": "5.2 <= FWI < 13.0",
            "High": "13.0 <= FWI < 21.3",
            "Very High": "21.3 <= FWI < 38.0",
            "Extreme": "FWI >= 38.0",
        },
        presets=PRESETS,
    )

@app.post("/api/predict", response_model=PredictionOutput, tags=["Inference"])
def predict_fwi(payload: PredictionInput):
    """Predicts Fire Weather Index (FWI) and determines fire danger severity."""
    if predictor is None or not predictor.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Predictor service is not initialized or model artifacts could not be loaded.",
        )

    try:
        input_dict = payload.model_dump()
        fwi, danger_level, danger_color, description = predictor.predict(input_dict)
        return PredictionOutput(
            fwi=fwi,
            danger_level=danger_level,
            danger_color=danger_color,
            description=description,
            features_used=input_dict,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(exc)}",
        )

# Mount frontend production build if available
frontend_dist = Path(__file__).resolve().parents[2] / "src" / "frontend" / "dist"
if frontend_dist.exists() and frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
