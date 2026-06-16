import { AdminDashboard } from "@/components/admin/AdminDashboard";

type AdminPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { tab } = await searchParams;
  return <AdminDashboard initialTab={tab} />;
}
