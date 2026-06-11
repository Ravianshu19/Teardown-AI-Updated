# TeardownAI — Next.js Full-Stack App

A modern, full-stack Next.js application that lets you teardown any digital product like a Senior PM. Get instant AI-powered product SWOT analysis, user personas, customer journey maps, RICE prioritization matrices, and PRD specifications in under 30 seconds.

---

## 🚀 Key Features
- **Instant AI Teardowns**: Connects securely to the Anthropic Claude API to generate comprehensive PM blueprints.
- **Local & Cloud Database**: Uses an elegant fallback mechanism—reads and writes locally to `database.json` by default, but seamlessly switches to **MongoDB** in production when the environment keys are present.
- **Interactive Portal Workspace**: Includes real-time portfolio metrics, activity tracking, saved/starred blueprints, and a team coordination board.
- **Simulated Payment Gateway**: Integrated simulated Razorpay checkouts to handle Pro/Student tier upgrades and credit allocations.
- **Modern Dark/Light Themes**: Full theme support utilizing sleek vanilla CSS design tokens.
- **SEO Optimized & Responsive**: Preconnected fonts and accessible semantic layout structures.

---

## 📁 Project Structure

```
teardownai-hosted/
├── src/
│   ├── app/
│   │   ├── api/                     # Next.js Serverless Route Handlers
│   │   │   ├── analyze/             # Claude API Proxy Router
│   │   │   ├── login/               # Authentication sign-in
│   │   │   ├── register/            # Authentication sign-up
│   │   │   ├── reports/             # Retrieve, create & update PM reports
│   │   │   ├── session/             # Active session validation
│   │   │   ├── team/                # Team member invitation & removal
│   │   │   └── verify-payment/      # Razorpay signature verification
│   │   ├── portal/                  # Portal workspace view pages
│   │   │   └── page.tsx
│   │   ├── layout.tsx               # Root HTML layout and font preconnections
│   │   ├── page.tsx                 # Main marketing landing page and analysis runner
│   │   └── globals.css              # Unified vanilla CSS styles and theme variables
│   └── lib/
│       ├── db.ts                    # Unified Database Adapter (Local JSON + MongoDB)
│       └── products.ts              # Curated mockup database for high-profile apps
├── public/                          # Static assets and PDF exports
├── package.json                     # Node.js dependencies and run scripts
├── tsconfig.json                    # TypeScript compiler options
└── .env.example                     # Environment template configuration
```

---

## 🛠️ Local Setup (3 Minutes)

### 1. Clone & Install Dependencies
First, install the package dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your keys:
```env
# Required for AI generation
ANTHROPIC_API_KEY=sk-ant-api03-...

# Razorpay credentials (used for simulation fallback)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Optional MongoDB Database (if omitted, data will store in local database.json)
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=teardownai
```

### 3. Run Development Server
Start the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building and Production

To check for compilation errors and generate the optimized production bundle, run:
```bash
npm run build
```

To run the production build locally:
```bash
npm start
```

---

## ☁️ Deployment

### Vercel (Recommended)
Since this project is a standard Next.js App Router application, deploying to Vercel takes seconds:
1. Push your code to a GitHub repository.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** → **Project**.
3. Import your repository.
4. Add the environment variables from your `.env` in the **Environment Variables** settings.
5. Click **Deploy**. Vercel will automatically build the application and provision serverless functions for the API routes.

### Railway or Render (Containerized / Node)
1. Push your code to GitHub.
2. Link your repository to Railway or Render.
3. Configure the environment variables in their dashboard.
4. Railway and Render will auto-detect the package.json scripts and build the Next.js production build automatically.
