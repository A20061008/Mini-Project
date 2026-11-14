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
- Illustrative, attributed category-image previews; reporter-uploaded evidence remains separate
- AI assistant for general questions, category-filtered issue lists across all supported types, and WorldWatch website help
- Retrieval-augmented answers use relevant sections from the project guide and visible app pages to answer application questions
- Practical, general response and future-prevention guidance for issue categories; reported resolution details are included when available
- “AI Solutions and Preventions” dashboard section with category filters, immediate response and prevention tips, related local reports, and unverified report-severity attention signals
- Safety guidance is not a forecast: the app has no connected live weather, sensor, hospital, police, or traffic feeds and cannot predict earthquakes, tornado paths, waves, or future incidents; follow official local alerts and emergency services
- AI Solutions includes charts from locally stored issue history, a complete issue-and-prevention PDF, and a separate seven-day issue-volume trend PDF. Projections use a simple linear trend over the last 30 days, exclude rejected reports, and allocate category estimates by recent historical share; sparse data may make estimates unavailable or unreliable.
- These statistical projections describe issue-report volume only. They are not AI-generated hazard forecasts, probabilities, incident predictions, or official warnings, and must not be used for emergency decisions.
- Local help mode keeps issue lookups, app guidance, report drafts, and safety precautions usable when the AI provider is unavailable
- Report drafts prepared from conversation, then reviewed and submitted by the user
- Local image quality screening for resolution, lighting, and contrast; an administrator must still verify the incident

### ✅ Verification System
- **🟢 Verified** – Confirmed real issue (green tick mark)
- **🟡 Under Verification** – Being reviewed (yellow indicator)
- **🔴 Fake/Rejected** – Determined to be false (red indicator)
- After resolution: resolution image/video displayed against each issue

### 🏢 Department Task Queue
- Admins can view issues grouped by department, review each assignment, and edit it from Issue Management.
- Suggested routing uses issue type and recognized Indian state/city names (for example, Andhra Pradesh crime reports suggest Andhra Pradesh Police).
- Suggestions are not dispatches or official determinations; administrators must confirm the appropriate local agency.

### 🖼️ Issue Preview Images
- Sample issues and reports without an uploaded photo use a locally stored, category-relevant illustrative preview.
- Every preview is labelled as illustrative and not evidence of the reported incident. Uploaded evidence is shown separately as unverified.
- Preview-photo credits and license links are shown in the UI:

| Category | Credit | License and source |
|----------|--------|-------------------|
| Flood | Podstawko | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Red_Dragon_scuplture_during_River_Lee_flooding,_October_2023.jpg) |
| Natural disaster | C messier | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:%CE%9A%CE%B1%CF%84%CE%B1%CF%83%CF%84%CF%81%CE%BF%CF%86%CE%AD%CF%82_%CE%B1%CF%80%CF%8C_%CF%83%CE%B5%CE%B9%CF%83%CE%BC%CF%8C_28-9-2021_%CE%A7%CE%BF%CF%85%CE%BC%CE%AD%CF%81%CE%B9_0457.jpg) |
| Fire | StevenTerblanche | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Firefighter,_Ashton_Bay,_March_2017.jpg) |
| Crime | ThibautRe | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Swedish_police_car_with_lights_on.jpg) |
| Road accident | Shuets Udono | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Japanese_car_accident.jpg) |
| Infrastructure | Irving Underhill | Public domain · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Manhattan_Bridge_Construction_1909.jpg) |
| Pollution | Radek Kołakowski | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Air_pollution_banner_Smog_in_Warsaw.jpg) |
| Medical | MdAbeerHussain | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mugda_Medical_College_Hospital_Building.jpg) |
| Other | Pinakpani | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Road_and_streets_in_Visakhapatnam_city,_Andhra_Pradesh_06.jpg) |

> The assistant uses the AI provider configured by the server when available; without it, local help still supports report lookups, application guidance, report drafts, and category-based safety precautions. AI answers may be inaccurate; recommendations are general guidance, not official instructions, and it does not have live web or weather access or contact authorities. Relevant application documentation and matching issue summaries may be sent to the configured provider. Generated reports are only drafts until the user reviews and submits them. Image screening evaluates basic quality only; it does not identify or authenticate incident content.

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
- A short, captioned application demo video appears above the login choices

---

## 🚀 How to Run

1. Install Python 3.9 or later.
2. Configure an AI provider. For the default OpenAI-compatible endpoint, set your key in PowerShell (do not put it in a source file):
   ```powershell
   $env:AI_API_KEY="your-provider-api-key"
   python server.py
   ```
   `OPENAI_API_KEY` is also accepted as an alternative environment variable. Optional settings: `AI_BASE_URL` (defaults to `https://api.openai.com/v1`), `AI_MODEL` (defaults to `gpt-4o-mini`), `PORT` (defaults to `8001`), and `HOST` (defaults to `127.0.0.1`). The server also supports local OpenAI-compatible services such as Ollama; set `AI_BASE_URL` and `AI_MODEL` to match your local service. No API key is sent to the browser.
3. Open `http://127.0.0.1:8001/index.html`, watch or skip the tutorial, then sign in or continue as guest. Run `python server.py` rather than `python -m http.server`; the AI endpoint and media assets are served by this server. If no provider key is configured or the provider is offline, the assistant switches to local help for issue lookups, app guidance, report drafts, and prevention/precaution advice.
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
├── assistant.js        # Shared chatbot behavior
├── server.py           # Python web server and AI provider proxy
├── tutorial.mp4        # Captioned login-page walkthrough
├── tutorial-poster.jpg # Tutorial video poster
├── assets/
│   └── issue-previews/ # Attributed illustrative images by issue category
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