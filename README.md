# College of the Immaculate Conception (CIC) Enugu — Class of 1995 Set
## Standalone Node.js Express REST API Backend (`CIC-ENUGU-25-SET`)

> **Official Backend & Zero-Login Financial Ledger System**  
> **Motto:** *"Semper Fidelis"* (Always Faithful)  
> **Runtime:** Node.js (v20+, ES Modules) + Express.js  
> **Database:** PostgreSQL (with Prisma ORM) & SQLite (Zero-Config Local Development)  
> **Image Storage:** Cloudinary & Local Disk Storage with WebP support  
> **Authentication:** Custom JWT in HttpOnly Cookies + Bcrypt (Zero Firebase, Zero Supabase)  

---

## 📋 Table of Contents
1. [Project Overview & Key Innovations](#1-project-overview--key-innovations)
2. [Technology Stack](#2-technology-stack)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Prerequisites & Quick Start](#4-prerequisites--quick-start)
5. [Environment Configuration (.env)](#5-environment-configuration-env)
6. [Database Architecture & Prisma Schema](#6-database-architecture--prisma-schema)
7. [Authentication & Security Architecture](#7-authentication--security-architecture)
8. [Zero-Login Payment & Receipt Engine](#8-zero-login-payment--receipt-engine)
9. [Public Digital Verification Engine](#9-public-digital-verification-engine)
10. [REST API Endpoints Specification](#10-rest-api-endpoints-specification)
11. [Frontend Integration Bridge (data-api.js)](#11-frontend-integration-bridge-data-apijs)
12. [Automated Testing & Verification](#12-automated-testing--verification)
13. [Production Deployment Guide](#13-production-deployment-guide)

---

## 1. Project Overview & Key Innovations

The **CIC Alumni 1995 Set Backend** is an enterprise-grade, standalone Node.js REST API service purpose-built for the alumni community of the College of the Immaculate Conception, Enugu, Nigeria.

### Key Pillars
- **Zero-Login Payment Philosophy:** Alumni never need to register an account, remember passwords, or deal with email magic links to pay monthly dues, development levies, or project donations. Identification occurs friction-free at checkout, generating permanent, cryptographically-watermarked receipts.
- **Audit-Proof Financial Ledger:** Every transaction—whether processed online via Paystack or recorded manually at the national secretariat (bank wire, cash, POS)—is permanently serialized, searchable, and exportable to CSV/Excel for audit committees.
- **Autonomous Administrative Sovereignty:** Complete executive administration over alumni rosters, dues rates, executive council profiles, capital school initiatives, bulletins, and event announcements without any external third-party service lock-in.
- **Dual Database Flexibility:** Runs out-of-the-box on local SQLite (`dev.db`) with zero external software required, while offering single-line configuration switching to production PostgreSQL.

---

## 2. Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Runtime** | Node.js v20+ (ES Modules) | High-performance, non-blocking I/O with native `fetch` and modern ESM syntax |
| **Framework** | Express.js 4.x | Fast, unopinionated routing with robust middleware ecosystem |
| **ORM** | Prisma 5.x | Type-safe schema definition, automated migrations, and high-performance queries |
| **Database** | SQLite / PostgreSQL | Zero-config local development (`dev.db`) with production PostgreSQL parity |
| **Authentication** | JWT in HttpOnly Cookies | Protection against XSS credential theft, bcrypt password/PIN hashing |
| **Image Storage** | Cloudinary / Local Disk | Automatic WebP compression and fallback to local disk storage |
| **Payments** | Paystack API + Webhooks | Real-time card, bank transfer, and USSD payments with HMAC-SHA512 verification |
| **Verification** | QRCode (Node) + HMAC-SHA256 | High-density dynamic verification QR codes with anti-tamper security signatures |
| **Security** | Helmet + Rate Limit + CORS | HTTP security headers, origin allowlisting, and brute-force rate limiting |

---

## 3. Project Directory Structure

```text
ilo2 backend/
├── package.json               # Root scripts delegating to server
├── README.md                  # Comprehensive master project documentation (this file)
└── server/
    ├── prisma/
    │   ├── schema.prisma      # Unified database schema models
    │   ├── seed.js            # Initial database seeder (Superadmin, categories, leadership)
    │   └── dev.db             # Local SQLite database (Zero-config out of the box)
    ├── src/
    │   ├── config/
    │   │   ├── env.js         # Validated environment loader
    │   │   ├── db.js          # Prisma Client singleton with BigInt JSON serialization
    │   │   └── cloudinary.js  # Cloudinary SDK client with graceful local fallback
    │   ├── controllers/
    │   │   ├── authController.js       # Admin JWT HttpOnly cookie login & PIN updates
    │   │   ├── membersController.js    # Alumni directory, chapter filters & CSV export
    │   │   ├── leadershipController.js # Executive council profiles & display ordering
    │   │   ├── paymentsController.js   # Zero-login payments, receipts, ledger & verification
    │   │   ├── projectsController.js   # Capital development projects & donor allocations
    │   │   ├── categoriesController.js # Dues categories & per-category payer rosters
    │   │   ├── configController.js     # System settings, dues rates & bank account details
    │   │   ├── reportsController.js    # Executive dashboard KPIs & monthly revenue breakdown
    │   │   ├── eventsController.js     # Reunions, galas and congress events
    │   │   ├── newsController.js       # Executive bulletins and announcements
    │   │   ├── galleryController.js    # Photo gallery albums and media items
    │   │   └── messagesController.js   # National secretariat inquiry desk
    │   ├── middleware/
    │   │   ├── auth.js        # JWT verification guard (HttpOnly cookie & Bearer token)
    │   │   ├── roles.js       # Role-based access control (SUPERADMIN, ADMIN, EXECUTIVE)
    │   │   ├── errorHandler.js# Centralized error handler with Prisma error mapping
    │   │   └── upload.js      # Multer storage configuration and MIME validation
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── membersRoutes.js
    │   │   ├── leadershipRoutes.js
    │   │   ├── paymentsRoutes.js
    │   │   ├── projectsRoutes.js
    │   │   ├── categoriesRoutes.js
    │   │   ├── configRoutes.js
    │   │   ├── reportsRoutes.js
    │   │   ├── eventsRoutes.js
    │   │   ├── newsRoutes.js
    │   │   ├── galleryRoutes.js
    │   │   ├── messagesRoutes.js
    │   │   ├── uploadRoutes.js
    │   │   └── index.js       # API route aggregator mounted at /api
    │   ├── services/
    │   │   ├── receiptService.js  # Reference (HAA-YYYY-XXXXX) & Serial (REC-YYYY-XXXX) generation
    │   │   ├── paymentService.js  # Paystack initialization, verification & webhook verification
    │   │   ├── imageService.js    # Multipart file and Base64 Data URL processor
    │   │   └── reportService.js   # High-performance CSV export formatters
    │   ├── public/
    │   │   └── data-api.js    # Client-side API bridge and LocalStorage synchronization
    │   └── server.js          # Express app bootstrap, static server & graceful shutdown
    ├── uploads/               # Persistent directory for uploaded portraits and banners
    ├── test-api.js            # Automated 10-point end-to-end integration test suite
    ├── .env.example           # Environment template with production guidance
    ├── .env                   # Active local environment configuration
    └── package.json           # Server dependencies and lifecycle scripts
```

---

## 4. Prerequisites & Quick Start

### Prerequisites
- **Node.js:** v20.0.0 or higher (`node -v`)
- **NPM:** v10.0.0 or higher (`npm -v`)

### Step 1: Install Dependencies
From the repository root or the `server/` directory:
```bash
cd server
npm install
```

### Step 2: Initialize & Seed Database
Execute the automated database setup script. This creates the local SQLite database and seeds default administrative credentials, dues categories, leadership council members, capital projects, and initial alumni records:
```bash
npm run db:setup
```

### Step 3: Start the Backend Server
```bash
# Start in production mode
npm start

# Or start with auto-reload during development
npm run dev
```

The server will initialize and display:
```text
========================================================
🚀 CIC ENUGU 1995 ALUMNI PORTAL BACKEND RUNNING
📡 URL: http://localhost:5050
🔌 API Prefix: http://localhost:5050/api
❤️  Health Check: http://localhost:5050/health
🗄️  Database: Connected (file:./dev.db)
========================================================
```

### Step 4: Run Integration Verification Suite
```bash
npm test
# or: node test-api.js
```

---

## 5. Environment Configuration (.env)

The application configuration is managed via `server/.env`. Copy from `server/.env.example` as needed:

```env
# -------------------------------------------------------------
# SERVER NETWORK CONFIGURATION
# -------------------------------------------------------------
PORT=5050
NODE_ENV=development
API_PREFIX=/api

# -------------------------------------------------------------
# DATABASE CONNECTION (PRISMA)
# -------------------------------------------------------------
# Default: Zero-config SQLite database:
DATABASE_URL="file:./dev.db"

# Production PostgreSQL Connection (uncomment when deploying to Postgres):
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/cic_alumni?schema=public"

# -------------------------------------------------------------
# AUTHENTICATION & SECURITY
# -------------------------------------------------------------
JWT_SECRET="cic-enugu-1995-super-secret-jwt-key-2026-production"
JWT_EXPIRES_IN="7d"
COOKIE_SECRET="cic-enugu-cookie-secret-key-1995"
COOKIE_SECURE="false" # Set to "true" in production when behind HTTPS
CORS_ORIGIN="http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080,http://127.0.0.1:8080,http://localhost:5050"

# -------------------------------------------------------------
# DEFAULT SUPERADMIN SEED CREDENTIALS
# -------------------------------------------------------------
ADMIN_NAME="Secretariat SuperAdmin"
ADMIN_EMAIL="admin@cicalumni1995.org"
ADMIN_PASSWORD="cicEnuguAdmin1995!"
ADMIN_PIN="1995"

# -------------------------------------------------------------
# PAYSTACK PAYMENT GATEWAY
# -------------------------------------------------------------
PAYSTACK_SECRET_KEY="sk_test_placeholder_key"
PAYSTACK_PUBLIC_KEY="pk_test_placeholder_key"
PAYSTACK_BASE_URL="https://api.paystack.co"

# -------------------------------------------------------------
# CLOUDINARY MEDIA STORAGE (OPTIONAL)
# -------------------------------------------------------------
# If left blank, images are automatically stored on local disk under server/uploads/
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

---

## 6. Database Architecture & Prisma Schema

The Prisma database schema is defined in [schema.prisma](file:///c:/Users/user_pc/Desktop/ilo2%20backend/server/prisma/schema.prisma):

### Core Models

1. **`User`**: Administrator accounts with bcrypt-hashed passwords and PINs, role-based authorization (`SUPERADMIN`, `ADMIN`, `EXECUTIVE`), and session tracking.
2. **`SystemConfig`**: Global association settings, statutory dues rates (monthly, annual, reunion), payment gateway mode (Test/Live), and designated secretariat bank accounts.
3. **`Category`**: Customizable dues collections (`Monthly Dues`, `Development Levy`, `Welfare Contribution`, `Project Donation`, etc.) with base amounts and calculation types.
4. **`Payment`**: Comprehensive zero-login ledger records containing unique transaction references (`HAA-YYYY-XXXXX`), official serial receipt numbers (`REC-YYYY-XXXX`), member identification, selected dues months, amounts, gateway, channel, high-density verification QR codes, and tamper-proof HMAC signatures.
5. **`Member`**: Global Class of 1995 alumni directory entries with chapters (`Lagos`, `Enugu`, `Abuja FCT`, `Diaspora`), professions, dues clearance statuses, and contact details.
6. **`Leadership`**: Executive Council roster with hierarchical display ordering (`order`), titles, offices, portraits, and biographies.
7. **`Project` & `ProjectDonation`**: Capital development school initiatives (e.g., STEM Robotics Lab, Solar Power Micro-Grid, Scholarship Endowments) with financial progress tracking, target/raised metrics, and individual donor backer lists.
8. **`Event`**: Grand reunions, general congresses, and sports festivals.
9. **`News`**: Executive dispatches, bulletins, and meeting resolutions.
10. **`GalleryItem`**: Curated historical and event photographs.
11. **`Message`**: Direct inquiries and communications submitted to the national secretariat desk.

### Switching from SQLite to PostgreSQL

To deploy to PostgreSQL:
1. Open `server/prisma/schema.prisma` and change the provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `server/.env` with your PostgreSQL URI.
3. Apply schema to PostgreSQL:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

---

## 7. Authentication & Security Architecture

### Zero Third-Party Vendor Lock-in
The system operates entirely independently without reliance on Firebase, Supabase, or AWS Cognito:
- **HttpOnly Cookies:** Authentication tokens are stored inside browser cookies with the `HttpOnly`, `SameSite`, and `Secure` attributes, safeguarding sessions against JavaScript-based XSS attacks.
- **Bcrypt Encryption:** Administrative passwords and security PINs are salted and hashed with 10 rounds of bcrypt.
- **Dual Login Methods:** Supports standard password authentication as well as rapid 4-digit PIN authentication for secretariat workstations.
- **Role-Based Access Control:** Route middleware enforces permissions:
  - `SUPERADMIN`: Full system authority, credential management, system resets.
  - `ADMIN`: Ledger management, manual receipt issuance, content publishing, CSV exports.
  - `EXECUTIVE`: View-only access to analytics, financial ledgers, and donor rosters.

---

## 8. Zero-Login Payment & Receipt Engine

The checkout engine allows alumni worldwide to clear dues without creating an account:

```text
[Step 1: Alumnus Identification] ➔ [Step 2: Dues Category & Months] ➔ [Step 3: Paystack Checkout] ➔ [Step 4: Instant Official Receipt]
```

### Identifier Generation Algorithms
- **Transaction Reference:** `HAA-YYYY-XXXXX` (e.g. `HAA-2026-84920`)
- **Official Serial Receipt:** `REC-YYYY-XXXX` (e.g. `REC-2026-4819`)
- **Embedded Dynamic QR Code:** Scannable QR code generated server-side linking directly to `verify.html?ref=HAA-YYYY-XXXXX`.
- **HMAC Verification Seal:** Digital signature computed via HMAC-SHA256 over reference, serial, amount, email, and timestamp.

### Offline & Manual Receipt Studio
Secretariat officers can record cash, POS, and direct bank wire transactions via `POST /api/payments/manual`, generating identical official serialized receipts and updating the audit ledger in real time.

---

## 9. Public Digital Verification Engine

Anyone—banks, employers, members, or audit committees—can independently verify transaction authenticity:
- Accepts either `HAA-YYYY-XXXXX` or `REC-YYYY-XXXX`.
- Endpoint: `GET /api/payments/verify-lookup/:refOrReceipt`
- URL Parameter Support: Opening `verify.html?ref=HAA-2026-84920` auto-queries the verification engine on load.
- Returns complete transaction metadata, verification status, official college security seal, and dynamic QR code.

---

## 10. REST API Endpoints Specification

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login using email + password or PIN. Sets HttpOnly cookie. | No |
| `POST` | `/api/auth/logout` | Clears HttpOnly cookie and invalidates session. | No |
| `GET` | `/api/auth/me` | Fetches active authenticated administrator profile. | Yes |
| `POST` | `/api/auth/update-password` | Updates administrator password. | Yes |
| `POST` | `/api/auth/update-pin` | Updates administrator security PIN. | Yes |

### Payments & Dues (`/api/payments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/initialize` | Initialize zero-login checkout with Paystack. | No |
| `POST` | `/api/payments/verify/:reference` | Verify transaction status with Paystack. | No |
| `GET` | `/api/payments/verify-lookup/:ref`| Public zero-login receipt & reference verification engine. | No |
| `GET` | `/api/payments/receipt/:reference`| Fetch full digital receipt payload. | No |
| `POST` | `/api/payments/manual` | Secretariat offline receipt studio (wire/cash/POS). | Yes (Admin) |
| `GET` | `/api/payments` | Financial ledger with multi-column filtering and search. | Yes (Admin) |
| `GET` | `/api/payments/export/csv` | Download complete accounting ledger as CSV/Excel. | Yes (Admin) |
| `POST` | `/api/payments/webhook` | Automated Paystack charge.success webhook endpoint. | No |

### Alumni Members Directory (`/api/members`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/members` | List members with live search, chapter and status filters. | No |
| `GET` | `/api/members/:id` | Fetch specific member profile. | No |
| `POST` | `/api/members` | Register new alumnus member. | Yes (Admin) |
| `PUT` | `/api/members/:id` | Update member details and dues clearance status. | Yes (Admin) |
| `DELETE` | `/api/members/:id` | Remove member from directory. | Yes (Admin) |
| `GET` | `/api/members/export/csv` | Export entire alumni directory roster to CSV. | No |

### Leadership Council (`/api/leadership`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/leadership` | List executive council roster ordered by rank. | No |
| `GET` | `/api/leadership/:id` | Fetch single executive profile. | No |
| `POST` | `/api/leadership` | Add executive officer with portrait upload. | Yes (Admin) |
| `PUT` | `/api/leadership/:id` | Update executive profile and bio. | Yes (Admin) |
| `PUT` | `/api/leadership/reorder` | Update hierarchical ordering of officers. | Yes (Admin) |
| `DELETE` | `/api/leadership/:id` | Delete executive officer. | Yes (Admin) |

### Capital School Projects (`/api/projects`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | List capital initiatives with progress % and metrics. | No |
| `GET` | `/api/projects/:id` | Fetch project details with top donor backers. | No |
| `POST` | `/api/projects` | Create capital project initiative. | Yes (Admin) |
| `PUT` | `/api/projects/:id` | Update project targets, status, or description. | Yes (Admin) |
| `POST` | `/api/projects/:id/allocate`| Manually allocate funds from offline sponsors. | Yes (Admin) |
| `DELETE` | `/api/projects/:id` | Delete capital project. | Yes (Admin) |
| `DELETE` | `/api/projects` | Clear all projects (secretariat reset). | Yes (Admin) |

### Dues Categories & Configuration (`/api/categories`, `/api/config`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | List active payment and dues categories. | No |
| `POST` | `/api/categories` | Add custom payment category. | Yes (Admin) |
| `PUT` | `/api/categories/:id` | Rename category (retroactively updates ledger). | Yes (Admin) |
| `DELETE` | `/api/categories/:id` | Delete payment category. | Yes (Admin) |
| `GET` | `/api/categories/:id/payers`| View list of all alumni who paid under this category. | Yes (Admin) |
| `GET` | `/api/config` | Fetch association settings, statutory rates and bank info.| No |
| `PUT` | `/api/config` | Update system configuration and gateway mode. | Yes (Admin) |

### Executive Reports & Analytics (`/api/reports`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard` | 4 Financial KPI cards, revenue charts, recent feed. | Yes (Admin) |
| `GET` | `/api/reports/monthly` | Monthly revenue trend breakdown. | Yes (Admin) |

### Events, Bulletins, Gallery & Inquiries
- `/api/events`: Event management and reunion gala scheduling.
- `/api/news`: Secretariat press bulletins and executive notices.
- `/api/gallery`: Alumni photograph archive with album tags.
- `/api/messages`: National secretariat public contact desk inquiries.
- `/api/upload`: Multipart file upload or Base64 upload with WebP compression.

---

## 11. Frontend Integration Bridge (data-api.js)

To connect the static HTML frontend (`members.html`, `leadership.html`, `payment.html`, `verify.html`, `projects.html`, `admin.html`) to the backend:

1. Copy or link `server/src/public/data-api.js` into your frontend scripts:
   ```html
   <script src="js/data-api.js"></script>
   <script src="js/data.js"></script>
   ```
2. **Transparent Bidirectional Sync:**
   - On page load, `data-api.js` pings the backend.
   - If connected, it syncs the database records into `localStorage` cache in the background.
   - If the backend is offline, the portal operates gracefully with `localStorage`.
3. **Global `ApiClient` API:**
   ```javascript
   // Initialize payment
   const payment = await ApiClient.Payments.initialize({
     name: 'Chief Uche Nnamani',
     email: 'uche@sample.com',
     amount: 15000,
     paymentType: 'Monthly Dues',
     selectedMonths: ['January', 'February', 'March']
   });

   // Public receipt verification lookup
   const result = await ApiClient.Payments.verifyLookup('HAA-2026-84920');

   // Admin login
   await ApiClient.Auth.login('admin@cicalumni1995.org', 'cicEnuguAdmin1995!');
   ```

---

## 12. Automated Testing & Verification

A dedicated end-to-end integration test suite is included in [server/test-api.js](file:///c:/Users/user_pc/Desktop/ilo2%20backend/server/test-api.js).

To execute the test suite:
```bash
npm test
```

The test validates:
1. `GET /health` — Service and database connectivity.
2. `GET /api` — Service identity and version check.
3. `GET /api/categories` — Category retrieval.
4. `GET /api/leadership` — Executive council hierarchy.
5. `GET /api/projects` — Capital initiatives and percentage calculations.
6. `GET /api/members` — Alumni directory records.
7. `POST /api/auth/login` — Superadmin bcrypt & JWT authentication.
8. `POST /api/payments/initialize` — Zero-login payment and QR code generation.
9. `GET /api/payments/verify-lookup/:ref` — Public verification engine authenticity check.
10. `GET /api/reports/dashboard` — Authenticated financial KPI aggregation.

---

## 13. Production Deployment Guide

### Deploying on Linux / VPS (Ubuntu + Nginx + PM2)

1. **Clone repository and setup:**
   ```bash
   git clone <repo-url>
   cd "ilo2 backend/server"
   npm install --production
   ```
2. **Configure production environment:**
   ```bash
   cp .env.example .env
   nano .env
   # Set NODE_ENV=production, DATABASE_URL, JWT_SECRET, COOKIE_SECURE=true
   ```
3. **Run Prisma migration & seed:**
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```
4. **Launch with PM2 process manager:**
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "cic-alumni-api"
   pm2 save
   pm2 startup
   ```
5. **Nginx Reverse Proxy Configuration:**
   ```nginx
   server {
       server_name api.cicalumni1995.org;

       location / {
           proxy_pass http://localhost:5050;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Deploying on Render / Railway / Fly.io
- **Build Command:** `npm install && npx prisma db push && node prisma/seed.js`
- **Start Command:** `node src/server.js`
- **Port:** Configured via `PORT` environment variable (defaults to 5050).

---

## 📜 License & Copyright
Developed for the **College of the Immaculate Conception (CIC) Enugu — Class of 1995 Alumni Association**.  
All rights reserved. *"Semper Fidelis"*.
