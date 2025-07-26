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
- July 3, 2025: Simplified invoice creation process - removed title field since invoice numbers are auto-generated, streamlined form to only require price per job and job selection, auto-generates "Job Posting Services" as default title, and automatically extracts organization names from selected jobs for professional receiver formatting
- July 3, 2025: Simplified invoice number format from complex timestamp-based format (INV-1751514022706-1CNM1) to clean professional format (INV-2567845) using last 2 digits of year plus 5-digit random number for better readability and professionalism
- July 3, 2025: Enhanced invoice UI design - removed square button borders around download, edit, and delete icons for cleaner minimalist appearance, changed edit icon from generic edit to simple pen icon, increased icon sizes to h-5 w-5 for better visibility, and added smooth color transitions on hover
- July 3, 2025: Created comprehensive Career Resources page with high-quality content including detailed CV writing guide with humanitarian sector best practices, interview preparation strategies with behavioral and technical questions, cover letter excellence framework, career development pathways and networking strategies, professional certifications guide, and additional learning resources - fully integrated with navigation and footer links
- July 3, 2025: Optimized Career Resources page for SEO with comprehensive meta tags (title, description, keywords), Open Graph tags for social media sharing, Twitter Cards, JSON-LD structured data for search engines, canonical URLs, and targeted keywords for humanitarian careers, CV writing, and professional development to improve search engine visibility
- July 3, 2025: Created comprehensive Support section with dedicated Help Center, Privacy Policy, and Terms of Service pages - added FAQ section with common questions, contact information, support hours, detailed privacy protection policies, legal terms and conditions, and full integration with footer navigation for complete user support experience
- July 3, 2025: Enhanced Super Admin dashboard with comprehensive management capabilities - implemented two-row tab layout to prevent overlap (main functions in first row, admin functions in second row), added user approval/rejection workflow with reject button functionality, prepared backend infrastructure for All Jobs and All Users management with proper authentication and role-based access control
- July 3, 2025: Improved Super Admin dashboard layout with clean two-row tab organization to resolve tab overlap issues - first row contains main user functions (My Jobs, Create Job, Invoices, Profile) while second row houses admin-specific functions (User Approvals, All Jobs, All Users), enhanced user experience with proper visual separation and professional LinkedIn blue color scheme
- July 3, 2025: Redesigned job details page with comprehensive left sidebar for enhanced desktop presentation - added sticky sidebar containing job details, related jobs, how to apply instructions, and apply button, reorganized main content area for better readability, maintained full mobile responsiveness with mobile-specific sections, ensured consistent layout with home page design for professional user experience
- July 3, 2025: Removed Zyte API integration completely and streamlined job fetching to use only ReliefWeb as the reliable humanitarian job source - eliminated problematic web scraping that was capturing navigation elements instead of real job listings, simplified codebase by removing all Zyte-related files and dependencies, focused system on ReliefWeb's comprehensive humanitarian job coverage for both Kenya and Somalia with clean 20 jobs total per scheduled fetch
- July 3, 2025: Enhanced sidebar user experience by removing main scrollbar and increasing height utilization - changed from max-height with overflow-y auto to fixed height with overflow-y visible, increased available vertical space from 8rem to 5rem margin, maintained internal scrolling for Organization and Sector lists, improved professional appearance with cleaner desktop layout
- July 3, 2025: Fixed text formatting issues in "How to Apply" section by cleaning up excessive asterisks and implementing proper email highlighting - enhanced text cleaning function to handle multiple asterisks (*** -> **), convert markdown formatting to HTML (** -> bold, * -> italic), properly highlight email addresses with blue styling and mailto links, improved overall readability of application instructions
- July 4, 2025: Enhanced invoice creation system to prevent duplicate billing of jobs - implemented getBilledJobIds() method to track previously invoiced jobs, created new API endpoint /api/user/jobs/available-for-billing that excludes already billed jobs from selection, updated frontend invoice form to use filtered job list, added proper cache invalidation when invoices are created/updated/deleted, ensures each job can only be billed once preventing duplicate charges
- July 4, 2025: Updated job creation form field labels to be generic for both jobs and tenders - changed "Job Title" to "Title", "Job Description" to "Description", and "Create New Job Posting" to "Create New Posting" since form is shared between job opportunities and tender postings, maintains proper type badges on cards to distinguish between jobs and tenders
- July 4, 2025: Enhanced attachment functionality for both jobs and tenders - made attachment field available for all posting types (not just tenders), changed to optional field, added attachment display section below "How to Apply" section in job details page with download button, included attachment section in sidebar with compact design, maintains professional styling with LinkedIn blue color scheme
- July 4, 2025: Repositioned attachment field in form layout - moved attachment upload field to appear below "How to Apply" field instead of next to the Type selector for better logical flow and improved user experience
- July 4, 2025: Added small icons to label jobs and tenders throughout application - implemented briefcase icon for jobs (blue) and document icon for tenders (orange) in job cards, related jobs sections, and mobile layouts for better visual distinction and user experience
- July 5, 2025: Implemented social media sharing functionality on job details page - added Facebook, WhatsApp, Twitter, and LinkedIn share buttons at bottom of job detail card with custom hover effects and proper URL encoding for sharing job opportunities across social platforms
- July 5, 2025: Enhanced user registration approval workflow - improved login error handling to show clear messages for pending approval status, fixed TypeScript issues in user creation, and streamlined the approval process where users register and wait for super admin approval before gaining access to dashboard features
- July 5, 2025: Implemented comprehensive loading animation and success message system - added LoadingButton component with circular loading spinner, created toast utility functions with green success, red error, and orange warning styles, updated all form submissions throughout application (login, registration, job creation, user approval, profile updates, invoice management) to show loading states during processing and success/error messages with auto-hide functionality
- July 6, 2025: Fixed logout functionality to properly redirect users to home page - resolved issue where users logging out from dashboard would remain on dashboard with 404 error, now logout properly redirects to main home page using window.location.href for reliable navigation
- July 6, 2025: Implemented loading animation and success message system for logout - added circular loading spinner during logout process, shows "Logging out..." text with animated spinner in both desktop dropdown and mobile menu, displays green success toast notification before redirecting to home page, enhanced user experience with visual feedback during logout process
- July 6, 2025: Fixed remaining logout redirect error - corrected stray redirect to non-existent `/api/login` endpoint in dashboard unauthorized handler to properly redirect to home page `/`, ensuring all logout scenarios now work without 404 errors
- July 7, 2025: Enhanced job fetching diagnostics and confirmed ReliefWeb API functionality - added comprehensive logging to track job deduplication, verified that ReliefWeb API is working correctly but no new humanitarian jobs have been posted for Kenya/Somalia since July 4th, job fetching system continues to run twice daily and will automatically capture new jobs when they become available on ReliefWeb
- July 9, 2025: Implemented organization autocomplete feature for job creation form - created custom dropdown component that fetches existing organizations from database, allows typing and searching through organization names, provides "Add new organization" option for custom entries, includes proper authentication and API integration, enhances user experience by preventing duplicate organization entries and maintaining consistency across job postings
- July 10, 2025: Added complete autocomplete functionality for country, location/city, and sector fields in job creation form - created database tables with seeded data for countries, cities, and sectors, built reusable autocomplete components with search and add-new capabilities, integrated API endpoints with proper authentication, automatic database storage for new entries during job creation, enhanced user experience with consistent pattern across all location and categorization fields
- July 10, 2025: Implemented comprehensive rich text editor for job posting fields - integrated React Quill editor with full formatting capabilities including bold, italic, underline, numbered lists, bullet points, text alignment, colors, and headers, supports paste formatting preservation from external sources, applied to Description, Key Responsibilities, Qualifications & Requirements, and How to Apply fields, enhanced user experience with professional formatting tools for better job posting presentation
- July 11, 2025: Added custom posting date functionality for job creation - implemented calendar picker field allowing users to backdate job postings while defaulting to current date, updated form validation to include posting date as required field, reorganized form layout into 3-column grid with posting date, deadline, and external URL fields, enhanced job submission process to use custom posting date instead of current timestamp, maintained database schema compatibility
- July 11, 2025: Optimized rich text editor mobile spacing and layout - enhanced mobile responsiveness with proper spacing between editor sections using visual separators and padding, improved form layout with space-y-8 spacing, added mobile-specific CSS with 3rem margins and 16px font size to prevent iOS zoom, implemented border separators between rich text editor sections for clear visual distinction, resolved mobile layout issues where editors appeared merged together
- July 11, 2025: Completely removed "Key Responsibilities" field from job creation form - removed rich text editor field from UI, updated all form state initializations, modified job submission handler to exclude responsibilities data, removed field from bodyHtml generation, and updated job editing functionality for streamlined form with only essential fields (Description, Qualifications & Requirements, How to Apply)
- July 11, 2025: Implemented comprehensive SEO optimization to improve Google search rankings for "jobs in Somalia" queries - updated HTML meta tags with targeted keywords, enhanced Open Graph and Twitter Cards with geographic targeting, added Schema.org structured data for website and job postings, created JobStructuredData component for Google for Jobs integration, updated page titles and descriptions with location-specific keywords, added SEO-focused content sections highlighting Somalia and Kenya job opportunities, created sitemap.xml and robots.txt files for search engine crawling, implemented job-specific SEO on detail pages with canonical URLs and targeted meta descriptions
- July 12, 2025: Added dynamic Open Graph and Twitter Card meta tags for individual job pages - implemented auto-updating social media preview tags that display job title, organization, location, and deadline information when shared on Facebook, WhatsApp, LinkedIn, and Twitter, created dynamic SVG image generation system for job-specific social media previews, enhanced SEOHead component with comprehensive meta tag management including image dimensions and alt text, implemented job-specific utility functions for consistent social media formatting across platforms
- July 12, 2025: Implemented server-side rendering for job pages to ensure social media crawlers read correct meta tags - created dedicated Express route `/jobs/:id` that serves HTML with job-specific meta tags pre-injected before JavaScript execution, enabling proper social media previews on WhatsApp, Facebook, LinkedIn, and Twitter showing actual job titles, organizations, locations, and deadlines instead of generic site information, completely resolved social media crawler compatibility issues by serving static HTML with dynamic content for better sharing experience
- July 12, 2025: Fixed social media preview issue by removing image meta tags that were causing long random strings to appear in WhatsApp and other social media previews - eliminated og:image and twitter:image meta tags from server-side rendering to ensure clean, professional social media previews showing only job title, organization, location, and deadline information without any unwanted technical strings or development server URLs
- July 12, 2025: Completely resolved random string issue in social media previews across all platforms (Facebook, WhatsApp, LinkedIn, Twitter) by removing generateJobOGImageUrl function calls from frontend, updating SEOHead component to actively remove image meta tags, and ensuring clean text-only social media previews with format: "Job Title • Organization • Location, Country • Deadline: X days left • Apply now on Somken Jobs"
- July 12, 2025: Enhanced social media preview formatting with organized emoji layout (🎯 Job Title, 🏢 Organization, 📍 Location, ⏰ Deadline, 💼 Call to action) using line breaks for better readability and added cache-busting parameters to sharing URLs to force fresh previews and bypass platform caching
- July 12, 2025: Completely removed "Responsibilities" field from job details display and structured data after field was previously removed from job creation form, ensuring consistency between frontend display and form functionality
- July 12, 2025: Fixed posting date issue where dashboard-created jobs appeared lower in listings due to midnight timestamp - updated job creation logic to combine selected posting date with current time instead of defaulting to midnight, ensuring newly created jobs appear at top of chronologically sorted list
- July 12, 2025: Updated navigation header to show "Home" instead of "Jobs" for the landing page - changed navigation label to better reflect that the main page is the home/landing page rather than just a jobs page
- July 12, 2025: Added dedicated Jobs and Tenders pages with separate filtering sidebars - created /jobs route showing only job opportunities and /tenders route showing only tender opportunities, both with complete filtering functionality including organization, sector, country, and date filters, maintained responsive sidebar design with sticky positioning on desktop and mobile-friendly layout
- July 13, 2025: Removed Organizations page from navigation and routing - eliminated /organizations route from header navigation, footer links, and App.tsx routing since it was not needed, streamlined navigation to focus on core functionality (Home, Jobs, Tenders, About, Contact)
- July 13, 2025: Removed job source information display from job cards - eliminated source badges showing "ReliefWeb" or "UN Jobs" from job cards throughout the application including JobCard component, Jobs page, and Tenders page, cleaned up unused getSourceBadgeColor functions, simplified job card badges to show only type (Job/Tender), sector, and employment type
- July 17, 2025: Enhanced mobile filtering experience by implementing collapsible filter sections - added expandable dropdowns for Country, Organization, and Sector filters with selection summaries (e.g., "2 selected" or "All countries"), chevron icons for expand/collapse state, significantly reduced mobile filter space usage while maintaining full functionality, Date filter remains expanded as a compact dropdown
- July 17, 2025: Added experience level field to job details sidebar - conditionally displays experience level information from job creation form only when assigned by user, positioned between Sector and Source fields in left sidebar, uses consistent styling with other job detail fields
- July 17, 2025: Enhanced rich text editor with increased height and drag-to-resize functionality - increased default height from 150-200px to 300-350px for better content editing, added drag-to-resize capability with visual resize handle positioned at bottom border center, implemented min/max height constraints (200px-700px), improved user experience for Description, Qualifications & Requirements, and How to Apply fields with smoother resizing and better visual feedback
- July 17, 2025: Improved job creation workflow to default to draft status - changed default behavior to create jobs as drafts first, allowing users to review before publishing, main "Create Job" button saves as draft with secondary "Create & Publish Job" button for immediate publishing, users can view and publish jobs from their job list after creation
- July 17, 2025: Added publish functionality and status column to job list - implemented publish button (upload icon) for draft jobs, reorganized job list with table-like structure showing columns for Job Title, Status, and Actions, added status badges showing "Live" (green) for published jobs and "Draft" (gray) for draft jobs, users can now publish jobs directly from the job list with confirmation dialog
- July 17, 2025: Fixed "Full-time" employment type display issue - removed hardcoded "Full-time" badge from all job cards, job details pages, and structured data since no employment type field exists in job creation form, cleaned up JobCard, Jobs page, Tenders page, job-details page, and JobStructuredData component to only show relevant badges (Job/Tender type and sector)
- July 17, 2025: Enhanced job selection functionality - added individual checkboxes for all jobs (both draft and published) in the job list instead of only showing checkboxes for draft jobs, users can now select multiple jobs of any status and delete them using the bulk delete functionality with proper confirmation dialogs
- July 17, 2025: Added individual delete buttons to job actions column - each job now has a delete button (trash icon) alongside view and edit buttons in the actions column, provides individual job deletion with confirmation dialog, expanded actions column width to accommodate the additional delete button
- July 17, 2025: Implemented comprehensive URL slug system for SEO optimization - replaced numeric job IDs with SEO-friendly URL slugs (e.g., "/jobs/software-engineer-nairobi-123"), updated all job links throughout application including JobCard, job-details, jobs, tenders, dashboard, and related jobs sections, maintained backward compatibility with numeric ID format, updated social media sharing, canonical URLs, and structured data to use slug-based URLs for better search engine optimization
- July 18, 2025: Enhanced JobPosting JSON-LD structured data with conditional optional fields - implemented smart field inclusion logic to only add baseSalary, jobLocationType, identifier, experienceRequirements, and other optional fields when actual data is available, ensured all required fields (title, description, datePosted, employmentType, jobLocation, hiringOrganization) always have fallback values, added intelligent jobLocationType detection (TELECOMMUTE for remote jobs, ON_SITE for others), fixed React Hooks order violations by moving all hooks before conditional returns, improved Google for Jobs compatibility and search engine indexing
- July 18, 2025: Implemented dynamic sitemap.xml endpoint that automatically generates valid XML from job listings stored in the database - serves sitemap at /sitemap.xml route with correct XML content type, includes all job URLs using SEO-friendly slugs (https://somkenjobs.com/jobs/[slug]), dynamic last modified dates from job data, change frequency set to 'daily' for jobs and appropriate frequencies for static pages, includes all site pages (home, jobs, tenders, about, contact, career-resources, help, privacy, terms), enhances SEO and search engine discoverability with 275+ job URLs automatically updated when new jobs are added
- July 18, 2025: Created comprehensive robots.txt file served at /robots.txt route with proper search engine directives - allows all search engines to crawl public pages (jobs, tenders, about, contact, career-resources, help, privacy, terms) while blocking sensitive backend routes (/admin, /api, /internal, /dashboard, /preview), includes sitemap reference to https://somkenjobs.com/sitemap.xml, serves with correct text/plain content type, improves SEO compliance and search engine crawling efficiency
- July 21, 2025: Fixed publish job functionality by correcting parameter structure in dashboard update mutation - changed from `{ id: job.id, jobData }` to `{ jobId: job.id, jobData }` to match backend mutation signature, resolves "invalid input syntax for type integer: 'NaN'" error that prevented job status updates
- July 21, 2025: Fixed critical rich text editor issues and implemented comprehensive solution - resolved ReactQuill import/module loading problems by creating custom HTML5-based SimpleRichTextEditor component, added complete formatting toolbar (bold, italic, underline, alignment, lists), implemented advanced table functionality with click-to-select, control panel with border options (All Borders/Outer Border/Inner Borders/No Borders), add row/column buttons, delete functionality, automatic styling for pasted tables with proper borders and padding, created advanced image functionality with click-to-select, corner resize handles, drag-and-drop positioning, right-click context menu (Small/Medium/Large/Original/Delete), visual selection states with blue borders, red delete button, and professional content editing experience matching modern editors

## User Preferences

Preferred communication style: Simple, everyday language.