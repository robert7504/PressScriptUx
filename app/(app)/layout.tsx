import AppShell from "@/components/AppShell";
import { isApiDebugEnabled } from "@/lib/api/debug";
import { getSessionUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <AppShell user={user} apiDebug={isApiDebugEnabled()}>
      {children}
    </AppShell>
  );
}
