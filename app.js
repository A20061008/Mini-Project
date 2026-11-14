/* =====================================================
   WorldWatch – app.js
   Shared JavaScript: data, auth, i18n, map, analytics.
   (UI strings live in translations.js – load it first.)
   ===================================================== */

// =====================================================
// UTILITIES
// =====================================================
const Util = {
  esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },
  localDate(d = new Date()) {
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },
  statusKey(s) { return { verified: "verified", reviewing: "underReview", fake: "fake", resolved: "resolved" }[s] || s; },
  statusBadge(s) {
    const ic = { verified: "✅", reviewing: "🔍", fake: "❌", resolved: "✔️" }[s] || "";
    return `<span class="badge badge-${Util.esc(s)}">${ic} ${Util.esc(i18n.t(Util.statusKey(s)))}</span>`;
  },
  stars(n) { n = Math.max(0, Math.min(5, +n || 0)); return "★".repeat(n) + "☆".repeat(5 - n); },
  // Only allow data: images/videos or http(s) links as media sources
  safeSrc(src) {
    const value = String(src || "");
    return /^(data:(image|video)\/|https?:\/\/)/i.test(value) || /^\/(?!\/)[\w./-]+(?:\?[^#]*)?$/.test(value) ? value : "";
  },
  readFile(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
  },
  // Shrinks photos so many reports fit in localStorage
  compressImage(file, max = 900, quality = 0.72) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Invalid image")); };
      img.src = url;
    });
  },
  // Image or short video -> { type, src }
  async mediaFromFile(file) {
    if (file.type.startsWith("video/")) {
      if (file.size > 3 * 1024 * 1024) throw new Error("Video must be under 3 MB (browser storage limit). Use a shorter clip or an image.");
      return { type: "video", src: await Util.readFile(file) };
    }
    if (file.type.startsWith("image/")) return { type: "image", src: await Util.compressImage(file) };
    throw new Error("Please choose an image or video file.");
  },
  mediaHtml(m) {
    if (!m || !Util.safeSrc(m.src)) return "";
    return m.type === "video"
      ? `<video class="ww-media" controls preload="metadata" src="${Util.esc(m.src)}"></video>`
      : `<img class="ww-media" alt="" src="${Util.esc(m.src)}">`;
  }
};

// =====================================================
// SAMPLE DATA
// =====================================================
const SAMPLE_ISSUES = [
  {
    id: "ISS001",
    type: "flood",
    title: "Severe Flooding in Kerala Backwaters",
    description: "Heavy rainfall has caused severe flooding in Alappuzha district. Thousands of residents displaced, roads submerged, and rescue operations underway.",
    location: "Alappuzha, Kerala, India",
    lat: 9.4981,
    lng: 76.3388,
    severity: 5,
    status: "verified",
    reportCount: 847,
    reporter: "user@world.com",
    date: "2026-11-01",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS002",
    type: "naturalDisaster",
    title: "Earthquake Tremors Felt in Gujarat",
    description: "An earthquake of magnitude 5.2 struck near Bhuj, Gujarat. Buildings reported damaged, residents evacuated to open grounds.",
    location: "Bhuj, Gujarat, India",
    lat: 23.2420,
    lng: 69.6669,
    severity: 4,
    status: "verified",
    reportCount: 1203,
    reporter: "citizen1@gmail.com",
    date: "2026-11-02",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS003",
    type: "roadAccident",
    title: "Multi-vehicle Pile-up on NH-44",
    description: "A major accident involving 12 vehicles occurred on National Highway 44 near Nagpur. 8 injured, 2 critical. Rescue teams deployed.",
    location: "Nagpur, Maharashtra, India",
    lat: 21.1458,
    lng: 79.0882,
    severity: 4,
    status: "reviewing",
    reportCount: 234,
    reporter: "user@world.com",
    date: "2026-11-03",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS004",
    type: "fire",
    title: "Factory Fire in Surat Industrial Area",
    description: "A massive fire broke out in a textile factory in Surat GIDC area. 15 fire tenders deployed. Workers evacuated safely.",
    location: "Surat, Gujarat, India",
    lat: 21.1702,
    lng: 72.8311,
    severity: 5,
    status: "resolved",
    reportCount: 592,
    reporter: "reporter2@mail.com",
    date: "2026-11-04",
    image: null,
    resolutionImage: null,
    resolutionMsg: "Fire successfully contained by Fire Department. Building declared safe after 18 hours of operation."
  },
  {
    id: "ISS005",
    type: "crime",
    title: "Armed Robbery at Bank Branch",
    description: "Armed robbers attempted to loot a bank branch in Bengaluru CBD. Police responded within minutes, suspects apprehended.",
    location: "Bengaluru, Karnataka, India",
    lat: 12.9716,
    lng: 77.5946,
    severity: 4,
    status: "verified",
    reportCount: 410,
    reporter: "user@world.com",
    date: "2026-11-05",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS006",
    type: "infrastructure",
    title: "Bridge Collapse on Chennai-Trichy Highway",
    description: "An old bridge collapsed on the Chennai-Trichy NH. Traffic diverted. Structural engineers surveying the damage.",
    location: "Villupuram, Tamil Nadu, India",
    lat: 11.9401,
    lng: 79.4861,
    severity: 5,
    status: "reviewing",
    reportCount: 328,
    reporter: "citizen3@gmail.com",
    date: "2026-11-05",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS007",
    type: "pollution",
    title: "Chemical Spillage in Yamuna River",
    description: "Industrial effluents being discharged directly into Yamuna river near Mathura. Water turned black and foul-smelling.",
    location: "Mathura, Uttar Pradesh, India",
    lat: 27.4924,
    lng: 77.6737,
    severity: 4,
    status: "verified",
    reportCount: 1876,
    reporter: "enviro@activist.org",
    date: "2026-11-06",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS008",
    type: "medical",
    title: "Dengue Outbreak in Hyderabad Slums",
    description: "Over 200 cases of dengue fever reported in Amberpet slum area, Hyderabad. Health department deploying medical teams.",
    location: "Hyderabad, Telangana, India",
    lat: 17.3850,
    lng: 78.4867,
    severity: 4,
    status: "verified",
    reportCount: 892,
    reporter: "user@world.com",
    date: "2026-11-07",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS009",
    type: "flood",
    title: "Waterlogging in Mumbai Suburbs",
    description: "Heavy monsoon rains causing massive waterlogging in Kurla, Sion, and Dharavi areas. Train services disrupted.",
    location: "Mumbai, Maharashtra, India",
    lat: 19.0760,
    lng: 72.8777,
    severity: 3,
    status: "resolved",
    reportCount: 2341,
    reporter: "mumbaikar@citizen.com",
    date: "2026-11-08",
    image: null,
    resolutionImage: null,
    resolutionMsg: "Pumping stations restored water levels. BMC cleared all waterlogged areas within 72 hours."
  },
  {
    id: "ISS010",
    type: "naturalDisaster",
    title: "Cyclone Warning for Andhra Coast",
    description: "IMD issues cyclone warning for Andhra Pradesh coast. Storm expected to make landfall near Kakinada. Evacuations underway.",
    location: "Kakinada, Andhra Pradesh, India",
    lat: 16.9891,
    lng: 82.2475,
    severity: 5,
    status: "reviewing",
    reportCount: 3104,
    reporter: "imdalert@gov.in",
    date: "2026-11-09",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS011",
    type: "roadAccident",
    title: "Bus Accident in Himachal Hills",
    description: "A passenger bus fell into a gorge on the Shimla-Kullu road. 32 passengers on board, rescue operation ongoing.",
    location: "Kullu, Himachal Pradesh, India",
    lat: 31.9578,
    lng: 77.1095,
    severity: 5,
    status: "verified",
    reportCount: 677,
    reporter: "user@world.com",
    date: "2026-11-09",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS012",
    type: "crime",
    title: "Missing Children Report - Delhi",
    description: "3 children reported missing from Seemapuri area, Delhi. CCTV footage being analyzed. Police teams deployed.",
    location: "Delhi, India",
    lat: 28.7041,
    lng: 77.1025,
    severity: 5,
    status: "fake",
    reportCount: 15,
    reporter: "anon@fake.com",
    date: "2026-11-10",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS013",
    type: "infrastructure",
    title: "Water Pipeline Burst in Kolkata",
    description: "A major water pipeline burst in Salt Lake City area, Kolkata. Streets flooded with water, thousands without supply.",
    location: "Kolkata, West Bengal, India",
    lat: 22.5726,
    lng: 88.3639,
    severity: 3,
    status: "resolved",
    reportCount: 445,
    reporter: "wb_citizen@mail.com",
    date: "2026-11-10",
    image: null,
    resolutionImage: null,
    resolutionMsg: "Pipeline repaired by KMC. Water supply restored to all affected areas."
  },
  {
    id: "ISS014",
    type: "pollution",
    title: "Air Quality Emergency in Delhi",
    description: "Delhi's AQI hit 480+ (Severe category). Stubble burning combined with Diwali crackers has created a toxic smog.",
    location: "New Delhi, India",
    lat: 28.6139,
    lng: 77.2090,
    severity: 5,
    status: "verified",
    reportCount: 15234,
    reporter: "user@world.com",
    date: "2026-11-11",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  },
  {
    id: "ISS015",
    type: "medical",
    title: "Mass Food Poisoning at Wedding",
    description: "Over 150 guests hospitalized after consuming contaminated food at a wedding function in Rajkot. Health investigation underway.",
    location: "Rajkot, Gujarat, India",
    lat: 22.3039,
    lng: 70.8022,
    severity: 4,
    status: "reviewing",
    reportCount: 203,
    reporter: "user@world.com",
    date: "2026-11-12",
    image: null,
    resolutionImage: null,
    resolutionMsg: null
  }
];

