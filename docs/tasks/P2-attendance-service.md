# P2 Attendance Service 実装タスク

## 背景

- SPEC.md の 7章で定義されている Attendance Service はフェーズ2で移行予定。
- 勤怠データは給与計算トリガーや工数管理に直結するが、フェーズ1サービスが整ってから着手する。

## ゴール

- 打刻・休暇申請・承認フローの API を提供するためのサービス基盤を構築する。

## スコープ (Milestone 1)

1. `apps/attendance-api` に Hono ベースのサービスを新設し、`/clock` (POST)、`/requests` (GET/POST)、`/summaries` (GET) をスタブ実装する。
2. 勤怠イベントと申請データのスキーマを `packages/db/src/schema/attendance.ts` として定義する。
3. Server Actions で利用する BFF 用エンドポイント契約を `packages/core/contracts/attendance.ts` にまとめる。
4. インメモリストレージでのユースケース (打刻→サマリ反映) をテストする (`apps/attendance-api/src/__tests__/attendanceApp.test.ts`)。

## アウト・オブ・スコープ

- 実打刻端末との Webhook 連携。
- Kafka への勤怠確定イベント配信。
- 勤怠規則エンジンや残業計算ロジック。

## 受け入れ基準

- `pnpm --filter attendance-api dev` を実行するとサービスが起動し、各エンドポイントがスタブレスポンスを返す。
- 申請の承認フロー (承認状態遷移) がテストで保証される。
- 打刻データから日次サマリを生成するユースケースがユニットテストでカバーされる。
- TypeScript の型エラーがないこと。

## 依存関係

- Employee Service からの社員マスタ参照 (Milestone 2 で統合予定)。
- Auth Service による認証。

## 参考

- SPEC.md 7章 勤怠管理サービス。
- SPEC.md 9章 システム統合/連携。
