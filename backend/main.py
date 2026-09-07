from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

import cv2
import numpy as np

from detector import detect


app = FastAPI(title="ASL2VOICE Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "online",
        "message": "ASL2VOICE backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/predict")
async def predict(request: Request):

    image_bytes = await request.body()

    if not image_bytes:
        return {
            "success": False,
            "message": "No image received"
        }

    image_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if frame is None:
        return {
            "success": False,
            "message": "Could not decode image"
        }

    result = detect(frame)

    return {
        "success": True,
        "label": result["label"],
        "confidence": result["confidence"],
        "box": result["box"]
    }