const ISSUE_PREVIEWS = {
  flood: {
    src: "assets/issue-previews/flood.jpg",
    creator: "Podstawko",
    title: "Red Dragon sculpture during River Lee flooding",
    source: "https://commons.wikimedia.org/wiki/File:Red_Dragon_scuplture_during_River_Lee_flooding,_October_2023.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  naturalDisaster: {
    src: "assets/issue-previews/natural-disaster.jpg",
    creator: "C messier",
    title: "Earthquake damage in Choumeri",
    source: "https://commons.wikimedia.org/wiki/File:%CE%9A%CE%B1%CF%84%CE%B1%CF%83%CF%84%CF%81%CE%BF%CF%86%CE%AD%CF%82_%CE%B1%CF%80%CF%8C_%CF%83%CE%B5%CE%B9%CF%83%CE%BC%CF%8C_28-9-2021_%CE%A7%CE%BF%CF%85%CE%BC%CE%AD%CF%81%CE%B9_0457.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  fire: {
    src: "assets/issue-previews/fire.jpg",
    creator: "StevenTerblanche",
    title: "Firefighter at work",
    source: "https://commons.wikimedia.org/wiki/File:Firefighter,_Ashton_Bay,_March_2017.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  crime: {
    src: "assets/issue-previews/crime.jpg",
    creator: "ThibautRe",
    title: "Swedish police car with lights on",
    source: "https://commons.wikimedia.org/wiki/File:Swedish_police_car_with_lights_on.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  roadAccident: {
    src: "assets/issue-previews/road-accident.jpg",
    creator: "Shuets Udono",
    title: "Japanese car accident",
    source: "https://commons.wikimedia.org/wiki/File:Japanese_car_accident.jpg",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/"
  },
  infrastructure: {
    src: "assets/issue-previews/infrastructure.jpg",
    creator: "Irving Underhill",
    title: "Manhattan Bridge construction, 1909",
    source: "https://commons.wikimedia.org/wiki/File:Manhattan_Bridge_Construction_1909.jpg",
    license: "Public domain",
    licenseUrl: "https://commons.wikimedia.org/wiki/Commons:Licensing#Public_domain"
  },
  pollution: {
    src: "assets/issue-previews/pollution.jpg",
    creator: "Radek Kołakowski",
    title: "Smog in Warsaw",
    source: "https://commons.wikimedia.org/wiki/File:Air_pollution_banner_Smog_in_Warsaw.jpg",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/"
  },
  medical: {
    src: "assets/issue-previews/medical.jpg",
    creator: "MdAbeerHussain",
    title: "Mugda Medical College Hospital",
    source: "https://commons.wikimedia.org/wiki/File:Mugda_Medical_College_Hospital_Building.jpg",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/"
  },
  other: {
    src: "assets/issue-previews/other.jpg",
    creator: "Pinakpani",
    title: "Roads and streets in Visakhapatnam",
    source: "https://commons.wikimedia.org/wiki/File:Road_and_streets_in_Visakhapatnam_city,_Andhra_Pradesh_06.jpg",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/"
  }
};

const IssuePreview = {
  for(issue) {
    if (issue && issue.image) {
      const evidence = Util.safeSrc(issue.image);
      if (evidence) return { src: evidence, isEvidence: true };
    }
    return { ...(ISSUE_PREVIEWS[issue && issue.type] || ISSUE_PREVIEWS.other), isEvidence: false };
  },
  html(issue, className = "") {
    const preview = this.for(issue);
    const caption = preview.isEvidence
      ? `<span class="issue-preview-label evidence">Reporter-provided evidence · unverified</span>`
      : `<span class="issue-preview-label">Illustrative image · not the reported incident</span>
         <span class="issue-preview-credit"><a href="${Util.esc(preview.source)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Photo: ${Util.esc(preview.creator)}</a> · <a href="${Util.esc(preview.licenseUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${Util.esc(preview.license)}</a></span>`;
    return `<figure class="issue-preview ${Util.esc(className)}">
      <img src="${Util.esc(preview.src)}" alt="${Util.esc(issue && issue.title ? issue.title : "Issue")} preview" loading="lazy" decoding="async">
      <figcaption>${caption}</figcaption>
    </figure>`;
  }
};

