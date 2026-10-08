// Minimal Chrome DevTools Protocol driver (Node 22+, no dependencies).
// Launches headless Brave/Chrome/Edge and exposes send()/navigate()/shot().
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BROWSERS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333 } = {}) {
  const { existsSync } = await import('node:fs');
  const bin = BROWSERS.find((b) => existsSync(b));
  if (!bin) throw new Error('No Chromium-based browser found');
  const profile = mkdtempSync(join(tmpdir(), 'occasio-cdp-'));
  const proc = spawn(
    bin,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let targets;
  for (let i = 0; i < 50; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      if (targets.length) break;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  const page = targets?.find((t) => t.type === 'page');
  if (!page) throw new Error('Browser did not expose a page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}`));
      else resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach((l) => l(msg));
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const myId = ++id;
      pending.set(myId, { resolve, reject });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description ?? 'eval failed');
    }
    return r.result.value;
  };

  const viewport = (width, height, dpr = 3, mobile = true) =>
    send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile,
    });

  const navigate = async (url, settle = 1500) => {
    let loaded;
    const done = new Promise((r) => (loaded = r));
    const l = (m) => m.method === 'Page.loadEventFired' && loaded();
    listeners.push(l);
    await send('Page.navigate', { url });
    await Promise.race([done, sleep(20000)]);
    listeners.splice(listeners.indexOf(l), 1);
    await sleep(settle);
  };

  const shot = async (file, { clip, transparent = false } = {}) => {
    if (transparent) {
      await send('Emulation.setDefaultBackgroundColorOverride', {
        color: { r: 0, g: 0, b: 0, a: 0 },
      });
    }
    const r = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
      ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
    });
    writeFileSync(file, Buffer.from(r.data, 'base64'));
    if (transparent) await send('Emulation.setDefaultBackgroundColorOverride', {});
  };

  const close = async () => {
    await Promise.race([send('Browser.close').catch(() => {}), sleep(1500)]);
    proc.kill();
    ws.close();
  };

  const mouse = (type, x, y) =>
    send('Input.dispatchMouseEvent', {
      type,
      x,
      y,
      button: type === 'mouseMoved' ? 'none' : 'left',
      buttons: type === 'mouseReleased' || type === 'mouseMoved' ? 0 : 1,
      clickCount: type === 'mouseMoved' ? 0 : 1,
    });
  /** Real pointer tap at CSS-pixel coordinates. */
  const tap = async (x, y, holdMs = 60) => {
    await mouse('mouseMoved', x, y);
    await mouse('mousePressed', x, y);
    await sleep(holdMs);
    await mouse('mouseReleased', x, y);
  };
  /** Center of the first element matching the selector, in CSS px. */
  const center = (sel) =>
    evaluate(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2, w:r.width, h:r.height} })()`);

  return { send, evaluate, viewport, navigate, shot, sleep, close, tap, mouse, center };
}
