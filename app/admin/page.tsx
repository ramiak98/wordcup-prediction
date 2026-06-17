import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getTeamsSafe } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const teams = await getTeamsSafe();
  return <AdminDashboard teams={teams} />;
}
