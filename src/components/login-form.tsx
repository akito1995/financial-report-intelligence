"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage("Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Không thể kết nối hệ thống đăng nhập. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-cyan-50">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="glass-control h-12 w-full rounded-2xl px-4 text-sm text-white outline-none placeholder:text-cyan-50/45 focus:cyan-glow"
          placeholder="Nhập email làm việc"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-cyan-50">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="glass-control h-12 w-full rounded-2xl px-4 text-sm text-white outline-none placeholder:text-cyan-50/45 focus:cyan-glow"
          placeholder="Nhập mật khẩu"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200/30 bg-red-500/15 px-4 py-3 text-sm text-red-50">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="cyan-glow flex h-12 w-full items-center justify-center rounded-2xl border border-cyan-100/35 bg-cyan-300/20 px-5 text-sm font-semibold text-white transition hover:bg-cyan-300/28 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
