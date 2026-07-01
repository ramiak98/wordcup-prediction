import { AdminMatches } from "@/components/admin/admin-matches";
import { getTeamsSafe } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const teams = await getTeamsSafe();
  return <AdminMatches teams={teams} />;
}
