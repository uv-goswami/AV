# AV: AI-Driven SEO & Optimization for AI Visibility

**Live Deployment (AWS):** [aivault-frontend-portfolio.s3-website.ap-south-1.amazonaws.com](http://aivault-frontend-portfolio.s3-website.ap-south-1.amazonaws.com/)
**Live Deployment (Render):** [https://aivault-frontend.onrender.com](https://www.google.com/search?q=https://aivault-frontend.onrender.com)

In the current digital landscape, being discoverable by humans is only half the battle. Modern search is increasingly dominated by AI agents, LLMs, and automated crawlers. AiVault is a full-stack engineering solution designed to bridge this gap. It enables local businesses to manage their digital identity in a way that is natively "readable" by both AI bots and human customers, utilizing automated structured data generation and deep visibility auditing.

## Tech Stack

* **Frontend:** React.js (v18), Vite, React Router DOM (v6), CSS3 (Custom Modules)
* **Backend:** Python 3.10+, FastAPI (Asynchronous framework)
* **AI Engine:** Google Gemini API (Vertex AI / Generative AI integration)
* **Database:** SQLite (SQLAlchemy ORM for modular scaling)
* **Infrastructure:** AWS (S3 for Frontend, EC2 for Backend), Docker, Nginx, Render

## Key Features & Technical Highlights

* **Automated JSON-LD Generation:** Implemented a backend pipeline that synthesizes business metadata (hours, services, coordinates) into Schema.org compliant JSON-LD. This allows for rich snippets in Google Search and structured context for AI agents.
* **Asynchronous AI Auditing:** Integrated Gemini AI to perform real-time visibility audits. The system evaluates business profiles from two distinct perspectives: "Bot Accessibility" (machine readability) and "Human Intent" (customer clarity).
* **High-Performance Caching Strategy:** Engineered a custom Client-Side Cache system using a `Map`-based implementation. This achieves "0ms perceived latency" by serving stale data while revalidating fresh data in the background (SWR pattern).
* **SEO-First Public Directory:** Developed a public marketplace utilizing Semantic HTML and Schema.org Microdata. This ensures the directory itself is highly rankable and crawlable by automated scripts.
* **Multipart Media Management:** Built a robust media handling system supporting images, videos, and documents with client-side file-type detection and size validation before server-side processing.

## Project Structure

```text
/
├── frontend/                # React/Vite Application
│   ├── src/
│   │   ├── api/             # Client-side cache logic & API wrappers
│   │   ├── components/      # Reusable UI (StatCards, Sidebars, Modals)
│   │   ├── context/         # AuthContext for global session management
│   │   ├── pages/           # Routed views (Dashboard, Public Directory)
│   │   └── styles/          # Modular CSS architecture
│   ├── index.html           # Optimized with Skeleton Screen & SEO Meta
│   ├── Dockerfile           # Multi-stage production build
│   └── nginx.conf           # SPA routing & compression config
├── backend/                 # FastAPI Application
│   ├── app/
│   │   ├── models/          # SQLAlchemy schemas
│   │   ├── routes/          # API endpoints (AI, Business, Media)
│   │   └── services/        # Business logic & AI orchestration
│   ├── db/                  # SQLite persistent storage
│   ├── uploads/             # Static asset storage
│   └── main.py              # Application entry point
└── .gitignore               # Root-level exclusion rules

```

## Technical Aspects

### 1. The "Instant-Load" Architecture

To differentiate this project from standard CRUD apps, I implemented a custom cache-aside pattern. When a user navigates to the dashboard, the application immediately checks the memory cache (`getFromCache`). If data exists, the UI renders instantly. Simultaneously, a background fetch updates the cache and the UI once the server responds. This eliminates the "spinning loader" frustration commonly found in SPAs.

### 2. AI Data Orchestration

The "Visibility Audit" isn't just a text summary. The backend prompts Gemini to return structured analysis separated by delimiters. The frontend then parses this string using specialized utility functions to populate semantic UI components, such as the "Critical Issues" alert box and the "Perspective Grid."

### 3. Production Readiness

The project is containerized using Multi-Stage Docker builds. The frontend stage builds the assets using Node.js, and the production stage serves them through an Nginx server configured to handle SPA routing. This ensures that deep-links (e.g., `/dashboard/services`) work correctly without returning 404s from the server.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/auth/login` | Authenticates user and returns business context. |
| **GET** | `/business/directory-view` | Optimized aggregate fetch for public listings. |
| **POST** | `/visibility/run` | Triggers asynchronous AI audit of the profile. |
| **POST** | `/jsonld/generate` | Synthesizes Schema.org feed from stored data. |
| **POST** | `/media/upload` | Handles multipart/form-data for asset storage. |

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/uv-goswami/AV.git
cd AV

```

### 2. Backend Setup

** Set Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

```
pip install -r requirements.txt
# Configure .env with your GEMINI_API_KEY
uvicorn main:app --reload

```

### 3. Frontend Setup

```bash
cd frontend
npm install
# Configure .env with VITE_API_BASE=http://localhost:8000
npm run dev

```

## Skills Demonstrated

* **Software Design Patterns:** Implemented Singleton patterns for API clients and Provider patterns for global state management.
* **Performance Engineering:** Mastery of React lifecycle hooks (`useEffect`, `useMemo`) to prevent unnecessary re-renders and optimize network throughput.
* **AI Integration:** Practical application of Large Language Models (LLMs) to provide actionable business intelligence rather than just generic chat.
* **DevOps & Deployment:** Deploying complex architectures across AWS S3 and EC2, managing CORS, and configuring Nginx reverse proxies.

---

*This project was developed as an  implementation of AI-integrated web systems, focusing on the real-world intersection of SEO, machine readability, and performant user interfaces.*