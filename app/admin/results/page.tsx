import { AdminResults } from "@/components/admin/admin-results";
import { getTeamsSafe } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const teams = await getTeamsSafe();
  return <AdminResults teams={teams} />;
}