const INDIA_REGIONS = [
  { name: "Andhra Pradesh", aliases: ["andhra pradesh", "visakhapatnam", "vizag", "vijayawada", "kakinada", "tirupati", "nellore", "guntur", "anantapur", "kurnool", "kadapa", "srikakulam", "eluru", "amaravati"] },
  { name: "Arunachal Pradesh", aliases: ["arunachal pradesh", "itanagar"] },
  { name: "Assam", aliases: ["assam", "guwahati"] },
  { name: "Bihar", aliases: ["bihar", "patna"] },
  { name: "Chhattisgarh", aliases: ["chhattisgarh", "raipur"] },
  { name: "Goa", aliases: ["goa", "panaji"] },
  { name: "Gujarat", aliases: ["gujarat", "ahmedabad", "surat", "rajkot", "bhuj"] },
  { name: "Haryana", aliases: ["haryana", "gurugram", "gurgaon", "faridabad"] },
  { name: "Himachal Pradesh", aliases: ["himachal pradesh", "shimla", "kullu"] },
  { name: "Jharkhand", aliases: ["jharkhand", "ranchi"] },
  { name: "Karnataka", aliases: ["karnataka", "bengaluru", "bangalore", "mysuru", "mysore"] },
  { name: "Kerala", aliases: ["kerala", "alappuzha", "kochi", "thiruvananthapuram", "kozhikode", "thrissur", "kannur", "kollam", "palakkad", "wayanad", "malappuram", "ernakulam", "kasaragod", "idukki", "pathanamthitta", "kottayam"] },
  { name: "Madhya Pradesh", aliases: ["madhya pradesh", "bhopal", "indore"] },
  { name: "Maharashtra", aliases: ["maharashtra", "mumbai", "pune", "nagpur", "nashik"] },
  { name: "Manipur", aliases: ["manipur", "imphal"] },
  { name: "Meghalaya", aliases: ["meghalaya", "shillong"] },
  { name: "Mizoram", aliases: ["mizoram", "aizawl"] },
  { name: "Nagaland", aliases: ["nagaland", "kohima"] },
  { name: "Odisha", aliases: ["odisha", "bhubaneswar", "cuttack"] },
  { name: "Punjab", aliases: ["punjab", "amritsar", "ludhiana"] },
  { name: "Rajasthan", aliases: ["rajasthan", "jaipur", "jodhpur"] },
  { name: "Sikkim", aliases: ["sikkim", "gangtok"] },
  { name: "Tamil Nadu", aliases: ["tamil nadu", "chennai", "villupuram", "trichy", "tiruchirappalli", "coimbatore"] },
  { name: "Telangana", aliases: ["telangana", "hyderabad", "warangal", "karimnagar", "nizamabad", "khammam"] },
  { name: "Tripura", aliases: ["tripura", "agartala"] },
  { name: "Uttar Pradesh", aliases: ["uttar pradesh", "mathura", "lucknow", "kanpur", "agra", "varanasi"] },
  { name: "Uttarakhand", aliases: ["uttarakhand", "dehradun"] },
  { name: "West Bengal", aliases: ["west bengal", "kolkata", "calcutta", "salt lake"] },
  { name: "Andaman and Nicobar Islands", aliases: ["andaman and nicobar", "port blair"] },
  { name: "Chandigarh", aliases: ["chandigarh"] },
  { name: "Dadra and Nagar Haveli and Daman and Diu", aliases: ["dadra and nagar haveli", "daman", "diu"] },
  { name: "Delhi", aliases: ["delhi", "new delhi", "seemapuri"] },
  { name: "Jammu and Kashmir", aliases: ["jammu and kashmir", "srinagar", "jammu"] },
  { name: "Ladakh", aliases: ["ladakh", "leh"] },
  { name: "Lakshadweep", aliases: ["lakshadweep"] },
  { name: "Puducherry", aliases: ["puducherry", "pondicherry"] }
];

