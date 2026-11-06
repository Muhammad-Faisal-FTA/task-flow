import { NextRequest, NextResponse } from "next/server";

/** Proxies admin API calls server-side and reports missing backend configuration as JSON. */
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const backend = process.env.TASKFLOW_API_URL?.replace(/\/$/, "");
  if (!backend) return NextResponse.json({ error: "TASKFLOW_API_URL is unavailable to the admin app. Put it in the repository-root .env or set it in the admin deployment environment, then restart the admin app." }, { status: 503 });

  const { path } = await context.params;
  const target = new URL(`${backend}/api/${path.map(encodeURIComponent).join("/")}`);
  target.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const refreshCookie = request.cookies.get("tf_refresh_token")?.value;
  if (refreshCookie) headers.set("cookie", `tf_refresh_token=${refreshCookie}`);

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    const responseHeaders = new Headers({
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("set-cookie", setCookie);
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ error: "Cannot reach TaskFlow backend. Check TASKFLOW_API_URL and backend availability." }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
