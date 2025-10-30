# P3 Payroll Service 実装タスク

## 背景

- SPEC.md の 8章で定義されている Payroll Service はフェーズ3で本番移行予定。
- 勤怠・社員情報・メーラーなどフェーズ1/2 コンポーネントのデータが揃って初めて正確な給与計算が可能になる。

## ゴール

- 給与計算エンジンと法定帳票出力のための API を提供するサービス基盤を構築する。

## スコープ (Milestone 1)

1. `apps/payroll-api` に Hono ベースのサービスを新設し、`/runs` (POST/GET)、`/runs/:id/items` (GET)、`/runs/:id/approve` (POST) をスタブ実装する。
2. 給与計算のドメインモデルを `packages/core/payroll-engine` に定義し、勤怠・手当・控除を組み合わせる計算パイプラインを設計する (M1 では固定値計算のスタブで代替)。
3. Drizzle スキーマ (`packages/db/src/schema/payroll.ts`) を定義し、`payroll_runs`, `payroll_items`, `allowance_rules`, `tax_records` などのテーブル構造を記述する。
4. 単体テスト (`apps/payroll-api/src/__tests__/payrollApp.test.ts`) で計算スタブの入出力と承認フローを検証する。

## アウト・オブ・スコープ

- 実データを用いた税制ロジックや法令改定への追従。
- 会計システムへの仕訳データ連携。
- PDF 明細生成やストレージ連携。

## 受け入れ基準

- `pnpm --filter payroll-api dev` でサービスが起動し、スタブエンドポイントが 200 応答を返す。
- 計算スタブがテストで固定的な給与明細を生成する。
- TypeScript コンパイルエラーがない。
- Lint/Format に準拠する。

## 依存関係

- Attendance Service の勤怠確定イベント (Milestone 2 以降で統合)。
- Employee Service の社員マスタ。

## 参考

- SPEC.md 8章 給与管理サービス。
- SPEC.md 12章 フェーズ3 移行計画。
