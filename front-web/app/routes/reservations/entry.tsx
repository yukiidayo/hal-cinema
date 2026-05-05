import {Link} from "react-router"
import {Button} from "~/shared/ui/Button"
import {useEntry} from "~/features/reservation/useEntry"

export default function EntryPage() {
    const {handleGuest} = useEntry()

    return (
        <div className="py-12 max-w-md mx-auto">
            <p className="mb-2 text-xs text-gray-400">日付・時間・座席 → お客様情報 → 券種選択 → 確認 → 決済</p>
            <h1 className="mb-6 text-2xl font-bold">予約を続けるには</h1>

            <div className="flex flex-col gap-3">
                <Link to="/login?redirect=/reservations/customer">
                    <Button size="lg" className="w-full" variant="primary">ログインして予約</Button>
                </Link>
                <Link to="/register?redirect=/reservations/customer">
                    <Button size="lg" className="w-full" variant="secondary">新規会員登録して予約</Button>
                </Link>
                <button onClick={handleGuest}
                        className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 transition">
                    ゲストとして続行（メールアドレスのみ）
                </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
                会員登録すると予約の確認・キャンセルがより簡単になります。
            </p></div>
    )
}
