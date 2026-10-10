# CIC Enugu 1995 Alumni Association Portal Backend (`CIC-ENUGU-25-SET`)

> **Runtime:** Node.js (v20+, ES Modules) + Express.js  
> **Database:** PostgreSQL (with Prisma ORM) or SQLite (for zero-config local development)  
> **Image Storage:** Cloudinary or Local Disk Storage with WebP support  
> **Authentication:** Custom JWT in HttpOnly Cookies + Bcrypt  

---

## 📁 Directory Structure

```text
server/
├── prisma/
│   ├── schema.prisma          # Database schema models (Prisma ORM)
│   ├── seed.js                # Initial database seed (Superadmin, categories, leadership, projects)
│   └── dev.db                 # Local SQLite database (Zero-config)
├── src/
│   ├── config/
│   │   ├── env.js             # Validated environment configuration
│   │   ├── db.js              # Prisma Client singleton with BigInt JSON serialization
│   │   └── cloudinary.js      # Cloudinary image storage client
│   ├── controllers/
│   │   ├── authController.js       # Admin JWT HttpOnly cookie authentication & PIN/password updates
│   │   ├── membersController.js    # Alumni member directory, search & CSV export
│   │   ├── leadershipController.js # Executive council profiles & display order
│   │   ├── paymentsController.js   # Zero-login payments, receipts, ledger, verification & webhooks
│   │   ├── projectsController.js   # Capital development projects, donor tracking & fund allocations
│   │   ├── categoriesController.js # Dues categories management & payer rosters
│   │   ├── configController.js     # Portal system settings & rates
│   │   ├── reportsController.js    # Executive dashboard KPIs, analytics & monthly breakdown
│   │   ├── eventsController.js     # Reunions, galas and congress events
│   │   ├── newsController.js       # Bulletins and secretariat announcements
│   │   ├── galleryController.js    # Photo gallery items & albums
│   │   └── messagesController.js   # Secretariat inquiry desk
│   ├── middleware/
│   │   ├── auth.js            # JWT verification guard (HttpOnly cookie + Bearer token)
│   │   ├── roles.js           # Role-based access control (SUPERADMIN, ADMIN, EXECUTIVE)
│   │   ├── errorHandler.js    # Centralized error handler with Prisma & Multer error mapping
│   │   └── upload.js          # Multer disk storage and file validation
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
│   │   └── index.js           # API route aggregator mounted at /api
│   ├── services/
│   │   ├── receiptService.js  # Serial generation (HAA-YYYY-XXXXX, REC-YYYY-XXXX), QR code & HMAC
│   │   ├── paymentService.js  # Paystack initialization, verification & webhook signatures
│   │   ├── imageService.js    # Base64 and multipart file processor (Cloudinary or local disk)
│   │   └── reportService.js   # High-performance CSV export and ledger formatters
│   ├── public/
│   │   └── data-api.js        # Frontend client adapter & LocalStorage sync bridge
│   └── server.js              # Express app entry point
├── uploads/                   # Stored local uploaded media
├── test-api.js                # Complete verification test suite
├── .env.example               # Environment variables template
├── .env                       # Local active environment configuration
└── package.json
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment (`.env`)
The default `.env` is configured for **zero-config local development** using SQLite.

```env
PORT=5050
NODE_ENV=development
API_PREFIX=/api
DATABASE_URL="file:./dev.db"

JWT_SECRET="cic-enugu-1995-super-secret-jwt-key-2026-production"
ADMIN_EMAIL="admin@cicalumni1995.org"
ADMIN_PASSWORD="cicEnuguAdmin1995!"
ADMIN_PIN="1995"
```

### 3. Initialize & Seed Database
```bash
npm run db:setup
```
*This command executes `prisma db push` to create all tables and runs `prisma/seed.js` to seed the default Superadmin, categories, leadership roster, capital initiatives, and sample members.*

### 4. Start Server
```bash
# Production mode
npm start

# Development watch mode
npm run dev
```

The server will be available at **`http://localhost:5050`** with the API root at **`http://localhost:5050/api`**.

### 5. Run Verification Tests
```bash
npm test
# or: node test-api.js
```

---

## 🗄️ Database Provider Switching (SQLite ➔ PostgreSQL)

To switch to **PostgreSQL** in production:
1. In `prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `.env`, provide your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/cic_alumni?schema=public"
   ```
3. Run schema push and seed:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

---

## 🔐 Default Admin Credentials
* **Superadmin Email:** `admin@cicalumni1995.org`
* **Default Password:** `cicEnuguAdmin1995!`
* **Default PIN:** `1995`

---

## 📡 REST API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/health` | Server and database health check | Public |
| **GET** | `/api` | API identity and status | Public |
| **POST** | `/api/auth/login` | Admin login (email + password or PIN) | Public |
| **POST** | `/api/auth/logout` | Clear HttpOnly auth cookie | Public |
| **GET** | `/api/auth/me` | Current user profile | Auth (Admin) |
| **POST** | `/api/payments/initialize` | Zero-login dues/donation checkout | Public |
| **POST** | `/api/payments/verify/:ref` | Confirm payment with Paystack | Public |
| **GET** | `/api/payments/verify-lookup/:ref`| Public verification lookup (`verify.html`) | Public |
| **GET** | `/api/payments/receipt/:ref`| Full printable digital receipt payload | Public |
| **POST** | `/api/payments/manual` | Offline receipt studio (wire/cash/POS) | Auth (Admin) |
| **GET** | `/api/payments` | Financial ledger with filtering | Auth (Admin) |
| **GET** | `/api/payments/export/csv` | Export payment ledger to CSV | Auth (Admin) |
| **POST** | `/api/payments/webhook` | Paystack automated webhook | Public |
| **GET** | `/api/members` | Members directory with search & filters | Public |
| **POST** | `/api/members` | Register member | Auth (Admin) |
| **GET** | `/api/members/export/csv` | Export members list to CSV | Public |
| **GET** | `/api/leadership` | Executive Council directory | Public |
| **POST** | `/api/leadership` | Add executive member | Auth (Admin) |
| **PUT** | `/api/leadership/reorder` | Reorder executive hierarchy | Auth (Admin) |
| **GET** | `/api/projects` | Capital development initiatives & stats | Public |
| **POST** | `/api/projects` | Create capital project initiative | Auth (Admin) |
| **POST** | `/api/projects/:id/allocate` | Allocate funds manually to project | Auth (Admin) |
| **GET** | `/api/categories` | List active dues categories | Public |
| **GET** | `/api/categories/:id/payers`| View payer roster for specific dues type| Auth (Admin) |
| **GET** | `/api/reports/dashboard` | Executive KPIs, charts & analytics | Auth (Admin) |
| **GET** | `/api/config` | System settings & rates | Public |
| **PUT** | `/api/config` | Update system settings | Auth (Admin) |
| **POST** | `/api/upload` | Upload image (multipart or base64) | Auth (Admin) |

---

## 🌐 Frontend Integration

Include `data-api.js` in your HTML `<head>` or before `data.js`:

```html
<script src="js/data-api.js"></script>
<script src="js/data.js"></script>
```

`data-api.js` automatically detects if the Node.js backend is active, synchronizes your `localStorage` cache with the database, and exposes `window.ApiClient` for direct API calls.
