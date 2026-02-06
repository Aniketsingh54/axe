# PR #1: Project Initialization & Authentication Layer

## System Overview: "You Are Here"

This is the **genesis** of the project. We are establishing the runtime environment, database connection, and security layer. No UI components or workflow logic will be built here; we are strictly laying the rails so the application can boot, authenticate a user, and connect to the database.

## Scope

* **Framework:** Initialize Next.js 15 (App Router) project with TypeScript.
* **Authentication:** Install `@clerk/nextjs` and configure `middleware.ts` to protect application routes.
* **Database:** Initialize Prisma ORM with a PostgreSQL schema that defines the "Source of Truth" for Workflows and History.
* **Styling:** Configure Tailwind CSS with the specific Weavy.ai theme variables.
* **Utilities:** Set up the `cn()` utility for class merging (standard in Shadcn/modern React stacks).

## Out of Scope

* React Flow canvas or any visual UI (PR #2 & #3).
* Any API routes for executing workflows.
* Sidebar layouts or navigation.

---

## 📜 The Contract (Source of Truth)

### 1. Database Schema (`prisma/schema.prisma`)

This schema defines the non-negotiable data structure required to support user-scoped workflows and detailed execution history.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Workflow {
  id        String   @id @default(uuid())
  userId    String   // Clerk User ID
  name      String
  nodes     Json     // React Flow nodes array
  edges     Json     // React Flow edges array
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  runs      Run[]

  @@index([userId])
}

model Run {
  id          String       @id @default(uuid())
  workflowId  String
  workflow    Workflow     @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  status      String       // "SUCCESS" | "FAILED" | "RUNNING"
  createdAt   DateTime     @default(now())
  duration    Int?         // In milliseconds
  triggerType String       // "FULL", "SINGLE", "PARTIAL"
  results     NodeResult[]
}

model NodeResult {
  id        String   @id @default(uuid())
  runId     String
  run       Run      @relation(fields: [runId], references: [id], onDelete: Cascade)
  nodeId    String
  nodeType  String   // "LLM", "TEXT", "CROP", etc.
  status    String   // "SUCCESS", "FAILED"
  input     Json?
  output    Json?
  error     String?
  startedAt DateTime
  endedAt   DateTime
}

```

### 2. Styling Contract (`tailwind.config.ts`)

We must define the specific colors to match the Weavy aesthetic.

```typescript
// Add these to the 'extend' section of theme
colors: {
  wy: {
    50: '#eef2ff',
    100: '#e0e7ff',
    500: '#6366f1', // Primary Theme Color (Indigo)
    600: '#4f46e5',
    900: '#312e81',
  }
}

```

---

## 🛠️ Implementation Checklist (For Code Agent)

### Step 1: Framework Setup

* [ ] Run `npx create-next-app@latest weavy-clone --typescript --tailwind --eslint`.
* [ ] Install dependencies: `npm install @clerk/nextjs @prisma/client clsx tailwind-merge lucide-react`.
* [ ] Install dev dependencies: `npm install -D prisma`.

### Step 2: Authentication (Clerk)

* [ ] Create `.env.local` and add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
* [ ] Create `middleware.ts` in the root:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

```


* [ ] Wrap the app in `app/layout.tsx` with `<ClerkProvider>`.

### Step 3: Database (Prisma)

* [ ] Run `npx prisma init`.
* [ ] Copy the Schema Contract above into `prisma/schema.prisma`.
* [ ] Create `lib/prisma.ts` for the singleton client:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

```


* [ ] Run `npx prisma generate` to create the types.

### Step 4: Utility Setup

* [ ] Create `lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

```



---

## ⏭️ Next Step

Once this PR is merged, the system will have a secured environment and a database ready to accept data.
**Next PR:** `PR #2: App Layout & Shell` (Building the static 3-column UI).