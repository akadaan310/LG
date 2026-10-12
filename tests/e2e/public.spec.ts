import {test,expect} from '@playwright/test';

const routes=[['/','public.home@v2'],['/story','public.story@v2'],['/principle','public.principle@v1'],['/listen','public.listen@v1'],['/membership','public.membership@v1']] as const;
for(const width of [360,390,820,1440]){
  test(`approved public structures are accessible at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    for(const [path,marker] of routes){
      await page.goto(path);
      await expect(page.locator(`[data-approved-screen="${marker}"]`)).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('Maya');
      await expect(page.locator('body')).not.toContainText('$8');
      const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left< -2);}).map(el=>`${el.tagName}.${el.className}`));
      expect(overflow).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('principle rings support keyboard selection and missing audio stays unavailable',async({page})=>{
 await page.goto('/principle');
 const first=page.getByRole('tab',{name:'Ring 01'});await first.focus();await page.keyboard.press('ArrowRight');
 await expect(page.getByRole('tab',{name:'Ring 02'})).toHaveAttribute('aria-selected','true');
 await page.goto('/listen');await expect(page.getByRole('button',{name:'Playback unavailable: no approved recording'})).toBeDisabled();
});

test('exact hybrid palette and licensed typography are applied',async({page})=>{
 await page.goto('/');
 const styles=await page.evaluate(()=>{const s=getComputedStyle(document.body);return {background:s.backgroundColor,font:s.fontFamily};});
 expect(styles.background).toBe('rgb(10, 13, 22)');expect(styles.font).toContain('Space Grotesk');
});

test('cookie mutation rejects cross-site request and signup gate is explicit',async({request})=>{
 const response=await request.post('/api/reflections',{headers:{Origin:'https://attacker.example'},data:{body:'private'}});
 expect(response.status()).toBe(403);
 const session=await request.get('/api/session');expect(session.status()).toBe(200);
 const payload=await session.json();expect(payload.data).toHaveProperty('configured');
});
