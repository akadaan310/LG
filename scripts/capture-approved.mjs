import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ADEQUATE_TEST_URL||'http://127.0.0.1:3200';
const folder='docs/engineering/evidence/product-baselines';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
const manifest=[];
for(const theme of ['dark','light'])for(const width of [360,390,820,1440]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 await page.addInitScript(theme=>localStorage.setItem('adequate-theme',theme),theme);
 for(const [route,variant] of [['home','v2'],['story','v2'],['principle','v1'],['listen','v1'],['membership','v1']]){
  await page.goto(base+(route==='home'?'/':'/'+route));await page.waitForFunction(()=>getComputedStyle(document.body).fontFamily.includes('Space Grotesk'));
  await page.locator('[data-approved-screen]').waitFor();await page.waitForFunction(()=>!document.body.innerText.includes('Loading…'));await page.evaluate(()=>document.fonts.ready);
  const file=`public-${route}-${variant}-${theme}-${width}.png`;await page.screenshot({path:folder+'/'+file,fullPage:true});manifest.push({file,route,variant,theme,width,status:'UNREVIEWED baseline; export provenance pending'});
 }
 await page.close();
}
await browser.close();await writeFile(folder+'/manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),notice:'Local generated baselines. Not owner visual approval and not LG content. Missing approved exports still block design acceptance.',cases:manifest},null,2)+'\n');console.log(`Captured ${manifest.length} unreviewed public baselines.`);
