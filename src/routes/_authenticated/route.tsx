import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { HabitsProvider } from "@/context/HabitsContext";
import { AppShell } from "@/components/AppShell";
import { ImportPrompt } from "@/components/ImportPrompt";
import { InstallBanner } from "@/components/pwa/InstallBanner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <HabitsProvider>
      <AppShell>
        <Outlet />
      </AppShell>
      <ImportPrompt />
      <InstallBanner />
    </HabitsProvider>
  );
}
