# P1 Employee Service 実装タスク

## 背景

- SPEC.md の 6章で定義されている Employee Management Service はフェーズ1で導入予定。
- 勤怠・給与・通知など全マイクロサービスが社員マスタ情報を参照するため、Auth Service に次ぐ優先度で実装する。

## ゴール

- 社員マスタ CRUD とロール・所属メタデータ提供のための API を MVP として提供する。

## スコープ (Milestone 1)

1. `apps/employee-api` に Hono ベースのサービスを新設し、`/employees` (GET/POST) と `/employees/:id` (GET/PATCH) のエンドポイントをスタブ実装する。
2. 入力バリデーションに `zod` を導入し、社員作成/更新時の型を共通化する (`packages/core/schemas/employee.ts`)。
3. Drizzle スキーマ定義 (`packages/db/src/schema/employee.ts`) を作成し、従業員・部署・役職テーブルの構造を記述する。
4. サービスレイヤのユニットテスト (`apps/employee-api/src/__tests__/employeeApp.test.ts`) を用意し、スタブデータの CRUD が期待通り動作することを確認する。

## アウト・オブ・スコープ

- Auth Service との SSO 連携および RBAC の整合性チェック。
- 実データベースや既存システムとの同期処理。
- 監査ログやイベント配信 (Kafka) の実装。

## 受け入れ基準

- `pnpm --filter employee-api dev` でローカルサーバーが起動し、CRUD エンドポイントが 200 応答を返す。
- バリデーションエラー時に 400 応答が返り、エラーメッセージが JSON として整形される。
- Vitest のユニットテストが成功する。
- API 応答スキーマが `zod` スキーマと一致する。

## 依存関係

- Auth Service (認可ヘッダ) との連携は将来タスクだが、エンドポイントインターフェースは仕様に従う。
- shared-utils の共通フォーマッターなど。

## 参考

- SPEC.md 6章 社員管理サービス。
- SPEC.md 12章 フェーズ1 移行計画。
