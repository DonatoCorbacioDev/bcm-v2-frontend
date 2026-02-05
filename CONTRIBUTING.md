# Contributing to BCM v2.0 Frontend

Thank you for your interest in contributing to the Business Contracts Manager frontend! 🎉

This is primarily a **portfolio project**, but contributions for bug fixes, improvements, and new features are welcome.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Questions?](#questions)

---

## 📜 Code of Conduct

### Our Pledge

Be respectful, inclusive, and professional. This project welcomes contributors of all skill levels.

### Expected Behavior

- ✅ Use welcoming and inclusive language
- ✅ Be respectful of differing viewpoints
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what's best for the project
- ✅ Show empathy towards other community members

### Unacceptable Behavior

- ❌ Harassment or discriminatory language
- ❌ Trolling, insulting comments, or personal attacks
- ❌ Publishing others' private information
- ❌ Other conduct that would be inappropriate in a professional setting

---

## 🤝 How Can I Contribute?

### Reporting Bugs

**Before submitting:**
- Check the [Issues](https://github.com/DonatoCorbacioDev/bcm-v2-frontend/issues) to avoid duplicates
- Verify the bug exists in the latest version

**When submitting a bug report, include:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '/contracts'
2. Click on 'Create New'
3. Fill form with: ...
4. Observe error: ...

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Node version: 20.10.0
- Next.js version: 16.1.1

**Screenshots**
Attach screenshots if applicable.

**Console logs**
Include browser console errors.
```

---

### Suggesting Enhancements

**Feature requests should include:**
- Clear use case
- Expected behavior
- Mockups/wireframes (if UI change)
- Why this benefits users

**Example:**

```markdown
**Feature Request: Dark Mode Toggle**

**Use Case:**
Users working at night need a dark theme to reduce eye strain.

**Expected Behavior:**
- Toggle button in header
- Persists preference in localStorage
- Smooth transition between themes
- All components styled for both modes

**Benefits:**
- Better UX
- Modern UI standard
- Accessibility improvement

**Mockup:**
[Attach Figma link or image]
```

---

### Contributing Code

1. **Fork the repository**
2. **Create a feature branch** from `develop`
3. **Make your changes** following coding standards
4. **Write/update tests** (if applicable)
5. **Update documentation** if needed
6. **Submit a Pull Request**

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+ (LTS)
- npm 10+ or pnpm 8+
- Git
- IDE: VS Code (recommended), WebStorm, or similar

### Initial Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/bcm-v2-frontend.git
cd bcm-v2-frontend

# 2. Add upstream remote
git remote add upstream https://github.com/DonatoCorbacioDev/bcm-v2-frontend.git

# 3. Install dependencies
npm install
# or
pnpm install

# 4. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your backend API URL

# 5. Start development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000
```

### VS Code Setup (Recommended)

**Extensions:**
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- TypeScript Vue Plugin (`Vue.volar`)

**Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Keeping Your Fork Updated

```bash
# Fetch latest from upstream
git fetch upstream

# Merge into your local main
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

---

## 📏 Coding Standards

### TypeScript

- **Strict Mode:** Always enabled (`"strict": true` in tsconfig.json)
- **No `any`:** Avoid `any` type, use `unknown` or proper types
- **Type Inference:** Let TypeScript infer when obvious, be explicit when unclear

```typescript
// ❌ Bad
const data: any = await fetch(url);
function process(input: any) { ... }

// ✅ Good
const data: Contract[] = await fetch<Contract[]>(url);
function process(input: Contract): ContractDTO { ... }
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ContractTable.tsx` |
| Hooks | camelCase with `use` prefix | `useContracts.ts` |
| Services | camelCase with `.service` | `contracts.service.ts` |
| Types/Interfaces | PascalCase | `Contract`, `ContractDTO` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Variables/Functions | camelCase | `fetchContracts`, `isLoading` |

### File Structure

**Organize by feature:**

```
components/
  contracts/
    ContractTable.tsx       # Main component
    ContractForm.tsx        # Related component
  ui/
    button.tsx              # Reusable UI primitives

hooks/
  useContracts.ts           # Data fetching
  useUpsertContract.ts      # Mutations

services/
  contracts.service.ts      # API calls

types/
  index.ts                  # Shared types
```

### Component Structure

```typescript
// 1. Imports (grouped and ordered)
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { contractsService } from '@/services/contracts.service';
import type { Contract } from '@/types';

// 2. Types/Interfaces
interface ContractTableProps {
  initialFilters?: ContractFilters;
  onSelect?: (contract: Contract) => void;
}

// 3. Component
export function ContractTable({ initialFilters, onSelect }: ContractTableProps) {
  // State
  const [filters, setFilters] = useState(initialFilters);
  
  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => contractsService.list(filters),
  });
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Handlers
  const handleFilterChange = (newFilters: ContractFilters) => {
    setFilters(newFilters);
  };
  
  // Early returns
  if (isLoading) return <Skeleton />;
  if (!data) return <Empty />;
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### React Best Practices

**Use functional components:**
```typescript
// ✅ Good
export function MyComponent() {
  return <div>Hello</div>;
}

// ❌ Avoid (class components)
export class MyComponent extends React.Component {
  render() { return <div>Hello</div>; }
}
```

**Use hooks properly:**
```typescript
// ✅ Good: Hooks at top level
function MyComponent() {
  const [count, setCount] = useState(0);
  const data = useQuery(...);
  
  return <div>{count}</div>;
}

// ❌ Bad: Conditional hooks
function MyComponent() {
  if (someCondition) {
    const [count, setCount] = useState(0); // ❌ NEVER
  }
}
```

**Avoid prop drilling:**
```typescript
// ✅ Good: Use context or state management
const AuthContext = createContext();

function App() {
  return (
    <AuthContext.Provider value={user}>
      <Dashboard />
    </AuthContext.Provider>
  );
}

// ❌ Bad: Passing props through many levels
<App user={user}>
  <Layout user={user}>
    <Dashboard user={user}>
      <Header user={user} />
```

### Styling (Tailwind CSS)

**Use utility classes:**
```typescript
// ✅ Good
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>

// ❌ Avoid inline styles
<button style={{ backgroundColor: '#3b82f6', padding: '0.5rem 1rem' }}>
  Click me
</button>
```

**Extract repeated patterns:**
```typescript
// ✅ Good: Reusable component
<Button variant="primary" size="lg">Click me</Button>

// ❌ Bad: Repeated classes everywhere
<button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-semibold">
```

---

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(contracts): add bulk delete action` |
| `fix` | Bug fix | `fix(auth): resolve login redirect loop` |
| `docs` | Documentation | `docs(readme): update setup instructions` |
| `style` | Code style (formatting) | `style(table): adjust column widths` |
| `refactor` | Code refactoring | `refactor(hooks): simplify useContracts logic` |
| `test` | Adding/updating tests | `test(form): add validation tests` |
| `chore` | Build process, dependencies | `chore(deps): upgrade Next.js to 16.1.2` |
| `perf` | Performance improvement | `perf(table): virtualize large lists` |
| `ci` | CI/CD changes | `ci(github): add automated testing` |

### Scope

- `contracts` - Contract management
- `auth` - Authentication
- `dashboard` - Dashboard/analytics
- `ui` - UI components
- `api` - API integration
- `types` - TypeScript types

### Examples

**Good commits:**

```bash
feat(contracts): add CSV export functionality

- Add export button to ContractTable
- Implement CSV generation utility
- Include all visible columns
- Add loading state during export

---

fix(form): prevent double submission on Enter key

When pressing Enter in text inputs, form submits twice.
Now prevents default behavior and submits once.

Fixes #23

---

refactor(hooks): extract common query logic to base hook

Create useBaseQuery with shared configuration:
- Automatic error handling
- Retry logic
- Cache settings

Reduces duplication across all data hooks.

---

chore(deps): update dependencies to latest versions

- next: 16.1.1 → 16.1.2
- react-query: 5.51.0 → 5.52.0
- tailwindcss: 4.0.0 → 4.0.1
```

---

## 🔍 Pull Request Process

### Before Submitting

**Checklist:**

- [ ] Code follows style guidelines
- [ ] TypeScript strict mode passes (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Self-reviewed my code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] Added tests (if applicable)
- [ ] Tested in multiple browsers (Chrome, Firefox, Safari)
- [ ] Tested responsive design (mobile, tablet, desktop)
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with `develop`

### Submitting

1. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open Pull Request:**
   - Base: `develop` (not `main`)
   - Title: Use conventional commit format
   - Description: Use the template

3. **PR Description Template:**

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] UI/UX improvement

## Motivation and Context
Why is this change required? What problem does it solve?
Closes #(issue_number)

## How Has This Been Tested?
- [ ] Manual testing (describe scenarios)
- [ ] Unit tests (if applicable)
- [ ] Tested on multiple browsers
- [ ] Tested on mobile devices

## Screenshots (for UI changes)
| Before | After |
|--------|-------|
| [image] | [image] |

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] I have commented complex code
- [ ] I have updated the documentation
- [ ] My changes are responsive
- [ ] Tested on Chrome, Firefox, Safari
```

---

## 🧪 Testing Guidelines

### Manual Testing

**Test checklist for UI changes:**

- [ ] **Desktop** (1920x1080, 1366x768)
- [ ] **Tablet** (768x1024)
- [ ] **Mobile** (375x667, 414x896)
- [ ] **Browsers:** Chrome, Firefox, Safari, Edge
- [ ] **Dark mode** (if applicable)
- [ ] **Accessibility:** Keyboard navigation, screen reader

### Running Checks

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Fix linting issues
npm run lint --fix

# Build (catches type/build errors)
npm run build
```

### Future: Unit Tests (Planned)

```bash
# Run tests (when implemented)
npm test

# Coverage report
npm test --coverage
```

---

## ❓ Questions?

### Need Help?

- 📧 **Email:** donatocorbacio92@gmail.com
- 💼 **LinkedIn:** [Donato Corbacio](https://www.linkedin.com/in/donato-corbacio/)
- 🐛 **Issues:** [GitHub Issues](https://github.com/DonatoCorbacioDev/bcm-v2-frontend/issues)

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 🙏 Thank You!

Your contributions make this project better for everyone. Whether it's:
- 🐛 Reporting a bug
- 💡 Suggesting a feature
- 📝 Improving documentation
- 💻 Contributing code
- 🎨 Improving UI/UX

**Every contribution is valued!** ❤️

---

**Happy Coding!** 🚀
