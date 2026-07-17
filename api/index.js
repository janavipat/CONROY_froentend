// Vercel serverless entry point.
//
// Vercel doesn't run a persistent process (index.ts's app.listen() is only
// used by Railway/Render/local dev) — it invokes whatever this file exports
// per-request. Exporting the Express app directly is Vercel's documented
// pattern for hosting an existing Express app: @vercel/node wraps it as a
// request handler. vercel.json rewrites every incoming path to this function;
// Express's own router still sees and matches the real request path.
//
// Imports the *compiled* output (dist/), not the TypeScript source, so Vercel
// never has to resolve this project's NodeNext ".js"-on-".ts" import style —
// vercel.json's buildCommand runs `npm run build` first, so dist/ always
// exists by the time this function is bundled.
import { createApp } from "../dist/src/app.js";

const app = createApp();

export default app;
