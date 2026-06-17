import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users_predictions")
      .select("id,full_name,predictions,total_points,created_at")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Prediction not found." }, { status: 404 });
    }

    return NextResponse.json({ prediction: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load prediction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
