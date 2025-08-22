# Text Wizard — Engineering Guidelines

This document captures project-specific practices for building, configuring, testing, and contributing to Text Wizard. It assumes an advanced developer familiar with Vite, React, TypeScript, Tailwind, and Capacitor/Android.


## 1) Build and Configuration

Tech stack:
- React 18 + TypeScript + Vite 5 (plugin-react-swc)
- TailwindCSS 3
- Capacitor 7 (Android platform)
- Design system: Radix UI + shadcn/ui style primitives

Key configs:
- Vite: vite.config.ts
  - Dev server: host "::" (IPv6), port 8080
  - Alias: "@" -> ./src (used broadly across code)
  - Dev-only plugin lovable-tagger is optional; missing dependency is handled gracefully
- Capacitor: capacitor.config.ts
  - appId: com.scribe.com, appName: Text Wizard, webDir: dist
- ESLint: eslint.config.js (typescript-eslint + react hooks/refresh)
- Tailwind: tailwind.config.ts with content globs over ./src/**/*.{ts,tsx} and additional paths

Node/npm:
- Use Node 18+ (Vite 5 requirement) and npm 9+
- Install once: npm ci (preferred for locked env) or npm i

Local web development:
- Start dev server (IPv6 host, 8080):
  - npm run dev
  - Access via http://localhost:8080 (or http://[::1]:8080). If IPv6 binding is an issue, adjust server.host in vite.config.ts to "127.0.0.1"
- Type checks run via the TS compiler; hot reload provided by Vite

Production build:
- Web bundle: npm run build (or npm run build:dev for a development-mode bundle)
- Preview local build: npm run preview

Android (Capacitor) build pipeline:
- One-time (if platform missing): npx cap add android
- Each build/update cycle:
  1) npm run build
  2) npx cap sync android
  3) npx cap open android (opens Android Studio)
  4) In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
- See BUILD_APK.md for the detailed, already validated process, signing flow, and troubleshooting. The canonical steps there are the source of truth.

Android signing and variants:
- Debug APK: android/app/build/outputs/apk/debug/app-debug.apk
- Release build: use Generate Signed Bundle / APK in Android Studio, per BUILD_APK.md

Known Android/Clipboard specifics:
- Clipboard behavior varies across OEM/Android versions. Review CLIPBOARD_FIX.md for permissions, fallbacks, and supported methods. The app includes a defensive clipboard implementation in src/lib/clipboard (referenced from components).


## 2) Testing

Current status:
- No test runner is currently configured in package.json. For true unit/integration testing aligned with Vite + React + TS, Vitest + @testing-library/react is recommended.

What we validated now (smoke):
- A minimal Node-based smoke test was executed locally to demonstrate a no-dependency test run workflow. The temporary test file was removed after the run to keep the repo clean, as requested.

Recommended setup (Vitest):
- Add dependencies (example versions known to work with Vite 5 / React 18):
  - npm i -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
- Add script(s) to package.json:
  - "test": "vitest"
  - "test:watch": "vitest --watch"
  - "test:coverage": "vitest run --coverage"
- Optional Vitest config (vitest.config.ts) — Vitest understands Vite aliases out of the box when using defineConfig from vite. A minimal example:
  
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  
  export default defineConfig({
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./test/setup.ts'],
    },
  });
  
- Example test setup file (test/setup.ts):
  
  import '@testing-library/jest-dom';
  
- Example unit test (src/utils/string.test.ts):
  
  import { describe, it, expect } from 'vitest';
  import { removeExtraSpaces } from '@/utils/strings';
  
  describe('removeExtraSpaces', () => {
    it('collapses and trims spaces', () => {
      expect(removeExtraSpaces('  a   b  ')).toBe('a b');
    });
  });
  
- Running tests:
  - npm run test (watch mode) or npm run test:coverage

