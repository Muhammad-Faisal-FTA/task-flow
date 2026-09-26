import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "./authMiddleware";
import type { AccessTokenPayload } from "@/types/auth";

type Context = { params: Promise<Record<string, string>> };
type Handler = (request: NextRequest, context: Context, user: AccessTokenPayload) => Promise<NextResponse>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidObjectId(value: unknown): boolean { return typeof value === "string" && UUID.test(value); }
export function validateObjectId(key: string, handler: Handler): Handler { return async (request, context, user) => isValidObjectId((await context.params)[key]) ? handler(request, context, user) : NextResponse.json({ error: `Invalid ${key} format.` }, { status: 400 }); }
export function validateObjectIds(keys: string[], handler: Handler): Handler { return async (request, context, user) => { const params = await context.params; const invalid = keys.find((key) => !isValidObjectId(params[key])); return invalid ? NextResponse.json({ error: `Invalid ${invalid} format.` }, { status: 400 }) : handler(request, context, user); }; }
export function withAuthAndId(key: string, handler: Handler) { return withAuth(validateObjectId(key, handler)); }
export function withAuthAndIds(keys: string[], handler: Handler) { return withAuth(validateObjectIds(keys, handler)); }
