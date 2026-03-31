# 🎨 Kreancia Component Library

## Overview

The Kreancia component library follows a structured hierarchy with reusable UI components, business logic components, and page-specific components. All components use TypeScript and Tailwind CSS.

## 🏗️ Component Architecture

```
src/components/
├── 🎨 ui/                    # Base UI components (design system)
├── 🔐 auth/                  # Authentication components
├── 👥 clients/               # Client management components
├── 📊 client-profile/        # Client detail view components
├── 🏗️ layout/                # Layout and navigation components
└── 🔌 providers/             # Context providers
```

## 🎨 Base UI Components (`/ui`)

### Button Component
**File**: `src/components/ui/button.tsx`

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

**Usage**:
```tsx
<Button variant="primary" size="md" isLoading={loading}>
  Save Client
</Button>
```

**Variants**:
- `primary` - Blue background, white text
- `secondary` - Gray background, dark text
- `danger` - Red background, white text
- `outline` - Transparent background, colored border

### Form Components
**Location**: `src/components/ui/forms/`

- **Input**: Text inputs with validation states
- **Select**: Dropdown selections
- **Textarea**: Multi-line text input
- **Checkbox**: Boolean input with label
- **RadioGroup**: Single selection from options

### Loading Components
**Location**: `src/components/ui/loading/`

- **Spinner**: Loading spinner with sizes
- **Skeleton**: Content placeholders
- **LoadingPage**: Full page loading state

## 🔐 Authentication Components (`/auth`)

### SessionProvider
**File**: `src/components/providers/SessionProvider.tsx`

Context provider for NextAuth.js session management.

```tsx
interface SessionProviderProps {
  children: React.ReactNode
  session?: Session | null
}
```

### LogoutButton
**File**: `src/components/auth/LogoutButton.tsx`

Handles user logout with confirmation.

```tsx
interface LogoutButtonProps {
  variant?: 'button' | 'link'
  showConfirmation?: boolean
}
```

### SessionChecker
**File**: `src/components/auth/SessionChecker.tsx`

Monitors session state and handles automatic redirects.

## 👥 Client Management Components (`/clients`)

### ClientTable
**File**: `src/components/clients/ClientTable.tsx`

Displays paginated list of clients with search and filtering.

**Features**:
- ✅ Search by name, email, business name
- ✅ Status filtering (Active, Inactive, Suspended)
- ✅ Overdue credit filtering
- ✅ Sortable columns
- ✅ Pagination controls
- ✅ Bulk actions (planned)

```tsx
interface ClientTableProps {
  clients: ClientWithStats[]
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  onSearch: (query: string) => void
  onFilter: (filters: ClientFilters) => void
  isLoading?: boolean
}
```

### SearchFilters
**File**: `src/components/clients/SearchFilters.tsx`

Advanced filtering component for client list.

**Filters**:
- Text search
- Status filter
- Overdue credits toggle
- Sort options
- View options (grid/list)

```tsx
interface SearchFiltersProps {
  onFiltersChange: (filters: ClientFilters) => void
  stats?: ClientStats
  isLoading?: boolean
}
```

## 📊 Client Profile Components (`/client-profile`)

### ClientProfileContent
**File**: `src/components/client-profile/ClientProfileContent.tsx`

Main container for client detail view with tab navigation.

### ClientProfileHeader
**File**: `src/components/client-profile/ClientProfileHeader.tsx`

Client header with basic information and quick actions.

**Features**:
- Client name and contact info
- Status badge
- Quick action buttons (Edit, Delete, Add Credit/Payment)
- Outstanding balance summary

### ClientProfileTabs
**File**: `src/components/client-profile/ClientProfileTabs.tsx`

Tab navigation for client sections.

**Tabs**:
- **Overview**: Summary and statistics
- **Credits**: Credit history and management
- **Payments**: Payment history
- **Activity**: Audit trail
- **Settings**: Client configuration

### Tab Components

#### OverviewTab
**File**: `src/components/client-profile/tabs/OverviewTab.tsx`

**Displays**:
- Client summary statistics
- Outstanding balance breakdown
- Recent activity timeline
- Quick actions

#### CreditsTab & CreditsTabReal
**Files**: 
- `src/components/client-profile/tabs/CreditsTab.tsx`
- `src/components/client-profile/tabs/CreditsTabReal.tsx`

**Features**:
- Credit history table
- Create new credit
- Edit/delete credits
- FIFO allocation visualization
- Overdue credit highlighting

#### PaymentsTab
**File**: `src/components/client-profile/tabs/PaymentsTab.tsx`

**Features**:
- Payment history table
- Payment allocation details
- Create new payment
- Payment method filtering

#### ActivityTab
**File**: `src/components/client-profile/tabs/ActivityTab.tsx`

**Features**:
- Audit trail of all client activities
- Credit/payment timeline
- Status change history

