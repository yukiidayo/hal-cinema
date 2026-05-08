# hal-cinema

HAL Cinema のリポジトリです。  

- `front-web` : React Router v7 フロントエンド
- `admin-web` : React Router v7 管理画面
- `back-api` : Hono バックエンド API

セットアップ手順と起動方法は `SETUP.md` を参照。

---

## back-api ディレクトリ構成

機能単位の垂直分割（modules/）を採用しています。  
handlers → service の2層構造で、service は Hono に依存しません。

```
back-api/src/
├── modules/             # 機能単位（垂直分割）
│   ├── auth/            # OTP認証・セッション
│   │   ├── index.ts     # ルート定義のみ
│   │   ├── handlers.ts  # リクエスト処理・レスポンス成形
│   │   └── service.ts   # DBロジック（Hono非依存）
│   ├── members/         # 会員プロフィール・予約履歴
│   ├── movies/          # 映画・スケジュール
│   └── reservations/    # 座席保持・予約確定・キャンセル
│
├── middleware/          # Honoミドルウェア
│   ├── session.ts       # インメモリセッション管理
│   ├── errorHandler.ts  # 統一エラーハンドリング
│   ├── auditLog.ts      # アクセスログ
│   └── requestId.ts     # リクエストID付与
│
├── lib/                 # 外部サービス連携
│   ├── email.ts         # Resend（メール送信）
│   └── errors.ts        # AppErrorクラス・エラーコード定義
│
├── utils/               # 純粋関数ユーティリティ
│   ├── format.ts        # QRコードURL・JST変換・メールマスク
│   ├── otp.ts           # OTP生成・ハッシュ化
│   ├── rateLimit.ts     # インメモリレート制限
│   └── response.ts      # 統一レスポンス形式
│
├── config/
│   └── constants.ts     # チケット料金・OTP設定・予約設定
│
├── db/
│   ├── client.ts        # MySQLコネクションプール
│   └── migrations/      # SQLマイグレーションファイル
│
├── types.ts             # AppEnv・SessionData型
└── index.ts             # アプリエントリーポイント
```

---

## front-web ディレクトリ構成

Feature-Sliced Design (FSD) ライクな構成を採用しています。  
依存の方向は `routes` → `features` → `entities` → `shared` の一方向です。

```
front-web/app/
├── routes/              # ルートエントリー（UIのみ・ロジックなし）
│   ├── home.tsx         # / ホーム
│   ├── auth/            # 認証系ページ
│   ├── movies/          # 映画一覧・上映回ページ
│   ├── member/          # 会員専用ページ（予約履歴）
│   └── reservations/    # 予約フローページ
│
├── features/            # ユーザーアクション単位のカスタムフック
│   ├── auth/            # useLogin / useRegister / useOtp
│   ├── member/          # useMemberReservations
│   ├── movie/           # useMovies / useSchedules
│   └── reservation/     # useTicketSelection / useSeatSelection / usePayment ...
│
├── entities/            # ビジネスモデルの型・定数・ドメインロジック
│   ├── movie/           # Movie / Schedule 型
│   ├── ticket/          # TicketType / TICKET_PRICES / formatJst ...
│   └── reservation/     # ReservationDraft / draft (sessionStorage操作)
│
├── widgets/             # 複合UIブロック（ビジネスロジックを持ちうるUI）
│   ├── Header.tsx       # グローバルヘッダー・ログイン状態表示
│   ├── HoldTimer.tsx    # 座席仮確保タイマー
│   ├── MovieCard.tsx    # 映画カード
│   └── SeatMap.tsx      # 座席選択マップ
│
├── processes/           # 複数featureをまたぐフロー制御
│   └── reservation-flow/ # 予約フローのガード・遷移制御
│
├── shared/              # アプリ全体の共通基盤
│   ├── api/             # apiFetch / AuthContext / useAuth / getAuthState
│   ├── config/          # AppConfig
│   ├── lib/             # date などユーティリティ
│   └── ui/              # Button / Input などプリミティブUIコンポーネント
│
├── root.tsx
└── routes.ts            # ルート定義（手動設定）
```