const DepartmentRouting = {
  region(location) {
    const normalized = ` ${String(location || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
    const matches = INDIA_REGIONS.flatMap(region =>
      region.aliases
        .filter(alias => normalized.includes(` ${alias} `))
        .map(alias => ({ region, length: alias.length }))
    ).sort((a, b) => b.length - a.length);
    return matches.length ? matches[0].region : null;
  },
  suggest(type, location, title = "", description = "") {
    const areaText = `${location} ${title} ${description}`;
    const region = this.region(areaText);
    const state = region ? region.name : "";
    const localName = state ? `${state} ` : "Local ";
    const text = `${title} ${description}`.toLowerCase();
    if (type === "crime") return state ? `${state} Police` : "Local Police / District Police";
    if (type === "fire") return `${localName}Fire and Emergency Services`;
    if (type === "roadAccident") return `${localName}Traffic Police`;
    if (type === "infrastructure") {
      const cityAuthorities = [
        [/\b(mumbai|kurla|sion|dharavi)\b/, "Brihanmumbai Municipal Corporation"],
        [/\b(kolkata|calcutta|salt lake)\b/, "Kolkata Municipal Corporation"],
        [/\b(chennai)\b/, "Greater Chennai Corporation"],
        [/\b(hyderabad|amberpet)\b/, "Greater Hyderabad Municipal Corporation"],
        [/\b(bengaluru|bangalore)\b/, "Bruhat Bengaluru Mahanagara Palike"],
        [/\b(visakhapatnam|vizag)\b/, "Greater Visakhapatnam Municipal Corporation"],
        [/\b(vijayawada)\b/, "Vijayawada Municipal Corporation"],
        [/\b(delhi|new delhi)\b/, "Municipal Corporation of Delhi"]
      ];
      const cityAuthority = cityAuthorities.find(([pattern]) => pattern.test(location || title));
      return cityAuthority ? cityAuthority[1] : `${localName}Public Works Department / Municipal Authority`;
    }
    if (type === "pollution") {
      return state === "Delhi" ? "Delhi Pollution Control Committee" : `${localName}Pollution Control Board`;
    }
    if (type === "medical") return `${localName}Health Department / Emergency Medical Services`;
    if (type === "flood") return `${localName}State Disaster Management Authority`;
    if (type === "naturalDisaster") {
      return /\b(cyclone|storm|weather|rain|wind|forecast|warning)\b/.test(text)
        ? `India Meteorological Department (IMD) / ${state ? state + " " : ""}State Disaster Management Authority`
        : `${localName}State Disaster Management Authority`;
    }
    return `${localName}District Administration / Municipal Authority`;
  },
  options(location, title = "", description = "") {
    const types = ["crime", "fire", "roadAccident", "infrastructure", "pollution", "medical", "flood", "naturalDisaster", "other"];
    return [...new Set(types.map(type => this.suggest(type, location, title, description)))];
  }
};

// =====================================================
// AUTH MANAGER
// =====================================================
const AUTH = {
  // Demo accounts. NOTE: client-side only – a real deployment must verify passwords on a server.
  USERS: [
    { email: "user@world.com", password: "user123", role: "user", name: "Amruth User", id: "u001" },
    { email: "admin@world.com", password: "admin123", role: "admin", name: "Admin Controller", id: "a001" },
    { email: "citizen1@gmail.com", password: "pass123", role: "user", name: "Citizen Reporter", id: "u002" },
  ],

  allUsers() {
    let extra = [];
    try { extra = JSON.parse(localStorage.getItem("ww_users") || "[]"); } catch (e) {}
    return this.USERS.concat(extra);
  },

  // Self-registration is for normal users only (admins are fixed demo accounts)
  register(name, email, password) {
    email = (email || "").trim().toLowerCase();
    if (!name || !email || !password) return { ok: false, msg: "All fields are required." };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, msg: "Enter a valid email address." };
    if (password.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };
    if (this.allUsers().some(u => u.email.toLowerCase() === email)) return { ok: false, msg: "This email is already registered." };
    let extra = [];
    try { extra = JSON.parse(localStorage.getItem("ww_users") || "[]"); } catch (e) {}
    extra.push({ email, password, role: "user", name: name.trim(), id: "u" + Date.now() });
    localStorage.setItem("ww_users", JSON.stringify(extra));
    return { ok: true };
  },

  login(email, password, role) {
    email = (email || "").trim().toLowerCase();
    const user = this.allUsers().find(u => u.email.toLowerCase() === email && u.password === password && u.role === role);
    if (user) {
      localStorage.setItem("ww_session", JSON.stringify({ ...user, loginTime: Date.now() }));
      return user;
    }
    return null;
  },

  // Read-only browsing: can view map, analytics and feed but not report
  guest() {
    localStorage.setItem("ww_session", JSON.stringify({ email: "guest", name: "Guest", role: "user", guest: true, id: "guest", loginTime: Date.now() }));
  },

  logout() {
    localStorage.removeItem("ww_session");
    window.location.href = "index.html";
  },

  getSession() {
    try { return JSON.parse(localStorage.getItem("ww_session") || "null"); } catch (e) { return null; }
  },

  requireAuth(role = null) {
    const session = this.getSession();
    if (!session) { window.location.href = "index.html"; return null; }
    if (role && session.role !== role) { window.location.href = "index.html"; return null; }
    return session;
  }
};

// =====================================================
// DATA MANAGER  (localStorage; syncs live across tabs)
// =====================================================
const DATA = {
  KEY: "ww_issues",
  CONF_KEY: "ww_confirmed",

  init() {
    if (!localStorage.getItem(this.KEY)) {
      this._write(SAMPLE_ISSUES.map(issue => ({
        ...issue,
        department: DepartmentRouting.suggest(issue.type, issue.location, issue.title, issue.description)
      })), true);
      return;
    }
    const issues = this.getAll();
    let updated = false;
    issues.forEach(issue => {
      if (!issue || typeof issue !== "object" || Object.prototype.hasOwnProperty.call(issue, "department")) return;
      issue.department = DepartmentRouting.suggest(issue.type, issue.location, issue.title, issue.description);
      updated = true;
    });
    if (updated) this._write(issues, true);
  },
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; }
  },
  getById(id) { return this.getAll().find(i => i.id === id); },

  _write(list, silent) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
      if (!silent) window.dispatchEvent(new Event("ww:data"));
      return true;
    } catch (e) {
      Toast.show("Browser storage is full. Use a smaller image/video.", "error");
      return false;
    }
  },
  // Fires when data changes here OR in another tab (e.g. admin verifies an issue)
  subscribe(cb) {
    window.addEventListener("ww:data", cb);
    window.addEventListener("storage", e => { if (e.key === this.KEY) cb(); });
  },

  save(issue) {
    const all = this.getAll();
    const n = {
      id: "ISS" + String(Date.now()).slice(-7),
      ...issue,
      date: Util.localDate(),
      status: "reviewing",
      reportCount: 1,
      resolutionImage: null, resolutionMsg: null, resolutionMedia: null
    };
    all.push(n);
    return this._write(all) ? n : null;
  },
  setDepartment(id, department) {
    const all = this.getAll();
    const i = all.find(x => x.id === id);
    if (!i) return null;
    i.department = department || "";
    return this._write(all) ? i : null;
  },
  autoAssignUnassignedDepartments() {
    const all = this.getAll();
    const unassigned = all.filter(issue => !String(issue.department || "").trim());
    if (!unassigned.length) return 0;
    unassigned.forEach(issue => {
      issue.department = DepartmentRouting.suggest(issue.type, issue.location, issue.title, issue.description);
    });
    return this._write(all) ? unassigned.length : null;
  },
  setStatus(id, status) {
    const all = this.getAll();
    const i = all.find(x => x.id === id);
    if (!i) return null;
    i.status = status;
    return this._write(all) ? i : null;
  },
  resolve(id, { msg, media }) {
    const all = this.getAll();
    const i = all.find(x => x.id === id);
    if (!i) return null;
    i.status = "resolved";
    i.resolutionMsg = msg || null;
    i.resolutionMedia = media || null;
    i.resolutionImage = media && media.type === "image" ? media.src : null;
    i.resolvedDate = Util.localDate();
    return this._write(all) ? i : null;
  },
  // "I also see this" – each person can add one report per issue; this grows the map circle
  confirm(id, who) {
    const key = who || "guest";
    let m = {};
    try { m = JSON.parse(localStorage.getItem(this.CONF_KEY) || "{}"); } catch (e) {}
    m[key] = m[key] || [];
    if (m[key].includes(id)) return "dup";
    const all = this.getAll();
    const i = all.find(x => x.id === id);
    if (!i) return "missing";
    i.reportCount = (i.reportCount || 0) + 1;
    if (!this._write(all)) return "error";
    m[key].push(id);
    try { localStorage.setItem(this.CONF_KEY, JSON.stringify(m)); } catch (e) {}
    return "ok";
  },

  getStats(list = this.getAll()) {
    return {
      total: list.length,
      verified: list.filter(i => i.status === "verified").length,
      reviewing: list.filter(i => i.status === "reviewing").length,
      resolved: list.filter(i => i.status === "resolved").length,
      fake: list.filter(i => i.status === "fake").length,
    };
  },
  getByType() {
    const t = {};
    this.getAll().forEach(i => { t[i.type] = (t[i.type] || 0) + 1; });
    return t;
  },
  // Last 30 days for an optional type: incidents per day + reports per day
  getDaily(type = null) {
    const labels = [], idx = {};
    for (let n = 29; n >= 0; n--) {
      const d = new Date(); d.setDate(d.getDate() - n);
      const k = Util.localDate(d);
      idx[k] = labels.length; labels.push(k);
    }
    const incidents = labels.map(() => 0), reports = labels.map(() => 0);
    this.getAll().forEach(i => {
      if (type && i.type !== type) return;
      if (i.date in idx) { incidents[idx[i.date]]++; reports[idx[i.date]] += i.reportCount || 0; }
    });
    return { labels, incidents, reports };
  }
};

// =====================================================
// i18n ENGINE
// =====================================================
const i18n = {
  current: "en",
  htmlLang: { od: "or" },

  t(key) {
    const lang = TRANSLATIONS[this.current] || TRANSLATIONS.en;
    return lang[key] || TRANSLATIONS.en[key] || key;
  },
  setLang(lang) {
    if (!TRANSLATIONS[lang]) lang = "en";
    this.current = lang;
    localStorage.setItem("ww_lang", lang);
    this.applyAll();
    window.dispatchEvent(new Event("ww:lang"));
  },
  loadSaved() {
    const s = localStorage.getItem("ww_lang");
    this.current = TRANSLATIONS[s] ? s : "en";
  },
  applyAll() {
    document.documentElement.lang = this.htmlLang[this.current] || this.current;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) el.setAttribute(attr, this.t(key)); else el.textContent = this.t(key);
    });
    const sel = document.getElementById("langSelector");
    if (sel) sel.value = this.current;
  }
};

// =====================================================
// MAP UTILITIES
// =====================================================
const MapUtils = {
  getStatusColor(status) {
    return { verified: "#4caf50", reviewing: "#ffc107", fake: "#f44336", resolved: "#2196f3" }[status] || "#9e9e9e";
  },
  getTypeIcon(type) {
    return { flood: "🌊", naturalDisaster: "🌪️", fire: "🔥", roadAccident: "🚗", crime: "⚔️",
             infrastructure: "🏗️", pollution: "☁️", medical: "🏥", other: "❓" }[type] || "📍";
  },
  // Circle radius (metres) grows with the number of reports, so busy areas glow larger
  getRadius(reportCount) {
    return Math.min(15000 + Math.sqrt(reportCount || 0) * 1800, 120000);
  },
  // Symbol drawn in the centre marker: green tick = verified, yellow = under verification, red cross = fake
  getSymbol(status) {
    return { verified: "✔", reviewing: "⏳", fake: "✖", resolved: "✔✔" }[status] || "•";
  }
};

const BasemapControl = {
  onAdd(map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group map-style-control";
    this.container.setAttribute("aria-label", "Map style");
    this.streetButton = this.createButton("Map", "Show street map", "streets");
    this.satelliteButton = this.createButton("Satellite", "Show satellite imagery", "satellite");
    this.container.append(this.streetButton, this.satelliteButton);
    map.once("load", () => this.setActive("streets"));
    return this.container;
  },
  onRemove() {
    this.container.remove();
    this.map = undefined;
  },
  createButton(label, title, layerId) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-style-button";
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => this.setActive(layerId));
    return button;
  },
  setActive(layerId) {
    if (!this.map || !this.map.getLayer("street-basemap") || !this.map.getLayer("satellite-basemap")) return;
    const streetVisible = layerId === "streets";
    this.map.setLayoutProperty("street-basemap", "visibility", streetVisible ? "visible" : "none");
    this.map.setLayoutProperty("satellite-basemap", "visibility", streetVisible ? "none" : "visible");
    this.streetButton.setAttribute("aria-pressed", String(streetVisible));
    this.satelliteButton.setAttribute("aria-pressed", String(!streetVisible));
  }
};

const IssueSearchControl = {
  onAdd(map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "map-search-control";
    this.input = document.createElement("input");
    this.input.type = "search";
    this.input.className = "map-search-input";
    this.input.placeholder = "Search reported issues";
    this.input.setAttribute("aria-label", "Search reported issues");
    this.input.setAttribute("list", "map-issue-suggestions");
    this.suggestions = document.createElement("datalist");
    this.suggestions.id = "map-issue-suggestions";
    this.input.addEventListener("change", () => {
      const issue = DATA.getAll().find(item => this.label(item) === this.input.value);
      if (!issue || !Number.isFinite(issue.lat) || !Number.isFinite(issue.lng)) return;
      this.map.flyTo({ center: [issue.lng, issue.lat], zoom: Math.max(this.map.getZoom(), 12) });
      const feature = MapView.collection().features.find(item => item.id === issue.id);
      if (feature) MapView.openIssue({ features: [feature] });
    });
    this.container.append(this.input, this.suggestions);
    this.updateOptions();
    return this.container;
  },
  onRemove() {
    this.container.remove();
    this.map = undefined;
  },
  label(issue) { return `${issue.title} — ${issue.location}`; },
  updateOptions() {
    if (!this.suggestions) return;
    this.suggestions.replaceChildren();
    DATA.getAll().forEach(issue => {
      const option = document.createElement("option");
      option.value = this.label(issue);
      this.suggestions.appendChild(option);
    });
  }
};

function setMapStatus(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let status = container.querySelector(".map-status");
  if (!status) {
    status = document.createElement("div");
    status.className = "map-status";
    status.setAttribute("role", "status");
    container.appendChild(status);
  }
  status.textContent = message || "";
  status.hidden = !message;
}

function createMap(containerId, options = {}) {
  const map = new maplibregl.Map({
    container: containerId,
    center: options.center || [79, 22.5],
    zoom: options.zoom === undefined ? 5 : options.zoom,
    minZoom: 2,
    maxZoom: 18,
    renderWorldCopies: false,
    style: {
      version: 8,
      sources: {
        "esri-streets": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Tiles &copy; Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, &copy; OpenStreetMap contributors, and the GIS User Community"
        },
        "esri-satellite": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          attribution: "Imagery &copy; Esri, Vantor, Earthstar Geographics, and the GIS User Community"
        }
      },
      layers: [
        { id: "street-basemap", type: "raster", source: "esri-streets", layout: { visibility: "visible" } },
        { id: "satellite-basemap", type: "raster", source: "esri-satellite", layout: { visibility: "none" } }
      ]
    },
    attributionControl: true
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
  map.addControl(new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
  }), "top-right");
  map.addControl(new maplibregl.FullscreenControl(), "top-right");
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
  map.addControl(Object.create(BasemapControl), "top-right");
  if (options.issueSearch) map.addControl(IssueSearchControl, "top-left");
  let styleLoaded = false;
  map.on("load", () => {
    styleLoaded = true;
    if (typeof options.onLoad === "function") options.onLoad(map);
  });
  map.on("error", event => {
    if (event.error) {
      if (!styleLoaded || String(event.sourceId || "").startsWith("esri-")) {
        setMapStatus(containerId, "Map tiles could not load. Check your internet connection.");
      }
      console.error("Map tile or style failed to load:", event.error);
    }
  });
  return map;
}

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================
const Toast = {
  show(message, type = "info") {
    const container = document.getElementById("toastContainer") || (() => {
      const c = document.createElement("div");
      c.id = "toastContainer";
      c.className = "toast-container";
      document.body.appendChild(c);
      return c;
    })();

    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-text">${message}</span>
      <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOutRight 0.3s ease-in forwards";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// =====================================================
// MODAL UTILITIES
// =====================================================
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  },
  close(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove("show");
      document.body.style.overflow = "";
    }
  }
};


// =====================================================
// FLOWCHART BUILDER
// =====================================================
const FlowChart = {
  configs: {
    flood: {
      icon: "🌊",
      title: "Flood Issue Lifecycle",
      color: "#1a73e8",
      steps: [
        { type: "start", label: "Flood Reported", icon: "🌊" },
        { type: "process", label: "Field Verification by Disaster Mgmt Team", icon: "🔍" },
        { type: "process", label: "Severity Assessment & Area Mapping", icon: "🗺️" },
        { type: "decision", label: "Genuine Flood?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – Rescue ops deployed", icon: "🚁" },
          { type: "danger", label: "❌ Marked Fake – User notified", icon: "🚫" }
        ],
        { type: "info", label: "Relief camps set up, pumping begins", icon: "🏕️" },
        { type: "end", label: "Resolved – Area declared safe", icon: "✅" }
      ]
    },
    naturalDisaster: {
      icon: "🌪️",
      title: "Natural Disaster Issue Lifecycle",
      color: "#9c27b0",
      steps: [
        { type: "start", label: "Disaster Reported", icon: "🌪️" },
        { type: "process", label: "NDMA Team Dispatched", icon: "🚨" },
        { type: "process", label: "Impact Zone Assessment", icon: "📊" },
        { type: "decision", label: "Confirmed Disaster?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – Emergency declared", icon: "🏛️" },
          { type: "danger", label: "❌ Rejected – False alarm", icon: "🚫" }
        ],
        { type: "info", label: "Emergency services + Military deployed", icon: "🪖" },
        { type: "end", label: "Resolved – Area Rehabilitated", icon: "🏠" }
      ]
    },
    fire: {
      icon: "🔥",
      title: "Fire Incident Lifecycle",
      color: "#ff5722",
      steps: [
        { type: "start", label: "Fire Reported", icon: "🔥" },
        { type: "process", label: "Fire Brigade Dispatched", icon: "🚒" },
        { type: "process", label: "Scene Assessment & Evacuation", icon: "🏃" },
        { type: "decision", label: "Fire Confirmed?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – Active firefighting", icon: "🧯" },
          { type: "danger", label: "❌ False Alarm – All clear", icon: "✅" }
        ],
        { type: "info", label: "Fire contained, damage assessed", icon: "📋" },
        { type: "end", label: "Resolved – Area secured & cleared", icon: "🏗️" }
      ]
    },
    roadAccident: {
      icon: "🚗",
      title: "Road Accident Issue Lifecycle",
      color: "#f44336",
      steps: [
        { type: "start", label: "Accident Reported", icon: "🚗" },
        { type: "process", label: "Police + Ambulance Dispatched", icon: "🚑" },
        { type: "process", label: "Scene Control & Evidence Collection", icon: "🔍" },
        { type: "decision", label: "Genuine Accident?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – FIR registered", icon: "📝" },
          { type: "danger", label: "❌ Rejected – No accident found", icon: "🚫" }
        ],
        { type: "info", label: "Victims treated, road cleared", icon: "🏥" },
        { type: "end", label: "Resolved – Case filed & road reopened", icon: "🛣️" }
      ]
    },
    crime: {
      icon: "⚔️",
      title: "Crime / Murder Issue Lifecycle",
      color: "#c62828",
      steps: [
        { type: "start", label: "Crime Reported", icon: "⚔️" },
        { type: "process", label: "Police Team Dispatched", icon: "👮" },
        { type: "process", label: "FIR Registration & Evidence Collection", icon: "📋" },
        { type: "decision", label: "Crime Confirmed?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – Investigation launched", icon: "🔎" },
          { type: "danger", label: "❌ Rejected – False report, penalized", icon: "⚖️" }
        ],
        { type: "info", label: "Suspect identified & arrested", icon: "🔒" },
        { type: "end", label: "Resolved – Court proceedings initiated", icon: "⚖️" }
      ]
    },
    infrastructure: {
      icon: "🏗️",
      title: "Infrastructure Damage Lifecycle",
      color: "#795548",
      steps: [
        { type: "start", label: "Damage Reported", icon: "🏗️" },
        { type: "process", label: "Municipal Engineers Dispatched", icon: "👷" },
        { type: "process", label: "Structural Safety Assessment", icon: "📐" },
        { type: "decision", label: "Damage Confirmed?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – Repair order issued", icon: "🔧" },
          { type: "danger", label: "❌ Rejected – No damage found", icon: "🚫" }
        ],
        { type: "info", label: "Repair work commenced, area cordoned", icon: "🚧" },
        { type: "end", label: "Resolved – Structure restored & opened", icon: "🏛️" }
      ]
    },
    pollution: {
      icon: "☁️",
      title: "Environmental Pollution Lifecycle",
      color: "#388e3c",
      steps: [
        { type: "start", label: "Pollution Reported", icon: "☁️" },
        { type: "process", label: "PCB Officials + Lab Tests Ordered", icon: "🧪" },
        { type: "process", label: "Sample Collection & Analysis", icon: "🔬" },
        { type: "decision", label: "Pollution Confirmed?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – Violator notices issued", icon: "📜" },
          { type: "danger", label: "❌ Rejected – Within safe limits", icon: "✅" }
        ],
        { type: "info", label: "Cleanup drive & legal action", icon: "🧹" },
        { type: "end", label: "Resolved – Environment restored", icon: "🌿" }
      ]
    },
    medical: {
      icon: "🏥",
      title: "Medical Emergency Lifecycle",
      color: "#e91e63",
      steps: [
        { type: "start", label: "Emergency Reported", icon: "🏥" },
        { type: "process", label: "Medical Teams Dispatched", icon: "🚑" },
        { type: "process", label: "Triage & Patient Assessment", icon: "💊" },
        { type: "decision", label: "Emergency Confirmed?", icon: "❓" },
        [
          { type: "success", label: "✅ Verified – Treatment started", icon: "💉" },
          { type: "danger", label: "❌ Rejected – No emergency found", icon: "🚫" }
        ],
        { type: "info", label: "Patients stabilized & hospitalized", icon: "🛏️" },
        { type: "end", label: "Resolved – Situation controlled", icon: "🩺" }
      ]
    }
  },

};

// =====================================================
// ISSUE VIEWER  (details + reported image + resolution proof)
// =====================================================
const IssueViewer = {
  open(id) {
    const i = DATA.getById(id);
    if (!i) return;
    let ov = document.getElementById("wwViewer");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "wwViewer";
      ov.className = "modal-overlay";
      ov.addEventListener("click", e => { if (e.target === ov) IssueViewer.close(); });
      document.body.appendChild(ov);
    }
    const hasEvidence = Boolean(i.image && Util.safeSrc(i.image));
    const reported = hasEvidence
      ? Util.mediaHtml({ type: "image", src: i.image })
      : IssuePreview.html(i, "viewer-preview");
    let resolution = "";
    if (i.status === "resolved") {
      const media = i.resolutionMedia || (i.resolutionImage ? { type: "image", src: i.resolutionImage } : null);
      resolution = `
        <div class="ww-res-block">
          <h4>✔️ ${Util.esc(i18n.t("resolutionProof"))}</h4>
          ${Util.mediaHtml(media)}
          <p>${Util.esc(i.resolutionMsg || "")}</p>
        </div>`;
    }
    ov.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">${MapUtils.getTypeIcon(i.type)} ${Util.esc(i.title)}</span>
          <button class="modal-close" onclick="IssueViewer.close()">✕</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom:10px">${Util.statusBadge(i.status)}
            <span class="ww-chip">${Util.esc(i18n.t(i.type))}</span>
            <span class="ww-chip">👥 ${i.reportCount} ${Util.esc(i18n.t("reports"))}</span>
            <span class="ww-chip" style="color:#ffc107">${Util.stars(i.severity)}</span>
          </div>
          <p style="font-size:14px;color:#444;line-height:1.6">${Util.esc(i.description)}</p>
          <p style="font-size:12px;color:#888;margin:8px 0 14px">📍 ${Util.esc(i.location)} &nbsp;·&nbsp; 📅 ${Util.esc(i.date)}</p>
          <h4 class="ww-sub">${hasEvidence ? Util.esc(i18n.t("reportedImage")) : "Illustrative preview · not report evidence"}</h4>
          ${reported}
          ${resolution}
        </div>
        <div class="modal-footer"><button class="btn btn-primary" onclick="IssueViewer.close()">${Util.esc(i18n.t("close"))}</button></div>
      </div>`;
    Modal.open("wwViewer");
  },
  close() { Modal.close("wwViewer"); }
};

