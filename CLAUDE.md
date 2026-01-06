# FundBrave

Decentralized fundraising platform built with blockchain, DeFi, and AI.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: NestJS, Prisma, PostgreSQL
- **Contracts**: Hardhat, Solidity
- **AI Service**: Python ML

## Project Structure

```
packages/
├── frontend/    # Next.js App Router (app/ directory)
├── backend/     # NestJS API + Prisma ORM
├── contracts/   # Hardhat smart contracts
├── ai-service/  # Python ML service
└── shared/      # Shared types & utilities
```

## Key Commands

```bash
pnpm run build        # Build all packages
```

## Frontend Structure

```
app/
├── auth/            # Login, signup, password reset
├── campaigns/       # Campaign pages + donation flow
├── community/       # Social features
├── onboarding/      # User onboarding flow
├── profile/         # User profiles
├── components/      # Shared UI components
│   ├── ui/          # Base UI (Button, Input, Modal, etc.)
│   ├── auth/        # Auth-specific components
│   ├── campaigns/   # Campaign cards, stats, forms
│   ├── community/   # Posts, comments, social
│   ├── profile/     # Profile sections
│   └── onboarding/  # Onboarding steps
├── provider/        # Context providers
└── types/           # TypeScript interfaces
```

## Styling Conventions

- Use CSS variables from `globals.css` for colors
- Border standard: `border-border-subtle`
- Components use `class-variance-authority` for variants
- Animation: GSAP and Motion library

## Key Dependencies

- `lucide-react` - Icons
- `class-variance-authority` - Component variants
- `zod` - Schema validation
- `canvas-confetti` - Celebration effects
