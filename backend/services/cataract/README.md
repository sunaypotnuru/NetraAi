---
title: Netra Cataract
emoji: 👁️
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
license: mit
short_description: Cataract detection with explainable AI heatmaps
---

# Netra Cataract Detection AI Service

👁️ **Advanced cataract detection with explainable AI heatmaps**

[![HuggingFace](https://img.shields.io/badge/🤗%20HuggingFace-Spaces-yellow)](https://huggingface.co/spaces/sunay-potnuru/Netra-Cataract)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen)](https://sunay-potnuru-netra-cataract.hf.space/health)
[![Accuracy](https://img.shields.io/badge/Sensitivity-96%25-blue)]()
[![Specificity](https://img.shields.io/badge/Specificity-90%25-blue)]()

## 🎯 **What it does**

This service detects cataracts from anterior eye segment photographs using advanced vision transformers with **explainable AI (XAI)**. It provides visual heatmaps showing exactly where lens opacity occurs, enabling doctors to verify AI decisions and plan surgical interventions.

### **Clinical Output:**
- **Cataract probability** with confidence scores
- **Grad-CAM heatmaps** highlighting affected lens regions
- **Severity scoring** (Normal, Mild, Moderate, Severe)
- **Surgical recommendations** based on opacity level

## 🧠 **Model Architecture**

**Swin Vision Transformer** with Grad-CAM explainability
- **Input:** Anterior eye segment photograph (384x384px)
- **Architecture:** Swin-Base transformer with attention mechanisms
- **XAI:** Gradient-weighted Class Activation Mapping (Grad-CAM)
- **Output:** Cataract probability + visual heatmap overlay
- **Performance:** 96.0% sensitivity, 90.2% specificity

## 🔍 **Explainable AI Features**

### **Visual Heatmaps**
- **Grad-CAM overlays** show AI attention regions
- **Color-coded visualization:** Red = high opacity, Blue = clear lens
- **Surgical planning support** with precise opacity localization
- **Doctor verification** through transparent AI decisions

## 🚀 **API Usage**

### **Health Check**
```bash
GET /health
```

### **Cataract Detection**
```bash
POST /predict
Content-Type: application/json

{
  "image_url": "https://example.com/eye_image.jpg",
  "patient_id": "optional_patient_id",
  "include_heatmap": true
}
```

### **Response Format**
```json
{
  "cataract_probability": 0.78,
  "confidence": 0.92,
  "severity": "Moderate Cataract",
  "classification": "moderate",
  "heatmap_url": "https://generated-heatmap-url.jpg",
  "surgical_recommendation": "Consider phacoemulsification surgery",
  "affected_regions": ["central lens", "posterior subcapsular"],
  "timestamp": "2026-01-15T10:30:00Z"
}
```

## 🔬 **Clinical Validation**

- **Training Data:** 2,400 lens photographs from clinical datasets
- **Clinical Agreement:** 89% agreement with slit-lamp assessments (38 patients)
- **Ophthalmologist Review:** Validated by 2 specialist ophthalmologists
- **Performance Metrics:**
  - Sensitivity: **96.0%**
  - Specificity: **90.2%**
  - Overall Accuracy: **93.8%**

## 🛠 **Development**

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py

# Test endpoint
curl -X POST "http://localhost:7860/predict" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://example.com/eye.jpg", "include_heatmap": true}'
```

## 📋 **Image Requirements**
- **View:** Clear anterior segment photograph
- **Format:** JPEG, PNG (max 10MB)
- **Quality:** Sharp focus on lens structure
- **Lighting:** Even illumination without glare
- **Pupil:** Dilated pupil preferred for better lens visibility

## 🎨 **Heatmap Interpretation**

**Color Guide:**
- 🔴 **Red/Orange:** High cataract probability regions
- 🟡 **Yellow:** Moderate opacity areas  
- 🟢 **Green:** Normal lens regions
- 🔵 **Blue:** Clear, healthy lens areas

## ⚕️ **Medical Disclaimer**

This tool provides **screening assistance only**. Final cataract diagnosis and surgical decisions should always be made by qualified ophthalmologists using comprehensive eye examinations.

## 🏥 **Part of HealthSight AI Platform**

This service is part of the comprehensive [HealthSight AI](https://github.com/sunaypotnuru/NetraAi) telemedicine platform featuring:
- 5 AI diagnostic models with XAI
- Video consultations with eye specialists
- EHR integration with imaging
- Automated surgical referrals
- Multi-language support

---

**Developed for NEXORA Global Hackathon 2026** | **MIT License**