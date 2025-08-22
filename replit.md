# Somken Jobs - Full Stack Application

## Overview

Somken Jobs is a full-stack web application designed to aggregate and display humanitarian job opportunities specifically for Kenya and Somalia, with recent expansion to include Ethiopia, Uganda, and Tanzania. It provides a clean, searchable interface for users to find relevant employment in the humanitarian sector by fetching listings from multiple sources (primarily ReliefWeb) and presenting them effectively. The project aims to be the leading platform for humanitarian job discovery in East Africa.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application employs a modern full-stack architecture, ensuring clear separation of concerns.

**Frontend:**
-   **Technology:** React with TypeScript, utilizing Vite for building.
-   **Styling:** Tailwind CSS with shadcn/ui for components and Lucide React for iconography.
-   **State Management:** TanStack Query for server state, complemented by local state for UI interactions.
-   **Routing:** Wouter is used for client-side routing.
-   **UI/UX:** Focuses on clean, intuitive design with a professional LinkedIn blue color scheme for branding. Features include advanced filtering, real-time search, responsive design for all devices, and interactive components like collapsible filter sections and rich text editors.
-   **SEO:** Comprehensive SEO optimization including dynamic sitemaps, robots.txt, meta tags, enhanced Open Graph and Twitter Card implementations with job-specific data (employer, location, deadline, sector), JSON-LD structured data (especially for JobPosting schema), canonical URLs, and server-side rendering for optimal search engine and social media compatibility. Rich social media previews display job title, organization, location, application deadline, and job category when shared on LinkedIn, Facebook, WhatsApp, or Twitter.

**Backend:**
-   **Technology:** Express.js with TypeScript running on Node.js.
-   **Database:** PostgreSQL with Drizzle ORM for type-safe operations.
-   **API:** RESTful API endpoints for job management, filtering, search, and statistics, with Zod validation.
-   **Data Layer:** Abstract storage interface with PostgreSQL and in-memory implementations.
-   **Job Fetching:** Automated job scraping from ReliefWeb API, scheduled twice daily via cron jobs, with data normalization and deduplication.
-   **Authentication:** JWT-based user authentication system for employers/recruiters with admin approval workflow.
-   **Dashboard:** Role-based access (recruiters, super admins) with CRUD operations for job postings, user management, and invoice generation.
-   **Rich Text Editing:** Custom HTML5-based rich text editor with full formatting, table, and image manipulation capabilities, including robust cleaning for pasted content from external sources (e.g., Microsoft Office).
-   **URL Structure:** SEO-friendly URL slug system for job details pages.

**Data Flow:**
1.  **Ingestion:** Automated fetchers pull data from external APIs.
2.  **Processing:** Data is normalized, deduplicated, and stored in PostgreSQL.
3.  **API:** Express routes serve filtered and searched job data.
4.  **Frontend:** React components consume API data via TanStack Query for rendering.
5.  **Interaction:** Real-time search and filtering provide immediate UI updates.

## External Dependencies

*   **Core Frameworks:** React 18, Express.js, Drizzle ORM, Node.js.
*   **UI/UX Libraries:** Tailwind CSS, shadcn/ui, Lucide React, Radix UI.
*   **Data Handling & Validation:** TanStack Query, Zod, date-fns.
*   **External APIs:** ReliefWeb API (primary source for humanitarian job listings).
*   **Database:** PostgreSQL.
*   **Build Tools:** Vite (frontend), esbuild (backend).
*   **Runtime Utilities:** Wouter (routing), cron (job scheduling), nodemon (development server).
*   **Authentication:** JSON Web Tokens (JWT).
*   **Content Editing:** React Quill (initially, now custom SimpleRichTextEditor).