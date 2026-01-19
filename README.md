# reWrite

> Offline-first note-taking and drawing web application with real-time collaboration

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![Convex](https://img.shields.io/badge/Convex-Backend-orange.svg)](https://convex.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/tomiwa-a/re-write)

## Overview

reWrite combines rich note-taking with a free-draw canvas similar to draw.io. Work seamlessly offline, share with friends via links, and optionally sync across devices with authentication.

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

## Development Roadmap

### Phase 1: MVP

- [ ] Project setup with Vite + TypeScript
- [ ] Basic note editor with Tiptap
- [ ] Free-draw canvas with basic shapes and tools
- [ ] IndexedDB storage implementation
- [ ] CRUD operations for notes and drawings
- [ ] Export/Import as JSON files
- [ ] Responsive UI design

### Phase 2: Sharing & Collaboration

- [ ] Convex backend integration
- [ ] User authentication (optional)
- [ ] Generate shareable read-only links
- [ ] Upload snapshots for sharing
- [ ] Multi-device sync for logged-in users
- [ ] Conflict resolution strategy

### Phase 3: Real-Time Collaboration

- [ ] Real-time collaborative editing
- [ ] Operational transforms for conflict-free updates
- [ ] Presence indicators
- [ ] Cursor tracking for collaborators
- [ ] Live canvas updates

### Phase 4: Advanced Features

- [ ] Version history and rollback
- [ ] Templates for notes and diagrams
- [ ] Advanced canvas tools (connectors, smart shapes)
- [ ] Search and tagging system
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Export to PDF/SVG/PNG

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
