# Kimi Frontend

A production-ready React + Vite frontend for your Kimi backend.

## Connected Backend

Default backend URL is already configured:

```bash
https://kimibg1.onrender.com
```

You can override it with environment variables.

## Features

- Chat + streaming chat
- Search + news search
- File, image, and URL upload workflows
- Image generation + image description
- Text-to-speech
- Translation + batch translation
- Text + URL + YouTube summarization
- Code tools
- Writing tools
- Document intelligence + data analysis
- Session history controls
- Agent runner with SSE progress
- Status and health monitoring

## Local Setup

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and update if needed.

```bash
VITE_API_BASE_URL=https://kimibg1.onrender.com
VITE_AUTH_TOKEN=your-secret-token-if-enabled
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Render

1. Push this frontend to a private GitHub repository.
2. Create a new Render Static Site.
3. Either import via `render.yaml` or configure manually:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add environment variables:
   - `VITE_API_BASE_URL=https://kimibg1.onrender.com`
   - `VITE_AUTH_TOKEN=...` if backend auth is enabled

## Notes

- If your backend requires `Authorization: Bearer <token>`, set the token from the top bar in the UI or via `VITE_AUTH_TOKEN`.
- The app stores the token and API base URL in localStorage for convenience.
