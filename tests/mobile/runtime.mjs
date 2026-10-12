/** Real local API/Auth browser smoke for the native component tree. Never runs against remote services. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
const root = path.resolve(import.meta.dirname, "../..");
const backend = process.env.ADEQUATE_TEST_URL || "http://127.0.0.1:3100",
  origin = "http://127.0.0.1:8770",
  supabaseUrl = "http://127.0.0.1:54321";
const artifact = "/tmp/adequate-mobile-runtime";
assert.equal(new URL(backend).hostname, "127.0.0.1", "Runtime smoke only permits the isolated local API");
const pairs = (await fs.readFile("/tmp/adequate-local.env", "utf8"))
  .trim()
  .split("\n")
  .map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1)];
  });
const local = Object.fromEntries(pairs);
const admin = createClient(supabaseUrl, local.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const password = "Isolated-local-fixture-42!",
  email = `mobile-${Date.now()}@example.test`;
const fixture = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
assert.ifError(fixture.error);
const userId = fixture.data.user.id;
let server, browser, page;
const report = {
  environment: "local-only",
  device: "Chromium react-native-web at 390px; not a physical native device",
  checks: [],
  pageErrors: [],
};
try {
  if (process.env.ADEQUATE_MOBILE_SKIP_EXPORT !== "true") execFileSync(
    process.execPath,
    [
      path.join(root, "apps/mobile/node_modules/expo/bin/cli"),
      "export",
      "--clear",
      "--platform",
      "web",
      "--output-dir",
      artifact,
    ],
    {
      cwd: path.join(root, "apps/mobile"),
      env: {
        ...process.env,
        EXPO_PUBLIC_API_URL: origin,
        EXPO_PUBLIC_SUPABASE_URL: origin + "/supabase",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.ANON_KEY,
        EXPO_PUBLIC_ALLOW_INSECURE_LOCAL_DEV: "true",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith("/api/") || req.url.startsWith("/supabase/")) {
        const body = [];
        for await (const part of req) body.push(part);
        const isAuth = req.url.startsWith("/supabase/");
        const upstream = isAuth ? supabaseUrl : backend;
        const upstreamPath = isAuth ? req.url.slice("/supabase".length) : req.url;
        const headers = { ...req.headers, host: undefined, origin: upstream };
        delete headers.host;
        delete headers["content-length"];
        delete headers.connection;
        const response = await fetch(upstream + upstreamPath, {
          method: req.method,
          headers,
          body: body.length ? Buffer.concat(body) : undefined,
        });
        res.statusCode = response.status;
        res.setHeader(
          "content-type",
          response.headers.get("content-type") ?? "application/json",
        );
        res.setHeader("cache-control", "no-store");
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
      }
      const relative = decodeURIComponent(new URL(req.url, origin).pathname),
        target = path.resolve(
          artifact,
          "." + (relative === "/" ? "/index.html" : relative),
        );
      if (!target.startsWith(artifact + path.sep)) {
        res.statusCode = 400;
        res.end();
        return;
      }
      const mime =
        {
          ".html": "text/html",
          ".js": "application/javascript",
          ".ttf": "font/ttf",
          ".json": "application/json",
        }[path.extname(target)] ?? "application/octet-stream";
      res.setHeader("content-type", mime);
      res.end(await fs.readFile(target));
    } catch {
      res.statusCode = 500;
      res.end("Local test harness request failed.");
    }
  });
  await new Promise((resolve) => server.listen(8770, "127.0.0.1", resolve));
  browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page
    .getByRole("textbox", {
      name: "Password · at least 12 characters",
      exact: true,
    })
    .fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("heading", { name: "Today", exact: true })
    .waitFor({ timeout: 20000 });
  await page.getByText("Community · disabled", { exact: true }).waitFor();
  await page.screenshot({
    path: "/tmp/adequate-design-audit/mobile-today-runtime.png",
  });
  report.checks.push(
    "Native bearer login, approved Today home-base and disabled community",
  );
  await page.getByRole("tab", { name: "Reflections", exact: true }).click();
  const editor = page.getByRole("textbox", {
    name: "Your reflection",
    exact: true,
  });
  await editor.waitFor();
  await editor.fill("Private mobile acceptance reflection");
  await page
    .getByRole("button", { name: "Save reflection", exact: true })
    .click();
  await page
    .getByText("Private mobile acceptance reflection", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Edit reflection", exact: true })
    .click();
  await editor.fill("Private mobile acceptance reflection edited");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByText("Private mobile acceptance reflection edited", { exact: true })
    .waitFor();
  report.checks.push("Reflection created and edited through real local API");
  await page.route("**/api/**", (route) => route.abort());
  await editor.fill("Unfinished disconnected mobile reflection");
  await page
    .getByRole("button", { name: "Save reflection", exact: true })
    .click();
  await page
    .getByText(
      "Connection unavailable. Your unfinished reflection stays on this device.",
      { exact: true },
    )
    .waitFor();
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await page.getByRole("tab", { name: "Reflections", exact: true }).click();
  await assert.doesNotReject(async () => {
    assert.equal(
      await editor.inputValue(),
      "Unfinished disconnected mobile reflection",
    );
  });
  await page.unroute("**/api/**");
  await page
    .getByRole("button", { name: "Save reflection", exact: true })
    .click();
  await page
    .getByText("Unfinished disconnected mobile reflection", { exact: true })
    .waitFor();
  report.checks.push(
    "Disconnected save retains account draft across screen remount and reconnect manually submits",
  );
  await page.getByText("Unfinished disconnected mobile reflection", {exact:true}).locator("..").getByRole("button", {name:"Delete reflection",exact:true}).click();
  await page
    .getByRole("button", { name: "Confirm reflection deletion", exact: true })
    .click();
  await page
    .getByText("Unfinished disconnected mobile reflection", { exact: true })
    .waitFor({ state: "detached" });
  report.checks.push("Reflection deletion persists");
  await page.getByRole("tab", { name: "Preferences", exact: true }).click();
  await page.getByRole("button", { name: "light", exact: true }).click();
  await page
    .getByRole("button", { name: "light · selected", exact: true })
    .waitFor();
  await page
    .getByRole("switch", { name: "Consent to analytics", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Consent to analytics", exact: true })
    .waitFor();
  await page.getByRole("tab", { name: "Reflections", exact: true }).click();
  await editor.fill("Private text must disappear on logout");
  await page.getByRole("tab", { name: "Preferences", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("textbox", { name: "Email", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page
    .getByRole("textbox", {
      name: "Password · at least 12 characters",
      exact: true,
    })
    .fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Today", exact: true }).waitFor();
  await page.getByRole("tab", { name: "Reflections", exact: true }).click();
  assert.equal(await editor.inputValue(), "");
  await page
    .getByText("Private mobile acceptance reflection edited", { exact: true })
    .waitFor();
  report.checks.push(
    "Preferences/consent requests, logout clears private local draft, sign-in restores saved server reflection",
  );
  assert.deepEqual(report.pageErrors, []);
  await page.screenshot({
    path: "/tmp/adequate-design-audit/mobile-reflections-runtime.png",
  });
  await fs.writeFile(
    "/tmp/adequate-design-audit/mobile-runtime-report.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  if (page) {
    await page.screenshot({
      path: "/tmp/adequate-design-audit/mobile-runtime-failure.png",
    });
    console.log((await page.locator("body").innerText()).slice(0, 650));
  }
  console.log("Page error count", report.pageErrors.length);
  throw error;
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await admin.auth.admin.deleteUser(userId);
}