Where to place tests:
- Co-locate near the code under src/**, using .test.ts/.test.tsx filenames. Keep business logic in small pure helpers where possible (e.g., src/utils/*) to improve testability away from UI.

Guidance for adding tests:
- Prefer testing pure transformations (formatting, parsing, counters) separately from UI.
- For React components, use Testing Library with JSDOM environment. Keep tests resilient by querying roles/labels instead of brittle selectors.
- For logic embedded in components (e.g., Editor actions), consider extracting reusable helpers into src/lib or src/utils to enable headless tests.

Running a quick smoke test without installing tools (what we did):
- Create a temporary .mjs file with assertions and run node path\to\file.mjs
- Remove the temporary file afterwards to keep the repo clean
- This pattern is useful for quick verification during CI prototyping but is not a substitute for a test suite


## 3) Additional Development Information

Code style:
- ESLint is configured via eslint.config.js. Notable rules:
  - React Hooks plugin recommended rules are enforced
  - react-refresh/only-export-components warns
  - @typescript-eslint/no-unused-vars is disabled (noise reduction for WIP)
- Run lint: npm run lint
- TypeScript target is managed by tsconfig.json/tsconfig.app.json; prefer strict types for new modules even if legacy areas are more relaxed

Project structure and aliasing:
- Use the "@" alias for imports from src/, e.g., import { Editor } from '@/components/Editor'
- Common locations:
  - src/components/* — UI components (Editor, History, SunoEditor, etc.)
  - src/hooks/* — custom hooks (e.g., use-app-context.ts, use-mobile-optimization)
  - src/lib/* — utilities like storage, clipboard
  - public/ — static assets

Tailwind:
- Tailwind is enabled globally; see tailwind.config.ts for custom theme tokens (colors, gradients, animations). Ensure JIT can find your templates: keep files within content globs.
- Prefer semantic class composition. For complex, re-used patterns, factor helpers into components.

Mobile-first and performance:
- Components adapt to mobile devices (see use-mobile-optimization hook) and often toggle condensed/expanded toolbars.
- Keep expensive computations (e.g., statistics, large regex replace) off the render path using useMemo/useCallback and schedule work if needed.
- Avoid over-render by splitting components and using stable keys.

Clipboard and permissions:
- Use the clipboard utility in src/lib/clipboard instead of direct navigator.clipboard to leverage fallbacks and consistent error handling.
- On Android, ensure proper permissions and test on real devices; refer to CLIPBOARD_FIX.md.

Android/Capacitor notes:
- Any change to web code that affects native integration requires npx cap sync android before testing natively.
- Keep appId/appName consistent across capacitor.config.ts and Android resources. Update versionCode/versionName in android/app/build.gradle prior to releases (see BUILD_APK.md).

Dev server access on devices:
- Vite default host is "::"; to test on a phone via LAN, ensure your PC firewall allows port 8080 and use your machine’s IPv4 address. If needed, set server.host: '0.0.0.0' in vite.config.ts.

Icon pipeline:
- There are helper scripts (generate_icon.py, distribute_icons.py, etc.). Follow ICON_SETUP.md if present; verify assets land under android/app/src/main/res/mipmap-*.

Release checklist:
- Build web → sync → Android Studio build (debug or signed release)
- Verify clipboard, editor functions, and icons on-device (see BUILD_APK.md checklist)


## 4) Quick Commands Reference
- Install deps: npm ci
- Dev server: npm run dev (http://localhost:8080)
- Lint: npm run lint
- Build web: npm run build
- Preview built app: npm run preview
- Sync to Android: npx cap sync android
- Open Android Studio: npx cap open android


## 5) Notes on This Document and Validation
- The sample “test run” was performed using a temporary Node smoke test to avoid adding persistent test dependencies. It passed and was then removed as per the requirement to keep only this guidelines file.
- For a real test suite, adopt Vitest as outlined above; it integrates best with Vite and supports TS, JSX, and JSDOM.
