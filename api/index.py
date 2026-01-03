from fastapi import FastAPI
from mangum import Mangum
import sys
import os

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the FastAPI app from backend
from main import app

# Wrap with Mangum for serverless deployment
handler = Mangum(app)