// =====================================================
// MAP VIEW  (MapLibre GL) – shared by user and admin pages
// =====================================================
const MapView = {
  map: null, filter: "all", opts: {}, containerId: null, popup: null, markers: [],

  init(elId, opts = {}) {
    this.opts = opts;
    this.containerId = elId;
    this.map = createMap(elId, {
      center: [79, 22.5],
      zoom: 5,
      issueSearch: true,
      onLoad: () => {
        this.map.addSource("issue-regions", { type: "geojson", data: this.collection() });
        this.map.addLayer({
          id: "issue-regions",
          type: "circle",
          source: "issue-regions",
          paint: {
            "circle-radius": ["interpolate", ["exponential", 0.6], ["get", "reportCount"], 0, 9, 100, 19, 1000, 32, 5000, 44],
            "circle-color": ["get", "color"],
            "circle-opacity": 0.16,
            "circle-stroke-color": ["get", "color"],
            "circle-stroke-width": 2,
            "circle-stroke-opacity": 0.8
          }
        });
        this.map.on("click", event => {
          const features = this.map.queryRenderedFeatures(event.point, { layers: ["issue-regions"] });
          if (features.length) this.openIssue({ features: [features[0]] });
        });
        this.map.on("mouseenter", "issue-regions", () => { this.map.getCanvas().style.cursor = "pointer"; });
        this.map.on("mouseleave", "issue-regions", () => { this.map.getCanvas().style.cursor = ""; });
        this.render();
        this.fitIssues();
      }
    });
    DATA.subscribe(() => this.render());           // live updates (verification, new reports)
    window.addEventListener("ww:lang", () => this.render());
  },
  setFilter(f) { this.filter = f; this.render(); },
  refresh() { if (this.map) setTimeout(() => this.map.resize(), 50); },
  closePopup() {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  },
  openIssue(event) {
    const feature = event.features && event.features[0];
    if (!feature) return;
    this.closePopup();
    const coordinates = feature.geometry.coordinates.slice();
    this.popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "320px" })
      .setLngLat(coordinates)
      .setHTML(feature.properties.popupHtml)
      .addTo(this.map);
    this.popup.on("close", () => { this.popup = null; });
  },
  collection() {
    const issues = DATA.getAll().filter(i =>
      (this.filter === "all" || i.type === this.filter) &&
      Number.isFinite(i.lat) && Number.isFinite(i.lng)
    );
    return {
      type: "FeatureCollection",
      features: issues.map(i => ({
        type: "Feature",
        id: i.id,
        geometry: { type: "Point", coordinates: [i.lng, i.lat] },
        properties: {
          color: MapUtils.getStatusColor(i.status),
          symbol: MapUtils.getSymbol(i.status),
          type: i.type,
          title: i.title,
          location: i.location,
          reportCount: Math.max(0, Number(i.reportCount) || 0),
          popupHtml: this.popupHtml(i)
        }
      }))
    };
  },
  fitIssues() {
    if (!this.map) return;
    const points = this.collection().features.map(feature => feature.geometry.coordinates);
    if (points.length > 1) {
      const bounds = points.reduce((result, point) => result.extend(point), new maplibregl.LngLatBounds(points[0], points[0]));
      this.map.fitBounds(bounds, { padding: 48, maxZoom: 5, duration: 0 });
    } else if (points.length === 1) {
      this.map.jumpTo({ center: points[0], zoom: 10 });
    }
  },

  popupHtml(i) {
    const extra = this.opts.popupExtra ? this.opts.popupExtra(i) : "";
    const canConfirm = this.opts.canConfirm && (i.status === "reviewing" || i.status === "verified");
    return `
      <div class="issue-popup">
        <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px">${MapUtils.getTypeIcon(i.type)} ${Util.esc(i18n.t(i.type))}</div>
        <div class="popup-title">${Util.esc(i.title)}</div>
        <div style="font-size:13px;color:#555;margin:6px 0">${Util.esc(i.description.slice(0, 110))}${i.description.length > 110 ? "…" : ""}</div>
        <div>${Util.statusBadge(i.status)}</div>
        <div class="popup-reports">👥 ${i.reportCount} ${Util.esc(i18n.t("reports"))}</div>
        <div style="font-size:12px;color:#999;margin-top:4px">📍 ${Util.esc(i.location)}</div>
        <div class="ww-popup-actions">
          <button class="btn btn-sm btn-outline" onclick="IssueViewer.open('${i.id}')">${i.status === "resolved" ? "✔️ " + Util.esc(i18n.t("viewResolution")) : "🔎"}</button>
          ${canConfirm ? `<button class="btn btn-sm btn-primary" onclick="MapView.confirm('${i.id}')">👥 ${Util.esc(i18n.t("alsoSeeThis"))}</button>` : ""}
          ${extra}
        </div>
      </div>`;
  },

  render() {
    if (!this.map || !this.map.isStyleLoaded() || !this.map.getSource("issue-regions")) return;
    this.closePopup();
    const collection = this.collection();
    this.map.getSource("issue-regions").setData(collection);
    IssueSearchControl.updateOptions();
    this.markers.forEach(marker => marker.remove());
    this.markers = collection.features.map(feature => {
      const { color, symbol, title, location, reportCount } = feature.properties;
      const element = document.createElement("button");
      element.type = "button";
      element.className = "issue-map-marker";
      element.style.setProperty("--issue-color", color);
      element.setAttribute("aria-label", `${title}, ${location}, ${reportCount} reports`);
      element.title = `${title} · ${location}`;

      const status = document.createElement("span");
      status.className = "issue-map-marker-status";
      status.textContent = symbol;
      const count = document.createElement("span");
      count.className = "issue-map-marker-count";
      count.textContent = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(reportCount);
      element.append(status, count);
      element.addEventListener("click", event => {
        event.stopPropagation();
        this.openIssue({ features: [feature] });
      });

      return new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat(feature.geometry.coordinates)
        .addTo(this.map);
    });
  },

  confirm(id) {
    const s = AUTH.getSession();
    const r = DATA.confirm(id, s ? s.email : "guest");
    if (r === "ok") Toast.show(i18n.t("thanksCounted"), "success");
    else if (r === "dup") Toast.show("✔ " + i18n.t("thanksCounted"), "info");
    this.closePopup();
  }
};


