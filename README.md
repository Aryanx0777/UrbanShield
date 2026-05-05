# 🛡️ UrbanShield  
### AI-Assisted Crisis Resource Allocation System

🚀 **Live Demo:** https://urban-shield-mu.vercel.app/

---

## 📌 Overview

UrbanShield is an AI-assisted decision support system that simulates how limited resources (like power) are allocated across critical city services during crisis scenarios such as floods, chemical incidents, or infrastructure failures.

It combines **deterministic optimization** with **AI-generated reasoning** to ensure both reliability and transparency.

---

## ❗ Problem

Urban crises create:

- Sudden spikes in resource demand  
- Limited availability of critical infrastructure  
- Lack of intelligent, transparent allocation systems  

### Key Challenges:
- Which services should be prioritized?  
- How to distribute resources fairly?  
- How to explain decisions clearly?  

---

## 💡 Solution

UrbanShield models city services as **independent agents** and allocates resources using:

- ⚙️ **Deterministic Allocation Engine**  
- 🤖 **AI Reasoning Layer (OpenRouter)**  
- 📊 **Interactive Dashboard UI**  

---

## 🧠 Key Features

- 🔥 Crisis scenario simulation (Flood, Chemical, Fire, etc.)  
- ⚡ Priority-based resource allocation (Critical → Low)  
- ⚖️ Fair distribution within same priority groups  
- 🤖 AI-generated explanations for each allocation  
- 📊 Real-time visualizations (charts + metrics)  
- 🔄 Dynamic simulation capability (live behavior)  

---

## 🏗️ System Architecture
User Input / Simulation
↓
Allocation Engine (Deterministic Logic)
↓
AI Reasoning Layer (OpenRouter LLM)
↓
Frontend Dashboard (React + Charts)

---

## ⚙️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Recharts

### Backend Logic
- JavaScript-based simulation engine
- Priority + proportional allocation

### AI Layer
- OpenRouter API
- Free LLMs (Gemma / LLaMA)

---

## 🤖 AI Integration

UrbanShield uses AI **not to decide**, but to **explain decisions**.

> This ensures:
> - Reliability → deterministic allocation  
> - Explainability → AI-generated reasoning  

---

## 📊 Example Behavior

- Hospitals and emergency services receive highest priority  
- Utilities receive moderate allocation  
- Commercial areas may be reduced or cut under constraints  
- AI explains *why* each decision was made  

---

## 🧪 Run Locally

```bash
git clone https://github.com/Aryanx0777/UrbanShield.git
cd UrbanShield
npm install
npm run dev

