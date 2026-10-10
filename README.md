# Credit Risk Assessment System

## Project Overview

A Machine Learning web application that predicts the probability of loan default using applicant personal and financial information. The system uses an XGBoost model and FastAPI to provide credit risk predictions through an interactive web interface.

## Live Demo

https://credit-risk-assessment-7lwp.onrender.com/

## Features

- Loan default probability prediction
- XGBoost classification model
- Optimized decision threshold
- Interactive web interface
- FastAPI backend
- Deployed on Render

## Technologies Used

- Python
- XGBoost
- Scikit-learn
- Pandas
- NumPy
- FastAPI
- HTML, CSS, JavaScript

## Input Features

- Age
- Annual Income
- Home Ownership
- Employment Length
- Loan Intent
- Loan Grade
- Loan Amount
- Interest Rate
- Loan-to-Income Ratio

## Run Locally

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the application:

```bash
uvicorn main:app --reload
```

Open http://127.0.0.1:8000 in your browser.

## Disclaimer

This project is intended for educational purposes. Predictions should not be used as the sole basis for real-world lending decisions.