// =====================================================
// FLOWCHART BUILDER  (one lifecycle flowchart per issue type)
// =====================================================
FlowChart.configs.other = {
  icon: "❓", title: "General Issue Lifecycle", color: "#607d8b",
  steps: [
    { type: "start", label: "Issue Reported", icon: "❓" },
    { type: "process", label: "Admin Reviews Report & Evidence", icon: "🔍" },
    { type: "process", label: "Relevant Authority Contacted", icon: "📞" },
    { type: "decision", label: "Genuine Issue?", icon: "❓" },
    [
      { type: "success", label: "✅ Verified – Action assigned", icon: "📌" },
      { type: "danger", label: "❌ Rejected – Reporter notified", icon: "🚫" }
    ],
    { type: "info", label: "Authority works on the issue", icon: "🛠️" },
    { type: "end", label: "Resolved – Proof image/video posted", icon: "✅" }
  ]
};

FlowChart.render = function (containerId, type, counts) {
  const c = this.configs[type] || this.configs.other;
  const el = document.getElementById(containerId);
  if (!el) return;
  const badge = (kind) => {
    if (!counts) return "";
    const n = { start: counts.total, success: counts.verified + counts.resolved, danger: counts.fake, end: counts.resolved }[kind];
    return n === undefined ? "" : `<span class="flow-count">${n}</span>`;
  };
  const box = s => `<div class="flow-box ${s.type}"><span style="font-size:18px">${s.icon}</span> ${s.label}${badge(s.type)}</div>`;
  let h = `<div class="flowchart-title" style="border-left-color:${c.color}">${c.icon} ${c.title}</div><div class="flow-chart">`;
  c.steps.forEach((s, i) => {
    if (i > 0) h += `<div class="flow-arrow down">↓</div>`;
    h += Array.isArray(s)
      ? `<div class="flow-branch">${s.map(b => `<div class="flow-branch-col">${box(b)}</div>`).join("")}</div>`
      : box(s);
  });
  el.innerHTML = h + `</div>`;
};

