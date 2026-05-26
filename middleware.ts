export default function middleware() {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow">
  <title>Page Gone | Somken Jobs</title>
</head>
<body>
  <h1>Page Gone</h1>
  <p>This page is not available on Somken Jobs.</p>
</body>
</html>`, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: "/companies/:path*",
};
