import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e',timeout:45000,fullyParallel:false,
 reporter:[['list'],['json',{outputFile:'test-results/e2e.json'}]],
 use:{baseURL:process.env.ADEQUATE_TEST_URL || 'http://127.0.0.1:3100',headless:true,launchOptions:{executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'},trace:'retain-on-failure'},
 webServer:process.env.ADEQUATE_TEST_URL?undefined:{command:'npm run product:start',url:'http://127.0.0.1:3100',reuseExistingServer:!process.env.CI,timeout:90000},
});