// =====================================================
// ANALYTICS  – overall dashboard + a separate panel per issue type
// (each type gets its own stats, bar graph, line graph and flowchart)
// =====================================================
const Analytics = {
  charts: {},
  built: false,
  current: "flood",
  TYPES: ["flood", "naturalDisaster", "fire", "roadAccident", "crime", "infrastructure", "pollution", "medical", "other"],
  PALETTE: ["#1a73e8", "#4caf50", "#ff5722", "#9c27b0", "#ff9800", "#00bcd4", "#f44336", "#2196f3", "#607d8b"],

  _chart(key, canvasId, cfg) {
    const cv = document.getElementById(canvasId);
    if (!cv) return;
    if (this.charts[key]) this.charts[key].destroy();
    this.charts[key] = new Chart(cv.getContext("2d"), cfg);
  },
  _statCard(cls, iconCls, icon, value, label) {
    return `<div class="stat-card ${cls}"><div class="stat-icon ${iconCls}"><i class="fa ${icon}"></i></div>
      <div class="stat-info"><div class="stat-value">${value}</div><div class="stat-label">${Util.esc(label)}</div></div></div>`;
  },

  // ---------- Overall ----------
  renderOverview() {
    const all = DATA.getAll(), s = DATA.getStats(all), t = i18n.t.bind(i18n);
    const stats = document.getElementById("analyticsStats");
    if (stats) stats.innerHTML =
      this._statCard("total", "blue", "fa-globe", s.total, t("totalIssues")) +
      this._statCard("verified", "green", "fa-check-circle", s.verified, t("verified")) +
      this._statCard("reviewing", "amber", "fa-clock", s.reviewing, t("underReview")) +
      this._statCard("resolved", "indigo", "fa-check-double", s.resolved, t("resolved")) +
      this._statCard("fake", "red", "fa-times-circle", s.fake, t("fake"));

    const byType = DATA.getByType(), keys = Object.keys(byType);
    this._chart("cat", "categoryChart", {
      type: "bar",
      data: { labels: keys.map(k => t(k)), datasets: [{ label: t("totalIssues"), data: keys.map(k => byType[k]),
        backgroundColor: keys.map(k => FlowChart.configs[k]?.color || "#607d8b"), borderRadius: 6 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
    });

    const d = DATA.getDaily();
    this._chart("trend", "trendChart", {
      type: "line",
      data: { labels: d.labels.map(x => x.slice(5)), datasets: [{ label: t("totalIssues"), data: d.incidents, fill: true,
        backgroundColor: "rgba(26,115,232,0.1)", borderColor: "#1a73e8", pointRadius: 3, tension: 0.35 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
    });

    this._chart("status", "statusChart", {
      type: "pie",
      data: { labels: [t("verified"), t("underReview"), t("resolved"), t("fake")],
        datasets: [{ data: [s.verified, s.reviewing, s.resolved, s.fake], backgroundColor: ["#4caf50", "#ffc107", "#2196f3", "#f44336"], borderColor: "#fff", borderWidth: 2 }] },
      options: { plugins: { legend: { position: "bottom" } } }
    });

    const sev = [0, 0, 0, 0, 0];
    all.forEach(i => { if (i.severity >= 1 && i.severity <= 5) sev[i.severity - 1]++; });
    this._chart("sev", "severityChart", {
      type: "doughnut",
      data: { labels: [1, 2, 3, 4, 5].map(n => "★".repeat(n)), datasets: [{ data: sev,
        backgroundColor: ["#4caf50", "#8bc34a", "#ffc107", "#ff5722", "#f44336"], borderColor: "#fff", borderWidth: 2 }] },
      options: { cutout: "60%", plugins: { legend: { position: "bottom" } } }
    });
  },

  // ---------- Per issue type ----------
  renderTypeTabs() {
    const box = document.getElementById("typeTabs");
    if (!box) return;
    box.innerHTML = this.TYPES.map(k => {
      const n = DATA.getAll().filter(i => i.type === k).length;
      return `<button class="filter-btn ${k === this.current ? "active" : ""}" onclick="Analytics.selectType('${k}')">
        ${MapUtils.getTypeIcon(k)} ${Util.esc(i18n.t(k))} <small>(${n})</small></button>`;
    }).join("");
  },
  selectType(k) { this.current = k; this.renderTypeTabs(); this.renderType(); },

  renderType() {
    const panel = document.getElementById("typePanel");
    if (!panel) return;
    const type = this.current, t = i18n.t.bind(i18n);
    const color = FlowChart.configs[type]?.color || "#607d8b";
    const list = DATA.getAll().filter(i => i.type === type);
    const s = DATA.getStats(list);
    const reports = list.reduce((a, i) => a + (i.reportCount || 0), 0);
    const avgSev = list.length ? (list.reduce((a, i) => a + (+i.severity || 0), 0) / list.length).toFixed(1) : "–";
    const rate = list.length ? Math.round((s.resolved / list.length) * 100) + "%" : "–";

    panel.innerHTML = `
      <div class="stats-grid">
        ${this._statCard("total", "blue", "fa-globe", s.total, t("totalIssues"))}
        ${this._statCard("verified", "green", "fa-users", reports.toLocaleString(), t("totalReports"))}
        ${this._statCard("reviewing", "amber", "fa-star", avgSev, t("avgSeverity"))}
        ${this._statCard("resolved", "indigo", "fa-check-double", rate, t("resolutionRate"))}
      </div>
      <div class="pipeline">
        <div class="pipe-step"><b>${s.total}</b><span>${Util.esc(t("reportedStage"))}</span></div><div class="pipe-arrow">→</div>
        <div class="pipe-step y"><b>${s.reviewing}</b><span>${Util.esc(t("underReview"))}</span></div><div class="pipe-arrow">→</div>
        <div class="pipe-step g"><b>${s.verified}</b><span>${Util.esc(t("verified"))}</span></div>
        <div class="pipe-step r"><b>${s.fake}</b><span>${Util.esc(t("fake"))}</span></div><div class="pipe-arrow">→</div>
        <div class="pipe-step b"><b>${s.resolved}</b><span>${Util.esc(t("resolved"))}</span></div>
      </div>
      <div class="charts-grid">
        <div class="chart-card"><div class="card-title" style="margin-bottom:12px">📊 ${Util.esc(t("barChart"))}</div><canvas id="typeBar"></canvas></div>
        <div class="chart-card"><div class="card-title" style="margin-bottom:12px">📈 ${Util.esc(t("lineChart"))}</div><canvas id="typeLine"></canvas></div>
      </div>
      <div id="typeFlow" style="max-width:520px;margin:0 auto"></div>`;

    // Bar graph: reports per incident of this type (top 8), coloured by status
    const top = list.slice().sort((a, b) => b.reportCount - a.reportCount).slice(0, 8);
    this._chart("typeBar", "typeBar", {
      type: "bar",
      data: { labels: top.map(i => i.title.length > 26 ? i.title.slice(0, 25) + "…" : i.title),
        datasets: [{ label: t("reports"), data: top.map(i => i.reportCount), backgroundColor: top.map(i => MapUtils.getStatusColor(i.status)), borderRadius: 6 }] },
      options: { indexAxis: "y", plugins: { legend: { display: false },
        tooltip: { callbacks: { title: c => top[c[0].dataIndex].title } } },
        scales: { x: { beginAtZero: true }, y: { grid: { display: false } } } }
    });

    // Line graph: reports (left axis) and new incidents (right axis) over the last 30 days
    const d = DATA.getDaily(type);
    this._chart("typeLine", "typeLine", {
      type: "line",
      data: { labels: d.labels.map(x => x.slice(5)), datasets: [
        { label: t("reports"), data: d.reports, borderColor: color, backgroundColor: color + "22", fill: true, tension: 0.35, pointRadius: 3, yAxisID: "y" },
        { label: t("totalIssues"), data: d.incidents, borderColor: "#455a64", borderDash: [5, 4], tension: 0.2, pointRadius: 3, yAxisID: "y1" }
      ] },
      options: { interaction: { mode: "index", intersect: false }, plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true, position: "left" },
                  y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, ticks: { precision: 0 } },
                  x: { grid: { display: false } } } }
    });

    // Flowchart with live counts for this type
    FlowChart.render("typeFlow", type, s);
  },

  renderAll() { this.renderOverview(); this.renderTypeTabs(); this.renderType(); },
  init() {
    if (this.built) return this.renderAll();
    this.built = true;
    this.renderAll();
    DATA.subscribe(() => this.renderAll());
    window.addEventListener("ww:lang", () => this.renderAll());
  }
};

// =====================================================
// INIT
// =====================================================
DATA.init();
i18n.loadSaved();

document.addEventListener("DOMContentLoaded", () => {
  i18n.applyAll();
  const sel = document.getElementById("langSelector");
  if (sel) sel.addEventListener("change", e => i18n.setLang(e.target.value));
});
