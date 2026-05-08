import { useState } from "react";
import { useNavigate } from "react-router";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    navigate("/admin", { replace: true });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-black text-gray-900">管理者ログイン</h1>
      <form onSubmit={handleLogin} className="mt-8 space-y-4 rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-bold text-gray-700">
          メールアドレス
          <input
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@hal-cinema.example"
          />
        </label>
        <label className="block text-sm font-bold text-gray-700">
          パスワード
          <input
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>
        <button className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white" type="submit">
          ログイン
        </button>
      </form>
    </main>
  );
}
