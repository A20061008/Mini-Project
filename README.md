# 🌍 WorldWatch – Global Issue Tracker

> A real-time, multilingual web application for reporting, verifying, and resolving world issues with interactive mapping and data analytics.

---

## 📋 Description

**WorldWatch** is a civic-tech web application that empowers citizens and administrators to collaboratively track, verify, and resolve real-world problems — from natural disasters and floods to road accidents and infrastructure damage. Issues are visualized on an interactive map where problem clusters grow visually larger as more reports accumulate.

---

## ✨ Key Features

### 🗺️ Interactive Map
- MapLibre GL maps with Esri street/satellite basemaps, issue-region circles, and clickable issue markers
- **Dynamic circle markers** that grow in radius proportionally to the number of reports in an area
- Color-coded markers: 🔴 Unverified | 🟡 Under Verification | 🟢 Verified/Solved
- Filter by issue type: Natural Disasters, Floods, Accidents, Crime, Infrastructure

### 📝 Issue Reporting
- Report any world issue with title, description, type, severity, and GPS location
- **Upload images** for verification evidence
- Real-time GPS location detection
- Severity rating (1–5 stars)
- Category- and location-based department suggestions, editable by reporters and administrators
- AI assistant for general questions, matching issue lookups, and WorldWatch website help
- Report drafts prepared from conversation, then reviewed and submitted by the user
- Local image quality screening for resolution, lighting, and contrast; an administrator must still verify the incident

### ✅ Verification System
- **🟢 Verified** – Confirmed real issue (green tick mark)
- **🟡 Under Verification** – Being reviewed (yellow indicator)
- **🔴 Fake/Rejected** – Determined to be false (red indicator)
- After resolution: resolution image/video displayed against each issue

> The assistant uses the AI provider configured by the server. Its answers may be inaccurate; it does not have live web or weather access or contact authorities. Matching issue summaries may be sent to the configured provider. Generated reports are only drafts until the user reviews and submits them. Image screening evaluates basic quality only; it does not identify or authenticate incident content.

### 📊 Data Analytics
- Total issues, verified, under review, resolved, fake — stat cards
- **Bar Chart** – Issues by Category
- **Line Chart** – Issues over last 30 days
- **Pie Chart** – Issues by Status
- **Doughnut Chart** – Issues by Severity
- **Individual Flowcharts** per issue type showing lifecycle

### 🌐 Multi-Language Support
Full UI translation in **9 languages**:
| Language | Code |
|----------|------|
| English | en |
| ಕನ್ನಡ (Kannada) | kn |
| हिन्दी (Hindi) | hi |
| తెలుగు (Telugu) | te |
| தமிழ் (Tamil) | ta |
| मराठी (Marathi) | mr |
| മലയാളം (Malayalam) | ml |
| ଓଡ଼ିଆ (Odia) | od |
| বাংলা (Bengali) | bn |

### 🔐 Authentication
- **User Login** – Report and track issues
- **Admin Login** – Verify, reject, and resolve issues
- Persistent session via localStorage

---

## 🚀 How to Run

1. Install Python 3.9 or later.
2. Configure an AI provider. For the default OpenAI-compatible endpoint, set your key in PowerShell (do not put it in a source file):
   ```powershell
   $env:AI_API_KEY="your-provider-api-key"
   python server.py
   ```
   Optional settings: `AI_BASE_URL` (defaults to `https://api.openai.com/v1`), `AI_MODEL` (defaults to `gpt-4o-mini`), `PORT` (defaults to `8000`), and `HOST` (defaults to `127.0.0.1`). The server also supports local OpenAI-compatible services such as Ollama; set `AI_BASE_URL` and `AI_MODEL` to match your local service. No API key is sent to the browser.
3. Open `http://127.0.0.1:8000/index.html`, sign in, and open the dashboard to chat. Run `python server.py` rather than `python -m http.server`; the AI endpoint is part of this server.
4. Use the Map/Satellite buttons, zoom controls, compass, fullscreen, and location controls. Issue markers show their status and report count; click a marker or region circle for details.

> The server binds to your own computer by default. Do not expose it directly to the public internet without adding server-side authentication and rate limiting; the demo login is client-side only.

> Street and satellite basemaps use Esri public map services and require no API key. Attribution is shown on the map. The street map incorporates OpenStreetMap data in some regions.

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **User** | user@world.com | user123 |
| **Admin** | admin@world.com | admin123 |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| HTML5 | Structure |
| CSS3 | Styling + Animations |
| JavaScript ES6+ | Logic + i18n |
| [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) | Interactive Maps |
| [Chart.js](https://www.chartjs.org/) | Data Visualization |
| [Font Awesome](https://fontawesome.com/) | Icons |
| [Google Fonts – Poppins](https://fonts.google.com/) | Typography |
| localStorage | Data Persistence |

---

## 📁 File Structure

```
Mini Project 1/
├── index.html          # Login page (entry point)
├── dashboard.html      # User dashboard
├── admin.html          # Admin dashboard
├── styles.css          # Shared styles
├── app.js              # Shared JavaScript (i18n, data, utils)
└── README.md           # This file
```

---

## 🌊 Issue Types Supported

- 🌪️ Natural Disaster
- 🌊 Flood
- 🔥 Fire
- 🚗 Road Accident
- ⚔️ Crime / Murder
- 🏗️ Infrastructure Damage
- ☠️ Environmental Pollution
- 🏥 Medical Emergency
- ❓ Other

---

## 📊 Flowchart – Issue Lifecycle

```
Reported
   ↓
Under Verification (Admin Review)
   ↓
   ├── ✅ Verified (Green) → Resolution Posted → Resolved
   └── ❌ Fake/Rejected (Red) → User Notified
```

---

## 🌍 Map Visualization

The map uses **proportional circle markers**:
- Radius = Base radius × √(report count in area)
- Color = Status of dominant issue in cluster
- Animation = Pulsing ring on high-density areas (10+ reports)

---

## 👨‍💻 Project Info

- **Project**: Mini Project 1
- **Category**: Civic Technology / GIS
- **Developer**: Amruth
- **Year**: 2026

http://127.0.0.1:8000/index.html 