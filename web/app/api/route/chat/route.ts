import { NextResponse } from "next/server";
import { answerRouteQuestion, type RouteChatInput } from "@/lib/route-detail/route-chat";

export async function POST(request: Request) {
  let body: RouteChatInput;
  try {
    body = (await request.json()) as RouteChatInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.question?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing question." }, { status: 400 });
  }

  if (!body.route?.urlPath) {
    return NextResponse.json({ ok: false, error: "Missing route context." }, { status: 400 });
  }

  const { answer, provider } = await answerRouteQuestion(body);
  return NextResponse.json({ ok: true, answer, provider });
}
