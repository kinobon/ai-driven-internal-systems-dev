export type AuthConfig = {
  issuer: string;
  audience: string;
  accessTokenTtlSeconds: number;
  signingKey: string;
};

const defaultConfig: AuthConfig = {
  issuer: process.env.AUTH_ISSUER ?? 'internal-auth',
  audience: process.env.AUTH_AUDIENCE ?? 'internal-services',
  accessTokenTtlSeconds: Number(process.env.AUTH_ACCESS_TOKEN_TTL ?? 900),
  signingKey: process.env.AUTH_SIGNING_KEY ?? 'dev-secret-signing-key'
};

export const getAuthConfig = (): AuthConfig => {
  return defaultConfig;
};
