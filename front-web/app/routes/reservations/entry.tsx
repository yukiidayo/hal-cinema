import { useState } from "react"
import { LoginForm } from "~/features/auth/components/LoginForm"
import { RegisterForm } from "~/features/auth/components/RegisterForm"
import { useEntry } from "~/features/reservation/useEntry"

export default function EntryPage() {
    const { handleGuest } = useEntry()
    const [mode, setMode] = useState<"login" | "register">("login")

    return (
        <div className="py-12 max-w-xl mx-auto px-4">
            <div className="text-center mb-10">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Step 2 / 5</p>
                <h1 className="text-3xl font-black tracking-tight">予約方法の選択</h1>
                <p className="mt-2 text-sm text-muted-foreground">会員の方はログインすると、スムーズに予約いただけます。</p>
            </div>

            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                {/* タブ切り替え */}
                <div className="flex border-b border-border bg-muted/30">
                    <button
                        onClick={() => setMode("login")}
                        className={`flex-1 py-4 text-sm font-bold transition-all ${
                            mode === "login" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        ログイン
                    </button>
                    <button
                        onClick={() => setMode("register")}
                        className={`flex-1 py-4 text-sm font-bold transition-all ${
                            mode === "register" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        新規会員登録
                    </button>
                </div>

                <div className="p-8">
                    {mode === "login" ? (
                        <LoginForm onGuestContinue={handleGuest} />
                    ) : (
                        <RegisterForm />
                    )}
                </div>

                <div className="border-t border-border bg-muted/10 p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        ※会員登録すると予約の確認・キャンセルがより簡単になります。
                    </p>
                </div>
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={handleGuest}
                    className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <span>ゲストとして予約を続ける</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
