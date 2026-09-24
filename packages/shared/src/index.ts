// packages/shared/src/index.ts
/**
 * @todo/shared Public API Entrypoint
 * Monorepo package containing core domain types, dual-mode API client,
 * accessible UI primitives, and cross-cutting Jotai atoms.
 */

export const SHARED_MODULE_VERSION = '0.2.0';

// 1. Domain Types
export type {
  UserId,
  TodoId,
  User,
  UserSummary,
  CreateUserInput,
  Todo,
  TodoSummary,
  CreateTodoInput,
  UpdateTodoInput,
  ApiHealthStatus,
} from './types/domain';

// 2. Query Key Factories
export { userKeys, todoKeys } from './api/queryKeys';

// 3. API Clients & Mock Engine
export {
  apiClient,
  DualModeApiClient,
  createApiClient,
  type ApiClient,
  type ApiClientMode,
} from './api/apiClient';

export {
  mockDb,
  MockDb,
  INITIAL_USERS,
  INITIAL_TODOS,
} from './api/mockDb';

export {
  httpBffClient,
  HttpBffClient,
  type HttpBffClientOptions,
} from './api/httpBffClient';

// 4. Cross-Cutting UI State (Jotai)
export {
  activeUserIdAtom,
  isUserSelectedAtom,
} from './state/userAtom';

export {
  isChaosActiveAtom,
  chaosModeAtom,
} from './state/chaosAtom';

export {
  toastsAtom,
  toastListAtom,
  useToast,
  type Toast,
  type ToastType,
  type ToastOptions,
} from './state/toastAtom';

// 5. Shared UI Primitives
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './components/Button';

export {
  Input,
  type InputProps,
} from './components/Input';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from './components/Card';

export {
  Badge,
  type BadgeProps,
  type BadgeVariant,
  type BadgeSize,
} from './components/Badge';

export {
  Alert,
  type AlertProps,
  type AlertVariant,
} from './components/Alert';

export {
  Spinner,
  type SpinnerProps,
} from './components/Spinner';

export {
  ToastViewport,
  type ToastViewportProps,
} from './components/ToastViewport';

// 6. Utilities
export { cn } from './utils/cn';
