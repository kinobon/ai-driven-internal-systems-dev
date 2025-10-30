# P1 Mailer Service 実装タスク

## 背景

- SPEC.md の 5章で定義されている Mailer Service はフェーズ1で導入され、通知ワークフローの基盤となる。
- 勤怠・給与などのイベントに対するメール通知が業務上必須であるため、Employee Service と同フェーズで準備する。

## ゴール

- テンプレート管理とメール配送要求を受け付ける API を MVP として提供し、将来の Kafka 連携に備える。

## スコープ (Milestone 1)

1. `apps/mailer-api` に Hono ベースのサービスを新設し、`/templates` (GET/POST) と `/send` (POST) エンドポイントをスタブ実装する。
2. テンプレートスキーマを `packages/core/schemas/mailer.ts` に定義し、テンプレート名・本文・変数プレースホルダーを型安全に扱う。
3. 配信要求をキューイングする抽象レイヤ `packages/core/mailer-queue` を作成し、Milestone 1 ではインメモリキューで代替する。
4. サービスのユニットテスト (`apps/mailer-api/src/__tests__/mailerApp.test.ts`) を用意し、テンプレート管理と送信要求の検証を行う。

## アウト・オブ・スコープ

- 実際のメール配送 (SMTP/SES) や Kafka 連携。
- テンプレートのバージョニングと承認フロー。
- エラーメールリトライや DLQ 処理。

## 受け入れ基準

- `pnpm --filter mailer-api dev` でローカルサーバーが起動し、上記エンドポイントが 200 応答を返す。
- テンプレート登録時のバリデーションが `zod` で行われ、不正リクエストに 400 が返る。
- インメモリキューに追加されたジョブがログ (console) に出力され、テストで検証できる。
- Vitest のユニットテストが成功する。

## 依存関係

- Auth Service による認証ヘッダの検証 (Milestone 2 で導入予定)。
- shared-utils の日時フォーマット等。

## 参考

- SPEC.md 5章 メーラーサービス。
- SPEC.md 9章 システム連携 (通知イベント)。
