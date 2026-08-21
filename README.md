# CanvaX AI

CanvaX AI is a cutting-edge, AI-powered visual design platform that merges the capabilities of Figma, Canva, Miro, and advanced AI into a single infinite canvas. It is designed to provide a cohesive, professional workspace for teams and individuals to brainstorm, design, and collaborate in real-time.

## 🚀 Key Features

### 🧠 AI-Powered Capabilities
- **AI Diagram Generation**: Generate complex flowcharts, diagrams, and UI wireframes directly on the canvas using natural language prompts powered by Google Gemini and LangChain.
- **Mermaid JS Integration**: Import, edit, and visualize Mermaid diagrams natively within the whiteboard environment.
- **Smart Formatting**: AI-driven formatting, template insertion, and auto-layout assistance.

### 🎨 Design & Whiteboarding
- **Infinite Whiteboard**: Seamless panning, zooming, and navigation for unrestricted creativity.
- **Professional Toolset**: Intuitive interaction model with stroke-only eraser hit detection, precise shape drawing, text editing, and dynamic dimension measurement tools.
- **Advanced Layer Management**: Z-index based object layering, grouping, and comprehensive clipboard management (Copy/Paste/Duplicate).
- **Export & Presentation**: High-fidelity file export (PNG/SVG) and a dedicated distraction-free Presentation Mode.

### 🤝 Real-Time Collaboration & Security
- **Multiplayer Cursors**: Live, low-latency cursor tracking and real-time canvas state synchronization.
- **Role-Based Access Control (RBAC)**: Secure canvas sharing with precise Admin, Editor, and Viewer permissions.
- **Secure Authentication**: Seamless login and user management via Google and GitHub OAuth integrations.

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4, Framer Motion for micro-animations
- **Canvas Engine**: Konva.js (React-Konva)
- **State Management**: Redux Toolkit & Zustand
- **Data Fetching**: React Query

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: LangChain & Google Gemini AI API
- **Authentication**: Passport (Google & GitHub Strategies), JWT
- **Real-Time Engine**: WebSockets via Socket.IO, Redis (Session/State management)

## 🏁 Getting Started

### Backend Setup
1. `cd Backend`
2. Create a `.env` file based on `.env.example` and set your PostgreSQL, OAuth (Google/GitHub), and Gemini API credentials.
3. Install dependencies: `npm install`
4. Apply database migrations: `npx prisma migrate dev`
5. Start development server: `npm run start:dev`

### Frontend Setup
1. `cd Frontend`
2. Create a `.env` file and set the required environment variables (e.g., API base URL).
3. Install dependencies: `npm install`
4. Start the frontend client: `npm run dev`
