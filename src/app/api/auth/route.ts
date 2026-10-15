import { NextRequest, NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase/server";
import { store, DEFAULT_USER } from "@/lib/data/store";

export async function GET() {
  try {
    const supabase = await createServerSideClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            institution: user.user_metadata?.institution || null,
            research_field: user.user_metadata?.research_field || null,
          },
        });
      }
    }
    // Resilient local user session fallback
    return NextResponse.json({ user: DEFAULT_USER });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, full_name, institution, research_field } = body;

    const supabase = await createServerSideClient();

    if (action === "signup") {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name, institution, research_field },
          },
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ user: data.user, session: data.session });
      }

      // Offline / Local Session creation
      const newUser = {
        id: `usr_${Date.now()}`,
        email,
        full_name: full_name || "Research Scholar",
        institution: institution || "Academic Institution",
        research_field: research_field || "Interdisciplinary Research",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.setUser(newUser);
      return NextResponse.json({ user: newUser });
    }

    if (action === "login") {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ user: data.user, session: data.session });
      }

      // Local login fallback
      const user = {
        ...DEFAULT_USER,
        email: email || DEFAULT_USER.email,
      };
      store.setUser(user);
      return NextResponse.json({ user });
    }

    if (action === "logout") {
      if (supabase) {
        await supabase.auth.signOut();
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
