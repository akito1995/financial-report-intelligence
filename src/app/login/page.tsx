import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="workspace-background relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,8,14,0.34)_78%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col rounded-[36px] border border-cyan-100/35 bg-slate-950/18 p-5 shadow-[0_0_42px_rgba(126,231,255,0.22)] backdrop-blur-md">
        <Link
          href="/"
          className="w-fit px-2 text-xl font-semibold tracking-[0.34em] text-cyan-100 drop-shadow-[0_0_10px_rgba(111,231,255,0.8)]"
          aria-label="Trang chủ Financial Report Intelligence"
        >
          FRI
        </Link>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="glass-panel w-full max-w-md rounded-[28px] p-6 sm:p-8">
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/72">
                Đăng nhập hệ thống
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Financial Report Intelligence</h1>
              <p className="mt-3 text-sm leading-6 text-cyan-50/72">
                Đăng nhập để truy cập khu vực phân tích báo cáo tài chính và quản lý dữ liệu làm việc.
              </p>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
