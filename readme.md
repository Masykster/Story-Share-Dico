# StoryShare

A Progressive Web App (PWA) for sharing stories with location-based mapping. Built with vanilla JavaScript and Vite, StoryShare lets users post stories pinned to a map, view others' stories geographically, and stay updated via push notifications — all with offline support.

🌐 **Live Demo:** [story-share-dico.netlify.app](https://story-share-dico.netlify.app/#/login)

---

## Features

- **Single Page Application (SPA)** — smooth page transitions with no full reloads
- **Interactive Map** — stories displayed as markers using Leaflet.js; explore stories geographically
- **Add New Stories** — create stories with a photo, description, and pinned map location
- **Push Notifications** — receive real-time notifications when new stories are posted; toggle subscribe/unsubscribe
- **PWA Support** — installable to home screen on mobile and desktop; works offline (app shell + cached data)
- **IndexedDB Storage** — save, browse, and delete stories locally; data persists across sessions
- **Offline Sync** — create stories while offline; they sync automatically when connectivity is restored
- **Accessible** — built to meet web accessibility standards (WCAG)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build Tool | [Vite](https://vitejs.dev/) v6 |
| Mapping | [Leaflet.js](https://leafletjs.com/) v1.9 |
| Storage | IndexedDB (via native browser API) |
| Background Sync | Service Worker + Push API |
| Deployment | Netlify |

---

## Getting Started

### Prerequisites

- Node.js **v18+**
- npm **v9+**
- A map service API key (e.g., [Maptiler](https://www.maptiler.com/) or similar tile provider)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Masykster/Story-Share-Dico.git
cd Story-Share-Dico

# 2. Install dependencies
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build & Preview

```bash
# Production build
npm run build

# Preview the production build locally
npm run preview
```

---

## Project Structure

```
Story-Share-Dico/
├── src/
│   ├── scripts/        # App logic (models, views, presenters)
│   ├── styles/         # CSS stylesheets
│   └── index.html      # App entry point
├── STUDENT.txt         # Environment variable template
├── update-task.md      # Feature requirements / task notes
├── vite.config.js      # Vite configuration
└── package.json
```

---

## PWA & Offline Support

StoryShare is fully installable as a PWA:

1. Open the app in Chrome (mobile or desktop)
2. Click the **Install** prompt or use the browser menu → *"Add to Home Screen"*
3. The app launches in standalone mode with no browser UI

When offline, the app shell and previously loaded stories remain accessible. New stories created offline are queued and automatically synced to the API once the connection is restored.

---

## Push Notifications

- Click the **notification toggle** in the app to subscribe or unsubscribe
- Notifications are triggered server-side when a new story is added
- Each notification includes a title, icon, message, and a direct link to the story detail page

---

## Deployment

The project is deployed on Netlify. To deploy your own fork:

1. Push to your GitHub repository
2. Connect the repo to [Netlify](https://www.netlify.com/)
3. Set build command: `npm run build`
4. Set publish directory: `dist`