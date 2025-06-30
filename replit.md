# JobConnect East Africa - Full Stack Application

## Overview

JobConnect East Africa is a full-stack web application that aggregates and displays humanitarian job opportunities specifically for Kenya and Somalia. The application fetches job listings from multiple sources (ReliefWeb and UN Jobs) and provides a clean, searchable interface for users to find relevant employment opportunities in the humanitarian sector.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management

## Key Components

### Backend Architecture

**Express Server (`server/index.ts`)**
- Main application server with middleware for JSON parsing, URL encoding, and request logging
- Custom error handling middleware
- Development-specific Vite integration for hot reloading

**API Routes (`server/routes.ts`)**
- RESTful API endpoints for job management
- Job filtering and search functionality with Zod validation
- Statistics generation for dashboard metrics
- Automatic job scheduler integration

**Data Layer (`server/storage.ts`)**
- Abstract storage interface (`IStorage`) for database operations
- In-memory storage implementation (`MemStorage`) for development/testing
- Methods for CRUD operations on jobs and users
- Advanced filtering and search capabilities

**Job Fetching Service (`server/services/jobFetcher.ts`)**
- Automated job scraping from ReliefWeb API
- Scheduled job updates using cron jobs
- Data normalization and deduplication
- Country-specific filtering (Kenya and Somalia)

### Frontend Architecture

**React Application (`client/src/App.tsx`)**
- Single-page application using Wouter for routing
- Global providers for queries, tooltips, and toast notifications
- Clean component hierarchy with proper state management

**UI Components**
- `Header`: Navigation and branding
- `SearchBar`: Real-time job search with debouncing
- `JobCard`: Individual job listing display with rich metadata
- `Sidebar`: Advanced filtering interface
- `Footer`: Site information and links

**State Management**
- TanStack Query for server state with custom query client
- Local state for UI interactions and filters
- Optimistic updates and error handling

### Database Schema

**Jobs Table (`shared/schema.ts`)**
- Comprehensive job information including title, organization, location
- External source tracking and deduplication via `externalId`
- Timestamp fields for posting and deadline dates
- Sector categorization for filtering

**Users Table**
- Basic user authentication schema (prepared for future use)
- Username/password structure with validation

## Data Flow

1. **Job Ingestion**: Automated fetchers pull job data from external APIs
2. **Data Processing**: Jobs are normalized, deduplicated, and stored in PostgreSQL
3. **API Layer**: Express routes serve filtered and searched job data
4. **Frontend Rendering**: React components consume API data via TanStack Query
5. **User Interaction**: Real-time search and filtering with immediate UI updates

## External Dependencies

**Core Framework Dependencies**
- React 18 with TypeScript for type-safe frontend development
- Express.js for robust backend API development
- Drizzle ORM with PostgreSQL for type-safe database operations

**UI/UX Libraries**
- Tailwind CSS for utility-first styling
- shadcn/ui component library built on Radix UI primitives
- Lucide React for consistent iconography

**Data Fetching & Validation**
- TanStack Query for intelligent server state management
- Zod for runtime type validation and schema definition
- Date-fns for date manipulation and formatting

**External APIs**
- ReliefWeb API for humanitarian job listings
- UN Jobs RSS feed for United Nations opportunities

## Deployment Strategy

**Development Environment**
- Vite dev server with hot module replacement
- Express server with nodemon for auto-restart
- TypeScript compilation with strict type checking

**Production Build**
- Vite builds optimized static assets to `dist/public`
- esbuild bundles server code for Node.js deployment
- Environment variable configuration for database connections

**Database Management**
- Drizzle Kit for schema migrations and database push operations
- PostgreSQL connection via DATABASE_URL environment variable
- Neon Database serverless PostgreSQL for cloud deployment

## Changelog

- June 30, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.