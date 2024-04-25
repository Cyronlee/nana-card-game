import { kv } from "@vercel/kv";

export async function GET() {
  let page1 = await kv.get("page-visit:1");

  setTimeout(() => {
    kv.incr("page-visit:1");
  }, 10);

  return Response.json({ data: page1 });
}

export const runtime = "nodejs";
export const fetchCache = "force-no-store";
