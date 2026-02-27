/**
 * Test setup — registers ESM loader hooks before any app modules load.
 * Invoked via: npx tsx --import ./scripts/test-setup.ts scripts/test-harmonization.ts
 */
import { register } from 'node:module'
register('./test-loader.ts', import.meta.url)
