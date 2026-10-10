from contextlib import asynccontextmanager
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Project paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "credit_risk_model.pkl"
THRESHOLD_PATH = BASE_DIR / "best_threshold.pkl"
STATIC_DIR = BASE_DIR / "static"

ml_model = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing model file: {MODEL_PATH}")

    if not THRESHOLD_PATH.exists():
        raise FileNotFoundError(f"Missing threshold file: {THRESHOLD_PATH}")

    if not STATIC_DIR.exists():
        raise FileNotFoundError(f"Missing static folder: {STATIC_DIR}")

    ml_model["model"] = joblib.load(MODEL_PATH)
    ml_model["threshold"] = float(joblib.load(THRESHOLD_PATH))

    yield

    ml_model.clear()


app = FastAPI(
    title="Credit Risk Assessment API",
    description="ML-powered loan default risk assessment.",
    version="1.0.0",
    lifespan=lifespan,
)

# Serve CSS, JavaScript, and other static files
app.mount(
    "/static",
    StaticFiles(directory=str(STATIC_DIR)),
    name="static",
)

class LoanApplication(BaseModel):
    person_age: int = Field(..., ge=18, le=100)
    person_income: float = Field(..., gt=0)
    person_home_ownership: str
    person_emp_length: float = Field(..., ge=0, le=100)
    loan_intent: str
    loan_grade: str
    loan_amnt: float = Field(..., gt=0)
    loan_int_rate: float = Field(..., ge=0, le=100)
    loan_percent_income: float = Field(..., gt=0, le=1)
    cb_person_default_on_file: str
    cb_person_cred_hist_length: int = Field(..., ge=0, le=100)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": "model" in ml_model,
    }


@app.get("/")
def home():
    index_file = STATIC_DIR / "index.html"

    if not index_file.exists():
        return {"error": "index.html not found", "path": str(index_file)}

    return FileResponse(index_file)


@app.post("/predict")
def predict(data: LoanApplication):
    input_df = pd.DataFrame([data.model_dump()])

    probability = float(
        ml_model["model"].predict_proba(input_df)[0, 1]
    )

    threshold = ml_model["threshold"]
    prediction = int(probability >= threshold)

    return {
        "default_probability": probability,
        "default_prediction": prediction,
        "threshold": threshold,
        "Result": "High Risk" if prediction == 1 else "Low Risk",
    }