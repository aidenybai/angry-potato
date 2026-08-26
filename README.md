# Angry Potato 🥔

A tiny full-screen 3D playground built with Vite, React, TypeScript, and React
Three Fiber.

## Play

- **Click or tap** the potato to burst it into a gravity-powered shower of tiny
  potatoes.
- **Drag and release** the potato to pull it back, preview its path, and launch
  it like an Angry Birds slingshot. It bounces, rolls, and resets for another
  throw.

Mouse, touch, and pen input are supported. A short movement threshold keeps a
click distinct from a drag.

## Run locally

```bash
npm i
npm run dev
```

Create a production build with:

```bash
npm run build
```

The launch physics and 3D particle burst use small custom integrators, so there
is no external physics process or confetti overlay to configure.
