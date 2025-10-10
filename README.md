# Forkful 🍴

An intelligent culinary application that streamlines the process of creating and organizing your digital recipe collection using AI-powered text parsing.

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## About

Forkful solves the frustration of manually formatting recipes from various sources. Simply paste raw recipe text, and let AI automatically extract and organize the ingredients, steps, and other details. Perfect for cooking enthusiasts who want to build a private, well-organized digital cookbook without the tedious manual data entry.

### Key Features

- **AI-Powered Recipe Parsing** - Automatically extracts recipe details from pasted text
- **Smart Recipe Editor** - Verify and edit AI-generated content before saving
- **Manual Recipe Creation** - Full control to create recipes from scratch
- **Flexible Organization** - Tag-based categorization and filtering
- **Private Recipe Collection** - Secure user accounts with email verification
- **Recipe Analytics** - Track AI generation and acceptance rates

## Tech Stack

### Core Framework

- **[Astro 5](https://astro.build)** - Modern web framework for content-focused websites
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript

### Frontend

- **[React 19](https://react.dev)** - UI component library
- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev)** - Icon library

### State & Forms

- **[TanStack Query](https://tanstack.com/query)** - Powerful data synchronization
- **[React Hook Form](https://react-hook-form.com/)** - Performant form validation
- **[Zod](https://zod.dev)** - TypeScript-first schema validation

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

## Getting Started

### Prerequisites

- **Node.js 22.14.0** (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Forkful
   ```

2. **Set Node version**

   ```bash
   nvm use
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory with necessary configuration:

   ```env
   # Add your environment variables here
   # Database, AI API keys, etc.
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:3000`

## Available Scripts

| Script             | Description                      |
| ------------------ | -------------------------------- |
| `npm run dev`      | Start development server         |
| `npm run build`    | Build for production             |
| `npm run preview`  | Preview production build locally |
| `npm run astro`    | Run Astro CLI commands           |
| `npm run lint`     | Lint codebase                    |
| `npm run lint:fix` | Lint and auto-fix issues         |
| `npm run format`   | Format code with Prettier        |

## Project Scope

### ✅ MVP Features (In Development)

- AI-powered recipe text parsing and auto-fill
- Recipe verification and editing interface
- Manual recipe creation and editing
- Simple tag-based categorization system
- User authentication (registration, login, email verification, password reset)
- Private recipe storage per user
- Recipe generation statistics tracking

## Project Status

## Data Model

### Entities

- **Recipes** - Contains name, description
- **Ingredients** - Linked to recipes with unit, value, and name fields
- **Steps** - Ordered cooking instructions with position and description
- **Tags** - Normalized tag system with many-to-many relationship to recipes

## Contributing

Contributions are welcome! Please ensure:

- Code follows the existing style (enforced by ESLint/Prettier)
- All tests pass before submitting PRs
- Commits follow conventional commit messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ for cooking enthusiasts who love organized recipes
