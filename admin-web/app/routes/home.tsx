export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black text-gray-900">HAL Cinema Admin</h1>
      <p className="mt-3 text-sm text-gray-600">
        管理画面のルート構成を業務単位で整理しました。ログイン後は各管理機能へ遷移します。
      </p>
      <div className="mt-8 flex gap-3">
        <a href="/login" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">ログインへ</a>
        <a href="/admin" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800">管理トップへ</a>
      </div>
    </main>
  );
}
