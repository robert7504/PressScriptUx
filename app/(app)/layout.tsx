import AppShell from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return <AppShell user={user}>{children}</AppShell>;
}
