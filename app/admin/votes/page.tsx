import { AdminVotes } from "@/components/admin/admin-votes";
import { getTeamsSafe } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminVotesPage() {
  const teams = await getTeamsSafe();
  return <AdminVotes teams={teams} />;
}
