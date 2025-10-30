# ai-driven-internal-systems-dev

A monorepo setup using Turborepo and pnpm for AI-driven internal systems development.

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Getting Started

### Install pnpm

If you don't have pnpm installed, you can install it globally:

```bash
npm install -g pnpm@8.15.0
```

Or use corepack (recommended):

```bash
corepack enable
corepack prepare pnpm@8.15.0 --activate
```

### Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the root workspace and all packages.

## Monorepo Structure

```
.
├── apps/              # Application packages
│   └── web/          # Example web application
├── packages/         # Shared packages
│   └── shared-utils/ # Example shared utilities package
├── package.json      # Root package.json
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── turbo.json        # Turborepo configuration
```

## Available Scripts

Run these commands from the root of the monorepo:

### Development

```bash
pnpm dev
```

Runs all apps in development mode.

### Build

```bash
pnpm build
```

Builds all apps and packages. Turborepo will automatically handle the dependency graph.

### Lint

```bash
pnpm lint
```

Runs linting across all packages.

### Test

```bash
pnpm test
```

Runs tests across all packages.

### Clean

```bash
pnpm clean
```

Cleans build outputs across all packages.

## Adding New Packages

### Add a New App

1. Create a new directory under `apps/`
2. Add a `package.json` with name `@repo/app-name`
3. The workspace will be automatically detected by pnpm

### Add a New Shared Package

1. Create a new directory under `packages/`
2. Add a `package.json` with name `@repo/package-name`
3. The workspace will be automatically detected by pnpm

## Turborepo Features

- **Caching**: Turborepo caches task outputs to speed up subsequent builds
- **Parallel Execution**: Runs tasks in parallel when possible
- **Dependency Graph**: Automatically understands package dependencies
- **Remote Caching**: Can be configured for team-wide cache sharing

## Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)