# ASL2VOICE

### Turning signs into speech.

ASL2VOICE is a real-time American Sign Language (ASL) recognition system designed to support assistive communication.

The system uses a deep learning-based object detection model to recognize hand signs through a camera, displays the detected sign and confidence score in a web interface, and converts accepted predictions into spoken output.

---

## Project Title

**Deep Learning Based Hand Gesture Recognition for Assistive Communication**

---

## Overview

Communication can be challenging for people who rely on sign language when interacting with individuals who do not understand ASL.

ASL2VOICE aims to bridge this communication gap by recognizing predefined American Sign Language gestures through a camera and presenting the result as both text and speech.

The system combines a trained **SSD MobileNet V2** object detection model with a modern web-based interface.

### Basic workflow

Camera → Hand Gesture → SSD MobileNet V2 → Sign Prediction → Confidence Check → Text → Speech

---

## Features

- Real-time camera-based sign recognition
- SSD MobileNet V2 object detection
- Hand detection with bounding boxes
- Confidence-based prediction filtering
- Adjustable confidence threshold
- Text display of recognized signs
- Windows text-to-speech output
- Recent detected signs
- Start / Stop detection control
- Camera selection
- Voice output toggle
- Dark / light interface
- Responsive web interface
- FastAPI backend
- Next.js frontend

---

## Supported Signs

The current model supports **20 classes**:

| # | Sign |
|---|------|
| 1 | A |
| 2 | B |
| 3 | C |
| 4 | 1 |
| 5 | 2 |
| 6 | MOBILE |
| 7 | YES |
| 8 | NO |
| 9 | HELP |
| 10 | PLEASE |
| 11 | THANKS |
| 12 | SORRY |
| 13 | ME |
| 14 | CAT |
| 15 | EAT |
| 16 | BOOK |
| 17 | FRIEND |
| 18 | WATER |
| 19 | NAME |
| 20 | HELLO |

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- CSS

### Backend

- Python
- FastAPI
- OpenCV
- NumPy

### Machine Learning

- TensorFlow
- TensorFlow Object Detection API
- SSD MobileNet V2

### Speech

- Windows Speech Synthesis API

---

## System Architecture

```text
                    ┌─────────────────────┐
                    │     Web Camera      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Next.js UI       │
                    │  Camera Interface   │
                    └──────────┬──────────┘
                               │
                         Image Frame
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI Server   │
                    │     /predict        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   SSD MobileNet V2  │
                    │   Object Detector   │
                    └──────────┬──────────┘
                               │
                      Sign + Confidence
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Confidence Filter   │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
          Detected Sign              Rejected Prediction
                  │
                  ▼
           Text displayed
                  │
                  ▼
          Windows Text-to-Speech