# Cellulose

> Offline-first note-taking and drawing web application with real-time collaboration

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![Convex](https://img.shields.io/badge/Convex-Backend-orange.svg)](https://convex.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/tomiwa-a/re-write)

## Features

- **Offline-First**: Built with Dexie.js for robust local-first storage.
- **Real-time Collaboration**: Sync and collaborate across devices powered by Convex.
- **Rich Text & Canvas**: Seamlessly switch between markdown-style notes and infinite whiteboard.

## Overview

Cellulose combines rich note-taking with a free-draw canvas similar to draw.io. Work seamlessly offline, share with friends via links, and optionally sync across devices with authentication.

**Key Features:**

- Rich note-taking with powerful editor
- Free-draw canvas with sketching and diagramming tools
- Full offline functionality
- Shareable links for viewing or collaboration
- Local storage using IndexedDB
- Optional sync across devices
- Real-time collaboration
- No forced login required

## Tech Stack

**Frontend:**

- Vanilla TypeScript + Vite
- Fabric.js / Excalidraw (canvas)
- Tiptap (rich text editor)
- IndexedDB via Dexie.js
- CSS Modules

**Backend:**

- Convex (Backend-as-a-Service)
- Real-time sync, authentication, caching
- TypeScript serverless functions

## Getting Started

```bash
git clone https://github.com/yourusername/rewrite.git
cd rewrite
npm install
npm run dev
```

## Contributing

Contributions are welcome. This is an open-source project built for fun and learning.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

## Authors

**Amole Oluwatomiwa**

- Twitter: [@tomiwa_amole](https://x.com/tomiwa_amole)
- LinkedIn: [Amole Oluwatomiwa](https://www.linkedin.com/in/amole-oluwatomiwa-5a083b167/)

**Amole Oluwaseun**

- Twitter: [Twitter](https://x.com/)
- LinkedIn: [LinkedIn](https://linkedin.com/)

---

Built with TypeScript, Vite, and Convex
