# P1 Auth Service 実装タスク

## 背景

- SPEC.md の 4章で定義されている Auth Service を最優先で構築する。
- 社内ポータルや各バックエンドサービスが利用する認証/認可の中核であり、フェーズ1の他タスクが依存する。

## ゴール

- Authorization Code + PKCE に基づく OAuth2/OIDC プロバイダーの MVP を提供し、RBAC ロール配信の足場を整える。

## スコープ (Milestone 1)

1. `apps/auth-api` に Hono ベースのサービスを新設し `/oauth/token`, `/oauth/revoke`, `/userinfo`, `/rbac/roles` のエンドポイントをスタブ実装する。
2. JWT 発行・検証ロジックの土台として `packages/core/auth` を追加し、署名鍵の抽象化とアクセストークン生成ユーティリティを提供する。
3. Drizzle スキーマ定義 (`packages/db/src/schema/auth.ts`) を作成し、ユーザー・ロール・リフレッシュトークン・監査ログのテーブル構造を定義する。
4. サービスの基本テスト (`apps/auth-api/src/__tests__/authApp.test.ts`) を用意し、エンドポイントのレスポンスと JWT 署名が担保されることを確認する。

## アウト・オブ・スコープ

- LDAP/IdP 連携や実 DB との同期。
- Vault 連携による鍵管理やローテーション。
- Kafka 監査ログ出力やメトリクス統合。

## 受け入れ基準

- `pnpm --filter auth-api dev` でローカルサーバーが起動し、上記エンドポイントが 200 応答を返す。
- スタブでも RBAC ロール一覧がハードコード文字列ではなく型安全な定数から提供される。
- Vitest ベースのユニットテストが緑で終了する。
- ESLint/Prettier によるフォーマットに準拠する。

## 依存関係

- `packages/shared-utils` のユーティリティ群。
- Node.js 20 + pnpm/turbo モノレポ構成。

## 参考

- SPEC.md 3章 セキュリティ・共通基盤。
- SPEC.md 4章 認証サービス。
