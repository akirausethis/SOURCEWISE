import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/data/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const paperId = resolvedParams.id;

    if (!paperId) {
      return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
    }

    const paper = store.getPaper(paperId);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const pages = store.getPages(paperId);
    const chunks = store.getChunks(paperId);

    return NextResponse.json({
      paper,
      pages,
      chunks,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
