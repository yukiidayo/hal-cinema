import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { useLogin } from "~/features/auth/useLogin"

export function LoginForm() {
  const { email, setEmail, error, loading, handleSubmit } = useLogin()

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
          autoComplete="email"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "送信中..." : "認証コードを送信"}
        </Button>
      </form>
    </div>
  )
}
