# Trey Baker - Bakery Business Management Tool

## Overview
A business management tool for "Trey Baker" bakery that automates expense reporting, price calculations, ingredient inventory, and menu management. Includes role-based user accounts.

## Recent Changes
- **2026-03-05**: Added menu item ingredient linking - attach ingredients with quantities to menu items, see cost/margin
- **2026-03-05**: Added receipt system - employees create receipts from menu items, auto-calculated totals with tax, printable receipts
- **2026-02-07**: Added Orders feature - all team members can submit, Owner/Manager can delete and update status
- **2026-02-06**: Added user accounts with role-based access control (Owner, Manager, Staff)
- **2026-02-06**: First registered user automatically becomes Owner
- **2026-02-06**: Added login/register pages, session-based auth, team management page
- **2026-02-06**: Expense quantity tracking (qty x unit cost = total), CSV export

## User Preferences
- Design: Rose & Cream Patisserie theme (warm pinks, creams, raspberry accents)
- Zero border radius for sharp elegant edges
- Bakery name: "Trey Baker"

## Project Architecture
- **Frontend**: React + Vite, wouter routing, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js (v5), PostgreSQL with Drizzle ORM
- **Auth**: express-session + bcryptjs, connect-pg-simple for session storage
- **Roles**: Owner (full access), Manager (add/delete items), Staff (view + submit expenses)

### Key Files
- `shared/schema.ts` - Database schema (users, ingredients, menuItems, menuItemIngredients, expenses, orders, receipts, receiptItems, profileSettings, sessions)
- `server/auth.ts` - Auth middleware (setupAuth, requireAuth, requireRole)
- `server/routes.ts` - API routes with role-based protection
- `server/storage.ts` - Database storage interface
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/pages/login.tsx` / `register.tsx` - Auth pages
- `client/src/pages/menu-items.tsx` - Menu items with ingredient linking
- `client/src/pages/receipts.tsx` - Receipt/POS system
- `client/src/pages/team.tsx` - Team management (Owner only)

### Role Permissions
- **Owner**: Full access - manage team, settings, add/delete everything
- **Manager**: Can add/delete ingredients, menu items, expenses
- **Staff**: Can view everything, submit expenses and orders only (no add/delete ingredients or menu items)
