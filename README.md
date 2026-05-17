# Vehicle Image Processing Pipeline

![Node](https://img.shields.io/badge/Node.js-20-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

A backend system that accepts vehicle image uploads, processes them asynchronously, and detects potential image quality and validity issues.

---

# Quick Summary

1. Upload a vehicle image via `POST /api/upload` → get a `jobId` back instantly
2. System queues and processes the image asynchronously (blur, brightness, OCR, EXIF, plate validation)
3. Poll `GET /api/jobs/:jobId/status` for progress
4. Fetch full analysis report at `GET /api/jobs/:jobId/results`

---

# Table of Contents

* [Tech Stack](#tech-stack)
* [Architecture](#architecture)
* [Image Analysis Checks](#image-analysis-checks)
* [API Reference](#api-reference)
* [Running Locally](#running-locally)
* [Running with Docker](#running-with-docker)
* [Environment Variables](#environment-variables)
* [AI Usage Disclosure](#ai-usage-disclosure)
* [Trade-offs & Improvements](#trade-offs--improvements)
* [Assumptions](#assumptions)

---

# Tech Stack

| Layer            | Choice                   |
| ---------------- | ------------------------ |
| Runtime          | Node.js + TypeScript     |
| Framework        | Express                  |
| Database         | MongoDB Atlas + Mongoose |
| Queue            | BullMQ + Redis           |
| Image Processing | Sharp                    |
| OCR              | Tesseract.js             |
| EXIF Parsing     | Exifr                    |
| Logging          | Pino                     |
| Containerization | Docker + Docker Compose  |

---

# Architecture

```text
Client
│
▼
POST /api/upload  (Express + Multer)
│  → Validate file type and size
│  → Save image to /uploads
│  → Create Job document in MongoDB (status: pending)
│  → Push job to BullMQ queue
│  → Return jobId immediately
│
▼
BullMQ Worker (runs in same process)
│  → Picks up job from Redis queue
│  → Updates Job status: processing
│  → Runs all image analysis checks in parallel
│  → Saves Result document to MongoDB
│  → Updates Job status: completed / failed
│
▼
GET /api/jobs/:jobId/status   → Poll job status
GET /api/jobs/:jobId/results  → Fetch full analysis report
GET /api/jobs                 → List all jobs (paginated)
```

## Processing Flow

```text
Image Upload
│
├── blurCheck        (Sharp pixel variance)
├── brightnessCheck  (Sharp channel stats)
├── dimensionCheck   (Sharp metadata)
├── exifCheck        (Exifr metadata parsing)
└── numberPlateCheck (Tesseract OCR + Regex)
│
▼
All checks run in parallel via Promise.all()
│
▼
Results saved to MongoDB
Job marked as completed
```

## Queue Strategy

BullMQ backed by Redis was chosen for the following reasons:

* Built-in retry with exponential backoff (3 attempts)
* Job state persistence across restarts
* Simple local setup via Docker
* Easy to scale to separate worker processes later

Each job is retried up to 3 times with exponential backoff (3s → 6s → 12s) before being marked as failed.

## Data Models

### Job

```text
_id, filename, originalName, filepath, mimetype,
size, status, failureReason, createdAt, updatedAt
```

### Result

```text
_id, jobId (ref: Job), checks[], summary, createdAt, updatedAt
```

### Check (subdocument)

```text
checkName, passed, confidence (0-1), details
```

---

# Image Analysis Checks

| Check                | Method                | What it detects                                     |
| -------------------- | --------------------- | --------------------------------------------------- |
| `blur_detection`     | Sharp pixel variance  | Blurry or out-of-focus images                       |
| `brightness_check`   | Sharp channel stats   | Too dark or overexposed images                      |
| `dimension_check`    | Sharp metadata        | Images below 200x200px                              |
| `exif_check`         | Exifr parsing         | Screenshots, edited images, missing camera metadata |
| `number_plate_check` | Tesseract OCR + Regex | Invalid or missing Indian number plate format       |

Each check returns:

* `passed` — boolean
* `confidence` — 0 to 1 score
* `details` — human readable explanation

---

# API Reference

## Upload Image

### Request

```http
POST /api/upload
Content-Type: multipart/form-data
```

### Body

```text
image (File) — JPEG, PNG, or WEBP, max 10MB
```

### Response 201

```json
{
  "success": true,
  "data": {
    "jobId": "665f1a2b3c4d5e6f7a8b9c0d",
    "filename": "car.jpg",
    "status": "pending"
  }
}
```

## Get Job Status

### Request

```http
GET /api/jobs/:jobId/status
```

### Response 200

```json
{
  "success": true,
  "data": {
    "jobId": "665f1a2b3c4d5e6f7a8b9c0d",
    "filename": "car.jpg",
    "status": "completed",
    "createdAt": "2024-06-05T10:00:00.000Z",
    "updatedAt": "2024-06-05T10:00:05.000Z"
  }
}
```

## Get Analysis Results

### Request

```http
GET /api/jobs/:jobId/results
```

### Response 200

```json
{
  "success": true,
  "data": {
    "jobId": "665f1a2b3c4d5e6f7a8b9c0d",
    "filename": "car.jpg",
    "status": "completed",
    "summary": "4/5 checks passed. Issues: exif_check",
    "checks": [
      {
        "checkName": "blur_detection",
        "passed": true,
        "confidence": 0.87,
        "details": "Image is sharp. Variance: 1742.33"
      },
      {
        "checkName": "brightness_check",
        "passed": true,
        "confidence": 0.78,
        "details": "Brightness is acceptable. Mean brightness: 118.45"
      },
      {
        "checkName": "dimension_check",
        "passed": true,
        "confidence": 1,
        "details": "Image dimensions are valid: 1920x1080px"
      },
      {
        "checkName": "exif_check",
        "passed": false,
        "confidence": 0.75,
        "details": "No EXIF data found. Image may be a screenshot or edited."
      },
      {
        "checkName": "number_plate_check",
        "passed": true,
        "confidence": 0.85,
        "details": "Valid Indian number plate detected: MH12AB1234"
      }
    ],
    "processedAt": "2024-06-05T10:00:05.000Z"
  }
}
```

## List All Jobs

### Request

```http
GET /api/jobs?page=1&limit=10
```

### Response 200

```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

## Sample curl Commands

### Upload

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@/path/to/car.jpg"
```

### Get Status

```bash
curl http://localhost:3000/api/jobs/YOUR_JOB_ID/status
```

### Get Results

````bash
curl http://localhost:3000/api/jobs/YOUR_JOB_ID/results
````

### Response 200

```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

---

# Running Locally

## Prerequisites

* Node.js 20+
* Redis running locally
* MongoDB Atlas URI

## Steps

```bash
# 1. Clone the repo
git clone https://github.com/cruzz77/Vehicle_Image_Pipeline
cd Vehicle_Image_Pipeline

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Fill in your MONGO_URI in .env

# 4. Start Redis
brew install redis
brew services start redis

# 5. Start the server
npm run dev
```

Server runs at `http://localhost:3000`

---

# Running with Docker

## Prerequisites

* Docker and Docker Compose installed
* MongoDB Atlas URI

```bash
# 1. Clone the repo
git clone https://github.com/cruzz77/Vehicle_Image_Pipeline
cd Vehicle_Image_Pipeline

# 2. Setup environment
cp .env.example .env
# Fill in your MONGO_URI in .env

# 3. Start everything
docker-compose up --build

# 4. Run in background
docker-compose up --build -d

# 5. View logs
docker-compose logs -f app

# 6. Stop
docker-compose down
```

Server runs at `http://localhost:3000`

---

# Environment Variables

| Variable     | Description                     | Default     |
| ------------ | ------------------------------- | ----------- |
| `PORT`       | Server port                     | `3000`      |
| `MONGO_URI`  | MongoDB Atlas connection string | required    |
| `REDIS_HOST` | Redis host                      | `localhost` |
| `REDIS_PORT` | Redis port                      | `6379`      |
| `UPLOAD_DIR` | Local image storage path        | `uploads`   |

---

# AI Usage Disclosure

Claude (claude.ai) was used throughout this project as a pair programming assistant.

## How it was used

* **System design** — architecture decisions, queue strategy, schema design
* **Code generation** — all major files were written collaboratively with Claude
* **Debugging guidance** — error interpretation and fixes during development
* **README structure** — outline and content drafted with Claude's help

## How output was validated

* Every endpoint was manually tested in Postman with real images
* TypeScript compiler errors were resolved iteratively
* Worker logs were verified to confirm end-to-end job processing
* MongoDB Atlas was checked directly to confirm documents were created correctly

## Honest assessment

This project used AI strategically — not blindly. Every suggestion was tested, and the final decisions on architecture, trade-offs, and simplifications were made by the developer.

---

# Trade-offs & Improvements

## Intentionally Simplified

* **Local file storage** — images stored in `/uploads` folder. In production this would be S3 or GCS with signed URLs.
* **In-process worker** — BullMQ worker runs in the same Node.js process as the API. In production these would be separate horizontally scalable services.
* **No authentication** — no API keys or JWT. Production would require auth middleware.
* **No rate limiting** — easy to add with `express-rate-limit`.

## With More Time

* **Duplicate detection** — perceptual hashing (pHash) to detect re-uploaded identical images
* **Confidence scoring improvements** — ML-based blur/brightness models instead of heuristics
* **Webhook support** — notify clients when processing completes instead of polling
* **Admin dashboard** — simple UI to browse jobs and results
* **Automated tests** — Jest unit tests for each image check
* **Cost optimization** — batch Tesseract processing, cache results for duplicate images

## Scalability Concerns

* Worker can be extracted to a separate process and scaled independently
* Redis can be replaced with SQS for managed queue infrastructure
* MongoDB Atlas scales horizontally with sharding
* `/uploads` would need shared storage (S3) if running multiple app instances

## Failure Handling Concerns

* If the server crashes mid-processing, BullMQ will retry the job on restart due to Redis persistence
* Failed jobs are kept in the queue for inspection
* `failureReason` is stored on the Job document for debugging

---

# Assumptions

* Target images are vehicle photos from the field (not studio shots)
* Indian number plate format is the primary validation target
* EXIF absence is treated as a soft warning, not a hard failure
* Images under 200x200px are considered invalid for vehicle inspection use
* Processing time of 5-15 seconds per image is acceptable

---

Built by [Aditya Chopra](https://github.com/YOUR_USERNAME)
