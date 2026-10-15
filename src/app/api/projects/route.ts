import { NextRequest, NextResponse } from "next/server";
import { store, SEED_PROJECTS } from "@/lib/data/store";
import { ResearchProject } from "@/types";

export async function GET() {
  try {
    const projects = store.getProjects();
    return NextResponse.json({ projects: projects.length > 0 ? projects : SEED_PROJECTS });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, research_question, description } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    const newProject: ResearchProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: "usr_researcher_01",
      title: title.trim(),
      research_question: research_question ? research_question.trim() : null,
      description: description ? description.trim() : null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      papers_count: 0,
      notes_count: 0,
    };

    store.saveProject(newProject);
    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

    store.deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
