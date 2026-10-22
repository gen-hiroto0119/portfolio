import { Hono } from "hono";
import { jsx } from "hono/jsx";

import pages from "./pages";
import publishing from "./feature/publishing";
import media from "./feature/media";
import { Layout } from "./pages/layout";
import NotFoundPage from "./pages/not-found";
import ErrorPage from "./pages/error";

const app = new Hono();

app.use(async (c, next) => {
  await next();
  // Every content response reads the current snapshot; no second cache to invalidate.
  c.header("Cache-Control", "private, no-store");
  c.header("X-Content-Type-Options", "nosniff");
});

app.route("/api/notion", publishing);
app.route("/media", media);
app.route("/", pages);

app.notFound((c) => {
  if (c.req.path.startsWith("/api/") || c.req.path.startsWith("/media/")) {
    return c.json({ error: "Not Found" }, 404);
  }
  return c.html(
    jsx(
      Layout,
      { path: "/", title: "ページが見つかりませんでした", noindex: true },
      jsx(NotFoundPage, {}),
    ),
    404,
  );
});

app.onError((error, c) => {
  // Avoid logging requests: webhook URLs contain a secret.
  console.error("Request failed", error.name);
  if (c.req.path.startsWith("/api/") || c.req.path.startsWith("/media/")) {
    return c.json({ error: "Service unavailable" }, 503);
  }
  const path = c.req.path.startsWith("//") ? "/" : c.req.path;
  if (path !== "/" && !path.startsWith("/blog"))
    return c.text("Service unavailable", 503);
  return c.html(
    jsx(
      Layout,
      { path, title: "読み込みに失敗しました", noindex: true },
      jsx(ErrorPage, { path }),
    ),
    503,
  );
});

export default app;
