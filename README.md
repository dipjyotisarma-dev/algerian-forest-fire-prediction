# 🌲 Algerian Forest Fires — Fire Weather Index (FWI) Prediction

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end Machine Learning regression project that predicts the **Fire Weather Index (FWI)** (wildfire risk indicator) based on meteorological and environmental observations from two regions in Algeria (Bejaia and Sidi Bel-abbes).

---

## 📌 Project Overview

Forest fires pose severe ecological and economic threats. The **Fire Weather Index (FWI)** is a meteorologically based system used worldwide for estimating fire danger. This project builds a regression pipeline to:
1. Perform in-depth **Exploratory Data Analysis (EDA)** and identify primary weather drivers of forest fires.
2. Clean and engineer features from weather observations (Temperature, RH, Wind Speed, Rain, FFMC, DMC, DC, ISI, BUI).
3. Train, validate, and compare multiple regression models (Linear, Ridge, Lasso, ElasticNet).
4. Save the optimized model (`ridge.pkl`) and preprocessor (`scaler.pkl`) for inference and deployment.

---

## 🗂️ Dataset Information

* **Source**: [UCI Machine Learning Repository — Algerian Forest Fires Dataset](https://archive.ics.uci.edu/dataset/547/algerian+forest+fires+dataset)
* **Time Period**: June 2012 – September 2012
* **Regions**:
  * Bejaia Region (Northeast Algeria)
  * Sidi Bel-abbes Region (Northwest Algeria)

### Key Features:
| Feature | Description |
| :--- | :--- |
| **`Temperature`** | Noon temperature in Celsius degrees (22 to 42) |
| **`RH`** | Relative Humidity in % (21 to 90) |
| **`Ws`** | Wind speed in km/h (6 to 29) |
| **`Rain`** | Total rainfall in mm (0.0 to 16.8) |
| **`FFMC`** | Fine Fuel Moisture Code index (28.6 to 92.5) |
| **`DMC`** | Duff Moisture Code index (1.1 to 65.9) |
| **`DC`** | Drought Code index (7 to 220.4) |
| **`ISI`** | Initial Spread Index (0.0 to 18.5) |
| **`BUI`** | Build Up Index (1.1 to 68) |
| **`FWI`** *(Target)* | Fire Weather Index (0.0 to 31.1) |

---

## 📁 Repository Structure

```text
├── data/
│   ├── raw/                  # Original raw dataset
│   └── processed/            # Cleaned dataset ready for modeling
├── models/
│   ├── ridge.pkl             # Serialized Ridge Regression model
│   └── scaler.pkl            # Serialized StandardScaler
├── notebooks/
│   ├── 01_eda_and_feature_engineering.ipynb
│   └── 02_model_training.ipynb
├── requirements.txt          # Python dependencies
├── .gitignore
└── README.md
```

---

## ⚙️ Workflow & Modeling Pipeline

1. **Data Cleaning & Preprocessing**:
   * Stripped unnecessary spaces in column names and string records.
   * Handled missing / corrupted data records across region boundary demarcations.
   * Encoded categorical labels and converted feature types to numerical formats.
2. **Exploratory Data Analysis (EDA)**:
   * Correlation heatmaps to detect multicollinearity among indices (e.g., DMC, DC, and BUI).
   * Feature distribution plots and outlier inspection.
3. **Feature Scaling & Transformation**:
   * Applied `StandardScaler` to normalize feature magnitudes.
4. **Model Selection & Regularization**:
   * Evaluated **Linear Regression**, **Ridge**, **Lasso**, and **ElasticNet**.
   * Selected **Ridge Regression** for its performance and resilience to correlated fire index metrics.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/algerian-forest-fire-prediction.git
cd algerian-forest-fire-prediction
```

### 2. Create a virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Jupyter Notebooks
```bash
jupyter notebook notebooks/
```

---

## 📦 Requirements (`requirements.txt`)

```text
numpy
pandas
matplotlib
seaborn
scikit-learn
jupyter
```

---

## 📊 Sample Inference Code

```python
import pickle
import numpy as np

# Load pre-trained artifacts
with open('models/scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

with open('models/ridge.pkl', 'rb') as f:
    model = pickle.load(f)

# Sample input: [Temperature, RH, Ws, Rain, FFMC, DMC, ISI, Classes, Region]
sample_input = np.array([[30, 64, 15, 0.0, 86.0, 14.2, 5.7, 1, 0]])

# Scale and predict
scaled_data = scaler.transform(sample_input)
prediction = model.predict(scaled_data)

print(f"Predicted Fire Weather Index (FWI): {prediction[0]:.2f}")
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.