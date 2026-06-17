import { createHmac, randomUUID } from "crypto";
import { NextRequest } from "next/server";

function hashValue(value: string) {
  const secret =
    process.env.DUPLICATE_HASH_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "development-only-duplicate-secret";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function hashIp(ip: string | null) {
  return hashValue(ip || "unknown-ip");
}

export function hashUserAgent(userAgent: string | null) {
  return hashValue(userAgent || "unknown-user-agent");
}

export function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null
  );
}

export function assertAdmin(request: Request) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get("x-admin-password");

  if (!configuredPassword) {
    return {
      ok: false,
      response: Response.json(
        { error: "ADMIN_PASSWORD is not configured." },
        { status: 500 }
      )
    };
  }

  if (providedPassword !== configuredPassword) {
    return {
      ok: false,
      response: Response.json(
        { error: "Invalid admin password." },
        { status: 401 }
      )
    };
  }

  return { ok: true as const };
}

export function createFallbackToken() {
  return randomUUID();
}
