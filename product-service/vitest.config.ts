import {defineConfig} from "vitest/config";
import { loadEnv } from 'vite'

export default defineConfig({
    test: {
        setupFiles: ['./test/bootstrap.ts'],
        env: loadEnv('test', process.cwd(), ''),
    }
})