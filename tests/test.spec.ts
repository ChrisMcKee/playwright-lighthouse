import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import { playAudit } from 'playwright-lighthouse';
import { test as base } from '@playwright/test';
import getPort from 'get-port';

export const lighthouseTest = base.extend<
    {},
    { port: number; browser: Browser }
>({
    port: [
        async ({ }, use) => {
            // Assign a unique port for each playwright worker to support parallel tests
            const port = await getPort();
            await use(port);
        },
        { scope: 'worker' },
    ],

    browser: [
        async ({ port }, use) => {
            const browser = await chromium.launch({
                args: [`--remote-debugging-port=${port}`],
            });
            await use(browser);
        },
        { scope: 'worker' },
    ],
});

lighthouseTest.describe('Lighthouse', () => {
    lighthouseTest('should pass lighthouse tests', async ({ page, port }) => {
        await page.goto('https://github.com');
        await page.waitForSelector('.footer');
        await playAudit({
            page,
            port,
            thresholds: {
                performance: 0.8,
                accessibility: 0.8,
                'best-practices': 0.8,
                seo: 0.8,
                pwa: 0.8,
            },
            reports: {
                formats: {
                    html: true,
                    json: true,
                    csv: false,
                },
                directory: 'lighthouse-reports',
                name: `lighthouse-${new Date().getTime()}`
            },
        });
    });
});