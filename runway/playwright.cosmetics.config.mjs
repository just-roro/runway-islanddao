import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',testMatch:'cosmetics42.spec.ts',timeout:180000,workers:1,outputDir:'reports/cosmetics42/browser',reporter:[['list'],['json',{outputFile:'reports/cosmetics42/browser-results.json'}]],use:{baseURL:'http://127.0.0.1:5180',video:'on',screenshot:'only-on-failure',trace:'retain-on-failure'},projects:[
 {name:'chromium-mobile',use:{...devices['Pixel 7'],browserName:'chromium',launchOptions:{args:['--use-angle=metal','--enable-webgl']}}},
 {name:'webkit-iphone13',use:{...devices['iPhone 13'],browserName:'webkit'}},
 {name:'chromium-desktop',use:{browserName:'chromium',viewport:{width:1440,height:900},launchOptions:{args:['--use-angle=metal','--enable-webgl']}}},
 {name:'webkit-desktop',use:{browserName:'webkit',viewport:{width:1440,height:900}}}
]});
