# Somken Jobs - Full Stack Application

## Overview

Somken Jobs is a full-stack web application that aggregates and displays humanitarian job opportunities specifically for Kenya and Somalia. The application fetches job listings from multiple sources (ReliefWeb and UN Jobs) and provides a clean, searchable interface for users to find relevant employment opportunities in the humanitarian sector.

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
- PostgreSQL database implementation (`DatabaseStorage`) using Drizzle ORM
- In-memory storage implementation (`MemStorage`) for fallback/testing
- Methods for CRUD operations on jobs and users
- Advanced filtering and search capabilities with SQL optimization

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
- PostgreSQL database with Drizzle ORM for type-safe operations
- Drizzle Kit for schema migrations and database push operations
- Database connection via DATABASE_URL environment variable
- Automatic database seeding with sample humanitarian jobs
- Full CRUD operations with optimized SQL queries

## Changelog

- June 30, 2025: Initial setup with complete job board functionality
- June 30, 2025: Added PostgreSQL database with Drizzle ORM integration
- June 30, 2025: Implemented database seeding with sample humanitarian jobs
- June 30, 2025: Fixed mobile responsive layout for job card metadata
- June 30, 2025: Enhanced job data fetching to include comprehensive ReliefWeb information
- June 30, 2025: Fixed HTML encoding issues in application instructions and email addresses
- June 30, 2025: Improved text formatting to convert asterisks to proper bold formatting
- June 30, 2025: Fixed back navigation button functionality using proper routing
- June 30, 2025: Disabled UN Jobs fetching to ensure only comprehensive ReliefWeb jobs with complete details are displayed
- June 30, 2025: Added comprehensive escape sequence cleaning to remove all backslashes and escaped characters from job text
- June 30, 2025: Removed demo warning banner since real comprehensive job data is now displayed
- June 30, 2025: Fixed organization names to display actual organizations from ReliefWeb API (International Labour Organization, Agency for Technical Cooperation and Development, etc.) with "ReliefWeb Organization" fallback only when source data is missing
- June 30, 2025: Optimized ReliefWeb integration with enhanced data fields, better organization name extraction using longname/name priority, improved sector categorization, and robust error handling
- June 30, 2025: Added "Show More" functionality for job descriptions to display full untrimmed content from ReliefWeb API, storing both truncated preview (800 chars) and complete HTML description (15,000+ chars) with expandable interface
- June 30, 2025: Optimized responsive design for all devices with mobile-first CSS, preventing text overflow in job cards, improved organization name truncation, responsive typography scaling, and enhanced container layouts for tablets and phones
- June 30, 2025: Fixed navigation scroll behavior to automatically scroll to top when viewing job details or returning to home page, ensuring users always see the beginning of content after navigation
- June 30, 2025: Improved job listings header layout by separating title from controls, placing "Latest Job Opportunities" on its own line with sorting and view controls positioned below for better visual hierarchy and mobile responsiveness
- July 1, 2025: Enhanced job card typography for mobile readability by increasing font sizes from text-sm to text-base for metadata, enlarging icons from h-4 to h-5, and upgrading badge text sizes for better accessibility
- July 1, 2025: Removed organization name truncation to allow full organization names to display across multiple lines with natural word wrapping and improved line height for better readability
- July 1, 2025: Added related jobs section below Important Dates card with smart matching algorithm based on sector, organization, and location relevance scoring
- July 1, 2025: Reorganized desktop layout with dedicated left sidebar for filters, improved sticky positioning, enhanced visual separation with primary accent border, and optimized responsive ordering
- July 1, 2025: Standardized deadline format to always display "X days left" instead of mixing weeks and days for consistent user experience
- July 1, 2025: Fixed mobile filter positioning to display at the top instead of bottom for better user experience
- July 1, 2025: Fixed mobile menu functionality with proper click handlers, navigation routing, and accessibility improvements including SheetTitle and SheetDescription
- July 1, 2025: Created comprehensive About, Contact, and Organizations pages with full navigation integration, replacing placeholder menu items with functional pages containing relevant humanitarian sector information
- July 1, 2025: Implemented comprehensive SEO optimization including meta tags, Open Graph, Twitter Cards, structured data, canonical URLs, robots.txt, sitemap.xml, and dynamic page-specific SEO content for better search engine visibility
- July 1, 2025: Fixed critical filtering system bug by resolving query parameter serialization between frontend and backend, implemented proper URL parameter handling for array filters, and enhanced Zod validation to handle Express.js query parameter inconsistencies where single values are strings and multiple values are arrays
- July 1, 2025: Optimized ReliefWeb API usage by reducing daily job fetch limit from 50 Kenya jobs and 18 Somalia jobs to 10 jobs per country to minimize API load while maintaining fresh job availability
- July 1, 2025: Enhanced job fetching schedule from once daily at 6 AM to twice daily at 8 AM and 7 PM for more frequent job updates and better coverage of new postings throughout the day
- July 1, 2025: Updated UI design to remove gradient background and apply solid LinkedIn blue (#0077B5) to hero section and search button for more professional, consistent branding
- July 1, 2025: Enhanced location display to show city and country when possible (e.g. "Nairobi, Kenya" instead of just "Kenya") by intelligently parsing job titles and descriptions for major cities in Kenya and Somalia
- July 1, 2025: Implemented complete user authentication system for employers/recruiters with admin approval workflow, including JWT-based authentication, login/registration forms integrated into dropdown menu, protected routes, and default admin account (admin@jobconnect.com / admin123)
- July 1, 2025: Created comprehensive dashboard system with role-based access - recruiters can create and post new job listings while super admins can both create jobs and approve pending user registrations, featuring full CRUD operations, form validation, and proper navigation with back button functionality
- July 1, 2025: Fixed authentication token handling in dashboard API calls, resolving "Invalid token" errors for user approval functionality - dashboard now successfully authenticates with backend using correct 'auth_token' key from localStorage
- July 1, 2025: Enhanced job posting form to match ReliefWeb format with hierarchical country → city selection, ReliefWeb-style experience levels (0-2 years, 3-5 years, etc.), comprehensive field sections, and organization auto-population for recruiters
- July 1, 2025: Enhanced "How to Apply" section with automatic URL detection and clickable link formatting - URLs are now properly converted to clickable blue links that open in new tabs, with safeguards against nested link creation and proper email address preservation
- July 2, 2025: Applied comprehensive desktop layout optimizations with better content width constraints (max-w-5xl container, max-w-4xl job listings area, increased horizontal padding, job card max-width constraints of 800-850px on large screens) to prevent over-stretching while maintaining full mobile responsiveness
- July 2, 2025: Completed comprehensive analysis and preliminary integration framework for Zyte.com API - created complete job extraction service architecture, integrated with existing scheduler, documented major Kenyan (BrighterMonday, Jobs.co.ke) and Somali (Jobs.so) job board targets, established cost-benefit analysis showing potential 10x job inventory increase, and prepared production-ready implementation guide requiring only API credentials to activate
- July 3, 2025: Enhanced PDF invoice table with professional borders, centered layout, improved vertical alignment with increased row height (14px), better column separators, and increased font sizes for enhanced readability
- July 3, 2025: Implemented comprehensive job status workflow with draft/published states - added status field to database schema, created status selector in job creation form with "Save as Draft" and "Publish Job" options, implemented conditional deletion (only draft jobs can be deleted), added status badges to job listings showing "Live" for published and "Draft" for unpublished jobs, and enhanced UI to only show checkboxes for draft jobs
- July 3, 2025: Redesigned invoice template to match professional reference design - restructured layout with clean header section, large gray "INVOICE" title, two-column invoice details, professional table with alternating row colors and proper borders, clean payment information section, and italic note footer while maintaining company branding
- July 3, 2025: Enhanced invoice template with professional formatting - added horizontal line separator below header section, implemented complete table borders with column and row separators, improved column positioning using percentage-based widths to ensure all content fits within table boundaries, and maintained consistent border styling throughout
- July 3, 2025: Redesigned invoice signature section to match professional standards - removed company seal, replaced with clean "DIGITALLY SIGNED & AUTHENTICATED" header in LinkedIn blue, added compact document ID/digital signature/timestamp details, positioned footer at page bottom, and updated receiver to display organization name instead of individual name for business-appropriate formatting

## User Preferences

Preferred communication style: Simple, everyday language.