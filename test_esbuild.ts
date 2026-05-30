import puppeteer from 'puppeteer';
declare var __name: any;
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    (window as any).__name = (f: any, n: any) => Object.defineProperty(f, 'name', { value: n || f?.name, configurable: true });
  });

  await page.goto('about:blank');

  const result = await page.evaluate(() => {
    // simulate esbuild's injection behavior:
    const myfunc = __name(() => "hello", "myfunc");
    return myfunc();
  });
  console.log("Result:", result);
  await browser.close();
})();
