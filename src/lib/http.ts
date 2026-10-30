import type { NextRequest } from "next/server";

/** Parse a JSON request body, returning undefined when it is missing or malformed. */
export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
