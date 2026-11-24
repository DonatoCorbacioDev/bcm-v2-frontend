import fs from "fs";
import path from "path";

/**
 * Every form posts (OWASP ZAP baseline, 2026-11-24). A form without a method
 * is submitted with GET when the browser sends it natively, before the page
 * hydrates or with JavaScript off: the fields, a password among them, end up
 * in the address, the browser history and the proxy's access log. The React
 * handlers still prevent the native submit once the page is live.
 */
function tsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

describe("forms", () => {
  const sources = ["app", "components"]
    .map((dir) => path.join(process.cwd(), dir))
    .filter((dir) => fs.existsSync(dir))
    .flatMap(tsxFiles);

  it("finds the application's forms", () => {
    const withForms = sources.filter((file) => /<form[\s>]/.test(fs.readFileSync(file, "utf8")));
    expect(withForms.length).toBeGreaterThanOrEqual(7);
  });

  it.each(sources)("%s: every <form> declares method=\"post\"", (file) => {
    const forms = fs.readFileSync(file, "utf8").match(/<form[\s>][^>]*>/g) ?? [];
    for (const form of forms) {
      expect(form).toMatch(/method="post"/);
    }
  });
});
