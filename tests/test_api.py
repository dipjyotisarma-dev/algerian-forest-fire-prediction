import pytest
from fastapi.testclient import TestClient
from src.backend.main import app
from src.backend.predictor import ForestFirePredictor

client = TestClient(app)

def test_predictor_service_direct():
    predictor = ForestFirePredictor()
    assert predictor.is_ready is True
    
    sample = {
        "temperature": 30.0,
        "rh": 64.0,
        "ws": 15.0,
        "rain": 0.0,
        "ffmc": 86.0,
        "dmc": 14.2,
        "isi": 5.7,
        "classes": 1,
        "region": 0,
    }
    fwi, danger, color, desc = predictor.predict(sample)
    assert isinstance(fwi, float)
    assert fwi >= 0.0
    assert danger in ["Low", "Moderate", "High", "Very High", "Extreme"]
    assert color in ["emerald", "amber", "orange", "rose", "purple"]
    assert len(desc) > 10

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["scaler_loaded"] is True

def test_metadata_endpoint():
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    assert len(data["features"]) == 9
    assert len(data["presets"]) >= 3
    assert "Low" in data["danger_thresholds"]

def test_predict_endpoint_valid():
    payload = {
        "temperature": 30.0,
        "rh": 64.0,
        "ws": 15.0,
        "rain": 0.0,
        "ffmc": 86.0,
        "dmc": 14.2,
        "isi": 5.7,
        "classes": 1,
        "region": 0,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "fwi" in data
    assert "danger_level" in data
    assert "danger_color" in data
    assert data["features_used"]["temperature"] == 30.0

def test_predict_endpoint_validation_errors():
    # Temperature out of upper bound (> 55°C)
    payload_high_temp = {
        "temperature": 99.0,
        "rh": 64.0,
        "ws": 15.0,
        "rain": 0.0,
        "ffmc": 86.0,
        "dmc": 14.2,
        "isi": 5.7,
        "classes": 1,
        "region": 0,
    }
    assert client.post("/api/predict", json=payload_high_temp).status_code == 422

    # Negative humidity
    payload_neg_rh = {
        "temperature": 25.0,
        "rh": -10.0,
        "ws": 15.0,
        "rain": 0.0,
        "ffmc": 86.0,
        "dmc": 14.2,
        "isi": 5.7,
        "classes": 1,
        "region": 0,
    }
    assert client.post("/api/predict", json=payload_neg_rh).status_code == 422

    # Invalid classes (only 0 or 1 allowed)
    payload_invalid_class = {
        "temperature": 25.0,
        "rh": 50.0,
        "ws": 15.0,
        "rain": 0.0,
        "ffmc": 86.0,
        "dmc": 14.2,
        "isi": 5.7,
        "classes": 5,
        "region": 0,
    }
    assert client.post("/api/predict", json=payload_invalid_class).status_code == 422

    # Missing required field
    payload_missing_field = {
        "temperature": 25.0,
        "rh": 50.0,
    }
    assert client.post("/api/predict", json=payload_missing_field).status_code == 422

def test_presets_inference_consistency():
    meta = client.get("/api/meta").json()
    for preset in meta["presets"]:
        values = preset["values"]
        res = client.post("/api/predict", json=values)
        assert res.status_code == 200
        result = res.json()
        assert result["fwi"] >= 0.0
        assert result["danger_level"] in ["Low", "Moderate", "High", "Very High", "Extreme"]

def test_openapi_docs():
    response = client.get("/docs")
    assert response.status_code == 200

def test_frontend_static_serving():
    response = client.get("/")
    assert response.status_code == 200
    assert "Fire Weather Index" in response.text
