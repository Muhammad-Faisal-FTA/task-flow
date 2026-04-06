// app/api/lists/[listId]/tasks/route.ts
// GET /api/lists/:listId/tasks — get all tasks belonging to a specific list

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndId } from "@/middlewares/validateObjectId";
import { isValidObjectId } from "@/middlewares/validateObjectId";
import {
  getUserTasks,
  getUserLists,
  resolveTaskError,
} from "@/services/taskService";
import type { AccessTokenPayload } from "@/types/auth";

export const runtime = "nodejs";

// ─── GET /api/lists/:listId/tasks ─────────────────────────────────────────────
const getHandler = async (
  req:  NextRequest,
  ctx:  { params: Promise<Record<string, string>> },
  user: AccessTokenPayload
): Promise<NextResponse> => {
  try {
    const { listId } = await ctx.params;
    const { searchParams } = req.nextUrl;

    // Parse query params
    const grouped          = searchParams.get("grouped")          !== "false";
    const includeCompleted = searchParams.get("includeCompleted") !== "false";
    const search           = searchParams.get("search")           ?? undefined;

    // 1. Verify list belongs to user before fetching tasks
    //    Prevents user from probing other users' list IDs
    const lists      = await getUserLists(user.userId);
    const listExists = lists.some((l) => l.id === listId);

    if (!listExists) {
      return NextResponse.json(
        { error: "List not found." },
        { status: 404 }
      );
    }

    // 2. Fetch tasks filtered by listId
    const tasks = await getUserTasks(user.userId, {
      listId,
      grouped,
      includeCompleted,
      search,
    });

    // 3. Find list metadata to include in response
    const list = lists.find((l) => l.id === listId)!;

    return NextResponse.json(
      {
        data: {
          list,
          tasks,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const { status, message } = resolveTaskError(err);
    return NextResponse.json({ error: message }, { status });
  }
};

export const GET = withAuthAndId("listId", getHandler);