#### SettingsTab
**File**: `src/components/client-profile/tabs/SettingsTab.tsx`

**Features**:
- Edit client information
- Credit limit management
- Payment terms configuration
- Status management

### ClientProfileSkeleton
**File**: `src/components/client-profile/ClientProfileSkeleton.tsx`

Loading placeholder for client profile pages.

## 🏗️ Layout Components (`/layout`)

### MainLayout
**File**: `src/components/layout/MainLayout.tsx`

Main application layout with sidebar and header.

```tsx
interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
}
```

### Header
**File**: `src/components/layout/Header.tsx`

Application header with navigation and user menu.

**Features**:
- Merchant branding
- Navigation menu
- User profile dropdown
- Notification bell (planned)
- Search global (planned)

### Sidebar
**File**: `src/components/layout/Sidebar.tsx`

Navigation sidebar with menu items and statistics.

**Menu Items**:
- 🏠 Dashboard
- 👥 Clients
- 💰 Credits
- 💳 Payments
- 📊 Reports (planned)
- ⚙️ Settings (planned)

**Features**:
- Active link highlighting
- Quick stats display
- Collapsible design (mobile)

## 🔌 Context Providers (`/providers`)

### SessionProvider
**File**: `src/components/providers/SessionProvider.tsx`

NextAuth.js session context provider.

## 🎯 Component Patterns

### 1. Data Fetching Pattern
```tsx
// Custom hook for data fetching
const useClients = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch logic
}

// Component usage
const ClientList = () => {
  const { clients, loading, error } = useClients()
  
  if (loading) return <ClientListSkeleton />
  if (error) return <ErrorMessage error={error} />
  
  return <ClientTable clients={clients} />
}
```

### 2. Form Handling Pattern
```tsx
// Using react-hook-form with Zod validation
const clientSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email().optional()
})

const ClientForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema)
  })

  const onSubmit = async (data: ClientFormData) => {
    // Submit logic
  }
}
```

### 3. State Management Pattern
```tsx
// Local state for UI interactions
const [filters, setFilters] = useState<ClientFilters>({
  search: '',
  status: 'ALL',
  hasOverdue: false
})

// Server state via custom hooks
const { clients, mutate } = useClients(filters)
```

### 4. Error Handling Pattern
```tsx
const ComponentWithError = () => {
  const [error, setError] = useState<string | null>(null)

  const handleAction = async () => {
    try {
      await someAPICall()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div>
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {/* Rest of component */}
    </div>
  )
}
```

## 🎨 Styling Patterns

### 1. Tailwind CSS Classes
```tsx
// Common patterns used throughout components
const styles = {
  card: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-md'
  },
  input: 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
  table: 'min-w-full divide-y divide-gray-200'
}
```

### 2. Responsive Design
```tsx
// Mobile-first responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### 3. Dark Mode Support (Planned)
```tsx
// Dark mode classes (prepared for future implementation)
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

## 🔄 Animation Patterns

### Framer Motion Integration
```tsx
import { motion } from 'framer-motion'

// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

// Component animations
<motion.div
  variants={pageVariants}
  initial="initial"
  animate="in"
  exit="out"
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

## 📱 Responsive Behavior

### Breakpoint Strategy
- **Mobile**: `< 768px` - Single column, collapsible sidebar
- **Tablet**: `768px - 1024px` - Two columns, persistent sidebar
- **Desktop**: `> 1024px` - Full layout with expanded sidebar

### Component Adaptations
- Tables become cards on mobile
- Sidebar collapses to hamburger menu
- Forms stack vertically on small screens
- Action buttons group differently

## 🧪 Testing Patterns

### Component Testing
```tsx
// Example test for ClientTable component
describe('ClientTable', () => {
  it('renders client list correctly', () => {
    render(<ClientTable clients={mockClients} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('handles search input', () => {
    render(<ClientTable clients={mockClients} onSearch={mockOnSearch} />)
    fireEvent.change(screen.getByPlaceholderText('Search clients...'), {
      target: { value: 'john' }
    })
    expect(mockOnSearch).toHaveBeenCalledWith('john')
  })
})
```

## 🚀 Performance Optimizations

### 1. Code Splitting
```tsx
// Lazy loading for heavy components
const ClientProfile = lazy(() => import('./ClientProfile'))

// Usage with Suspense
<Suspense fallback={<ClientProfileSkeleton />}>
  <ClientProfile clientId={id} />
</Suspense>
```

### 2. Memoization
```tsx
// Prevent unnecessary re-renders
const ClientCard = memo(({ client }: { client: Client }) => {
  return <div>{/* Client card content */}</div>
})
```

### 3. Virtual Scrolling (Planned)
For large client lists, implement virtual scrolling to improve performance.

---

> **Next**: [Page Architecture](./page-architecture.md)
> 
> **Related**: [UI Patterns](./ui-patterns.md) | [Hooks Reference](./hooks-reference.md)