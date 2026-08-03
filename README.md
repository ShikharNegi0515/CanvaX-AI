# CanvasX AI

CanvasX AI is an all-in-one AI-powered visual design platform combining the capabilities of Figma, Canva, Miro, and advanced AI into a single infinite canvas.

## Features (In Progress)
- **Design Studio** (Canva-like graphic design)
- **Infinite Whiteboard** (Miro/Excalidraw alternative)
- **UI/UX Designer** (Figma-like interface design)
- **Drawing Studio** (Digital art & illustration)
- **AI Integration** (Image generation, automated layouts, diagram generation)

## Tech Stack
### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Konva.js (Canvas)
- Framer Motion
- Redux Toolkit & Zustand
- React Query

### Backend
- NestJS (TypeScript)
- PostgreSQL
- Prisma ORM
- Redis (Planned for WebSockets)
- Socket.IO (Planned for Collaboration)

## Getting Started

### Backend Setup
1. `cd Backend`
2. Create a `.env` file based on `.env.example` or set your postgres credentials.
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run start:dev`

### Frontend Setup
1. `cd Frontend`
2. `npm install`
3. `npm run dev`
