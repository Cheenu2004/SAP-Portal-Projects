# SAP Customer Portal

Full-stack application with Node.js Express backend middleware and Angular 18 frontend for SAP SOAP Webservices integration.

## Project Structure

```
sap-customer-portal/
├── src/                              # Backend (Node.js Express)
│   ├── server.js                     # Express server entry point
│   ├── middleware/
│   │   └── auth.middleware.js        # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.routes.js            # POST /api/auth/login
│   │   ├── profile.routes.js         # GET /api/profile
│   │   ├── dashboard.routes.js       # Inquiry, Sales Orders, Delivery
│   │   └── financial.routes.js       # Invoices, Payments, Memos, Summary
│   └── services/
│       ├── sap.service.js            # Reusable SAP SOAP service helper
│       └── xml-builders.js           # SOAP XML builders for each FM
├── frontend/                          # Frontend (Angular 18)
│   ├── src/
│   │   ├── app/
│   │   │   ├── guards/               # Auth guard
│   │   │   ├── interceptors/         # HTTP interceptor for JWT
│   │   │   ├── layouts/              # Main layout with sidebar
│   │   │   ├── pages/                # All page components
│   │   │   │   ├── login/
│   │   │   │   ├── profile/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── inquiry/
│   │   │   │   ├── sales-orders/
│   │   │   │   ├── delivery/
│   │   │   │   ├── invoices/
│   │   │   │   ├── payments/
│   │   │   │   ├── memos/
│   │   │   │   └── sales-summary/
│   │   │   └── services/             # Auth & SAP API services
│   │   ├── environments/
│   │   └── styles.scss               # Global styles (white/red theme)
│   ├── angular.json
│   ├── package.json
│   └── proxy.conf.json
├── .env                              # Environment variables
├── .env.example                      # Environment template
└── package.json                      # Backend package.json
```

## Setup

### Backend Setup

1. Install backend dependencies:
```bash
npm install
```

2. Configure `.env` file with your SAP credentials:
```env
SAP_BASE_URL=http://AZKTLDS5CP.kcloud.com:8000
SAP_USERNAME=K902065
SAP_PASSWORD=Srini@0611
SAP_CLIENT=100
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
PORT=3000
```

3. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install Angular dependencies:
```bash
npm install
```

3. Start the Angular development server:
```bash
npm start
```

The Angular app runs on `http://localhost:4200` and proxies API requests to the backend on `http://localhost:3000`.

## Running Both Servers

In two separate terminals:

**Terminal 1 (Backend):**
```bash
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Customer login validation

### Profile
- `GET /api/profile` - Fetch customer profile (requires JWT)

### Dashboard
- `GET /api/dashboard/inquiry` - Fetch inquiry data (requires JWT)
- `GET /api/dashboard/sales-orders` - Fetch sales order data (requires JWT)
- `GET /api/dashboard/delivery` - Fetch delivery data (requires JWT)

### Financial
- `GET /api/financial/invoices` - Fetch invoice data (requires JWT)
- `GET /api/financial/invoice-pdf/:invoiceNumber` - Download invoice PDF (requires JWT)
- `GET /api/financial/payments` - Fetch payment and aging data (requires JWT)
- `GET /api/financial/memos/:type` - Fetch credit/debit memo data (requires JWT)
- `GET /api/financial/sales-summary` - Fetch sales summary totals (requires JWT)

## SAP RFC Function Modules Mapped

| FM Name | Purpose | Endpoint |
|---------|---------|----------|
| ZSD_LGN_FM902065 | Customer login | /api/auth/login |
| ZSD_PRF_FM902065 | Customer profile | /api/profile |
| ZSD_INQ_FM902065 | Inquiry data | /api/dashboard/inquiry |
| ZSD_SO_FM902065 | Sales orders | /api/dashboard/sales-orders |
| ZSD_DEL_FM902065 | Delivery data | /api/dashboard/delivery |
| ZSD_INV_FM902065 | Invoice data | /api/financial/invoices |
| ZSD_INVDET_FM902065 | Invoice PDF | /api/financial/invoice-pdf |
| ZSD_PAY_FM902065 | Payments & aging | /api/financial/payments |
| ZSD_MEM_FM902065 | Credit/debit memo | /api/financial/memos |
| ZSD_SUM_FM902065 | Sales summary | /api/financial/sales-summary |

## Features

- **Login**: Customer ID based authentication
- **Profile**: View customer information from SAP
- **Dashboard**: Overview with counts for inquiries, orders, deliveries, invoices
- **Inquiry**: View all customer inquiries
- **Sales Orders**: View sales orders with date filters
- **Delivery**: View delivery documents
- **Invoices**: View invoices and download PDFs
- **Payments**: View payment documents with date filters
- **Credit/Debit Memos**: Toggle between credit and debit memos
- **Sales Summary**: Annual sales totals with statistics

## Styling

The frontend uses a white and red color theme:
- Primary: #DC2626 (Red)
- Background: White/Light Gray
- Accents: Red highlights for active states and badges
