# CryptoVault - Trading Journal Application

## Project Overview
A full-stack React application for crypto trading journal management with Supabase backend integration.

## Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL database + authentication)
- **Routing**: React Router DOM
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation

## Project Structure
- `src/pages/` - Application pages (Dashboard, Journal, Portfolio, Analytics, etc.)
- `src/components/` - Reusable UI components organized by feature
- `src/hooks/` - Custom React hooks for data fetching and state management
- `src/integrations/supabase/` - Supabase client and type definitions
- `supabase/migrations/` - Database migrations

## Setup Configuration
- **Development Server**: Runs on port 5000 with Vite
- **Host Configuration**: Configured for Replit environment with allowedHosts
- **Build System**: npm-based with TypeScript compilation
- **Deployment**: Configured for autoscale deployment with preview mode

## Key Features
- User authentication with Supabase
- Trading journal entry management
- Portfolio tracking and analytics
- Data sharing capabilities
- Real-time price updates
- Responsive design with dark/light themes

## Database
- Uses Supabase PostgreSQL database
- Main tables: journal_entries, platforms, profiles, access_grants
- Supports various entry types: spot, futures, wallet, etc.

## Recent Changes (Sep 25, 2025)
- Fixed Vite configuration for Replit environment compatibility
- Added allowedHosts configuration to prevent blocked requests
- Resolved Journal component TypeScript errors
- Set up deployment configuration for production

## Development
- Run `npm run dev` to start development server
- Application accessible at port 5000 in Replit environment
- Hot reload enabled for development