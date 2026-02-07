# Axe - AI Workflow Builder

Visual node-based workflow builder for AI/LLM automation.

## Features

- 6 Node Types: Text, Upload Image, Upload Video, LLM, Crop Image, Extract Frame
- Visual workflow canvas with React Flow
- Undo/Redo support
- Parallel node execution via Trigger.dev
- Workflow history tracking
- Import/Export workflows as JSON

## Deployment

### Environment Variables (Vercel)

```
DATABASE_URL=your_postgres_url
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
GEMINI_API_KEY=your_gemini_key
TRANSLOADIT_KEY=your_transloadit_key
TRANSLOADIT_TEMPLATE_ID=your_template_id
TRIGGER_SECRET_KEY=your_trigger_key
```

### Deploy

```bash
vercel --prod
```

## Development

```bash
npm install
npm run dev
npx trigger.dev@3.3.17 dev
```
