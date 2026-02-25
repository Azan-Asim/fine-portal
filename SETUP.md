# Fine Portal — Setup Guide

## Stack
- **Next.js 14** (App Router + TypeScript + Tailwind CSS)
- **Google Apps Script** — Backend API (Google Sheets as database)
- **EmailJS** — Client-side email notifications

---

## 1. Google Sheets Setup

### Step 1: Create a Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it **"Fine Portal"**
3. The Apps Script will auto-create the `Employees` and `Penalties` sheets with correct columns

### Step 2: Deploy Google Apps Script
1. In your Google Sheet → **Extensions → Apps Script**
2. Delete the default code and paste the contents of `google-apps-script/Code.gs`
3. Click **Save** (💾)
4. Click **Deploy → New Deployment**
5. Select Type: **Web App**
6. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** and copy the web app URL

---

## 2. Configure `.env.local`

```env
# Admin Credentials
NEXT_PUBLIC_ADMIN_EMAIL=admin@company.com
NEXT_PUBLIC_ADMIN_PASSWORD=Admin@1234

# Google Apps Script URL (paste from Step 2 above)
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# EmailJS (see below)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 3. EmailJS Setup

1. Create account at [emailjs.com](https://www.emailjs.com)
2. Add an **Email Service** (Gmail recommended) → copy **Service ID**
3. Create an **Email Template** with these variables:

```
To: {{to_email}}
Subject: Penalty Notice — Fine Portal

Dear {{to_name}},

You have been issued a penalty for the following reason:

Reason: {{reason}}
Amount: {{amount}}
Date: {{penalty_date}}

Please make payment via:
Name: {{bank_name}}
Service: {{bank_service}}
Account: {{bank_account}}

After payment, log in to Fine Portal and upload your payment screenshot.

Regards,
Fine Portal Team
```

4. Copy **Template ID** and your **Public Key** (Account → API Keys)

---

## 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or push to GitHub and connect to [vercel.com](https://vercel.com). Add all `NEXT_PUBLIC_*` env variables in Vercel Dashboard → Settings → Environment Variables.

---

## Roles & Login

| Role | Login Method | Redirect |
|------|-------------|---------|
| Admin | Email + Password (from .env) | `/admin/dashboard` |
| Employee | Email only (must be registered) | `/employee/dashboard` |

---

## Sheet Columns Reference

### Employees Sheet
`ID | Name | Email | Created At`

### Penalties Sheet
`ID | Employee ID | Employee Name | Email | Reason | Reference URL | Amount | Date | Status | Payment Proof | Payment Date | Payment Type | Notes | Created At`

---

## Penalty Status Flow

```
Unpaid → (employee submits payment) → Pending → (admin marks paid) → Paid
```
