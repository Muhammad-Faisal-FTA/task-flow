export function buildAppUrl(
  pathname: string,
  query: Record<string, string | undefined>,
  baseUrl?: string,
): string {
  const rawBase = baseUrl || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const normalizedBase = rawBase.replace(/\/$/, "");
  const hasProtocol = /^https?:\/\//i.test(normalizedBase);
  const baseWithProtocol = hasProtocol ? normalizedBase : `https://${normalizedBase}`;
  const url = new URL(pathname, `${baseWithProtocol}/`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}
