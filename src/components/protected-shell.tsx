import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "./app-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProtectedShellProps = {
  children: ReactNode;
};

export async function ProtectedShell({ children }: ProtectedShellProps) {
  let email: string | undefined;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    email = user.email ?? undefined;
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    redirect("/login");
  }

  return <AppShell userEmail={email}>{children}</AppShell>;
}
