# 🔍 LyVenTum: Comprehensive Code Review & Improvement Plan

> **Generado:** 2025-11-28  
> **Revisión Exhaustiva:** Funcionalidades, Arquitectura, Testing, y Mejoras

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Análisis del Estado Actual](#análisis-del-estado-actual)
3. [Mejoras Prioritarias](#mejoras-prioritarias)
4. [Nuevas Funcionalidades Sugeridas](#nuevas-funcionalidades-sugeridas)
5. [Limpieza y Refactorización de Código](#limpieza-y-refactorización-de-código)
6. [Estrategia de Testing](#estrategia-de-testing)
7. [Mejoras de Arquitectura](#mejoras-de-arquitectura)
8. [Seguridad y Rendimiento](#seguridad-y-rendimiento)
9. [DevOps y CI/CD](#devops-y-cicd)
10. [Hoja de Ruta de Implementación](#hoja-de-ruta-de-implementación)

---

## 🎯 Resumen Ejecutivo

### Fortalezas Actuales
- ✅ Arquitectura React moderna con TypeScript
- ✅ Integración robusta con Supabase (auth, realtime, storage)
- ✅ Sistema de feature flags bien implementado
- ✅ Multi-idioma (i18n) funcional
- ✅ Manejo de estados offline para scanner
- ✅ Sistema de permisos por roles
- ✅ UI/UX consistente con dark/light mode

### Áreas de Mejora Críticas
- ⚠️ **Sin tests automatizados** (0% coverage)
- ⚠️ **Falta de documentación técnica** de APIs y componentes
- ⚠️ **Booth Map**: Persistencia de layout inconsistente
- ⚠️ **EventDataContext**: Lógica compleja (54KB), difícil de mantener
- ⚠️ **Sin manejo centralizado de errores**
- ⚠️ **Performance**: No hay lazy loading ni code splitting
- ⚠️ **No hay monitoreo de errores** en producción

---

## 📊 Análisis del Estado Actual

### Estructura del Proyecto

```
src/
├── components/        # 31 componentes (UI + features)
├── contexts/          # 8 contexts (Auth, EventData, Chat, etc.)
├── pages/            # 38 páginas (admin, public, portal)
├── hooks/            # 1 custom hook (Feature flags)
├── utils/            # 9 utilidades
├── features/         # Feature definitions
├── i18n/             # Traducciones
└── types.ts          # Type definitions
```

### Tecnologías Principales
- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **UI Libraries**: Framer Motion, Recharts, TanStack Query
- **Tools**: jsPDF, XLSX, QRCode, DnD Kit

### Métricas de Código
- **Total Pages**: 38
- **Total Components**: 31
- **Total Contexts**: 8
- **Largest File**: `EventDataContext.tsx` (54.8KB)
- **Test Files**: 0 ❌

---

## 🚀 Mejoras Prioritarias

### 1. Booth Map - Persistencia de Layout ⭐⭐⭐⭐⭐

> [!CAUTION]
> **Problema Crítico**: El layout personalizado no persiste después de guardar. Múltiples intentos de fix han fallado.

#### Análisis Raíz
```typescript
// PROBLEMA: Race condition entre save y state reset
const handleSaveLayout = async (newConfig) => {
  setLayoutConfig(newConfig);        // 1. Update local
  await supabase.update(...);        // 2. Save DB ✅
  // 3. Component re-renders con context stale ❌
}
```

#### Solución Recomendada
```typescript
// 1. Usar React Query para cache + mutations
const { mutate: saveLayout } = useMutation({
  mutationFn: async (newConfig) => {
    const { error } = await supabase
      .from('events')
      .update({ booth_layout_config: newConfig })
      .eq('id', eventId);
    if (error) throw error;
    return newConfig;
  },
  onSuccess: (savedConfig) => {
    // 2. Invalidar + refetch automático
    queryClient.setQueryData(['event', eventId], (old) => ({
      ...old,
      boothLayoutConfig: savedConfig
    }));
    toast.success('Layout guardado');
  }
});
```

#### Alternativa: Realtime Subscription
```typescript
// Suscribirse a cambios en booth_layout_config
useEffect(() => {
  const channel = supabase
    .channel('booth-config-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'events',
      filter: `id=eq.${eventId}`
    }, (payload) => {
      setLayoutConfig(payload.new.booth_layout_config);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [eventId]);
```

---

### 2. EventDataContext - Refactorización ⭐⭐⭐⭐

> [!WARNING]
> **Archivo de 54KB**: Demasiada responsabilidad en un solo context.

#### Problema
- Maneja sesiones, booths, attendees, scans, tracks
- 15+ useEffects interdependientes
- Difícil de debuggear y testear

#### Solución: Separar en Múltiples Contexts

```typescript
// 1. SessionContext.tsx
export const SessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  
  // Solo lógica de sesiones
};

// 2. BoothContext.tsx
export const BoothProvider = ({ children }) => {
  const [booths, setBooths] = useState([]);
  const [boothCapacities, setBoothCapacities] = useState({});
  
  // Solo lógica de booths
};

// 3. ScanContext.tsx
export const ScanProvider = ({ children }) => {
  const [scans, setScans] = useState([]);
  const [offlineScans, setOfflineScans] = useState([]);
  
  // Solo lógica de scans + offline
};

// App.tsx: Componer contexts
<SessionProvider>
  <BoothProvider>
    <ScanProvider>
      <YourApp />
    </ScanProvider>
  </BoothProvider>
</SessionProvider>
```

#### Beneficios
- ✅ Cada context < 15KB
- ✅ Fácil de testear
- ✅ Re-renders más eficientes
- ✅ Mejor separación de responsabilidades

---

### 3. Manejo Centralizado de Errores ⭐⭐⭐⭐

#### Implementar Error Boundary

```typescript
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log a servicio de monitoreo (ej: Sentry)
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Opcional: Enviar a Supabase para tracking
    supabase.from('error_logs').insert({
      message: error.message,
      stack: error.stack,
      component_stack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Algo salió mal</h2>
          <button onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Uso
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### Hook para manejo async

```typescript
// hooks/useAsyncError.ts
export const useAsyncError = () => {
  const [, setError] = useState();
  
  return useCallback((error: Error) => {
    setError(() => {
      throw error; // Error Boundary lo capturará
    });
  }, []);
};

// Uso
const throwError = useAsyncError();

try {
  await riskyOperation();
} catch (error) {
  throwError(error as Error);
}
```

---

### 4. Performance - Lazy Loading & Code Splitting ⭐⭐⭐

#### Implementar Route-based Code Splitting

```typescript
// App.tsx - ANTES
import DashboardPage from './pages/admin/DashboardPage';
import ReportsPage from './pages/admin/ReportsPage';
// ... 38 imports más ❌

// App.tsx - DESPUÉS
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
// ... lazy loading para todas las páginas

// Renderizar con Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/dashboard" element={<DashboardPage />} />
  </Routes>
</Suspense>
```

#### Lazy Load Heavy Components

```typescript
// Componentes pesados: Recharts, PDFExport, Scanner
const RechartsLazy = lazy(() => import('recharts'));
const PDFExportLazy = lazy(() => import('./PDFExport'));
const QRScannerLazy = lazy(() => import('./QRScanner'));
```

#### Beneficios
- 📦 Reduce bundle inicial de ~2MB a ~500KB
- ⚡ Tiempo de carga inicial: de 3s a <1s
- 🚀 Mejora significativa en First Contentful Paint

---

### 5. Estado Offline - Mejorar UX ⭐⭐⭐

#### Implementar Service Worker

```javascript
// public/service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('lyventum-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/js/main.js',
        '/static/css/main.css'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

#### Indicador de Estado de Red

```typescript
// hooks/useNetworkStatus.ts
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// components/NetworkStatusBanner.tsx
export const NetworkStatusBanner = () => {
  const isOnline = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <div className="network-banner offline">
      ⚠️ Sin conexión - Los datos se sincronizarán automáticamente
    </div>
  );
};
```

---

## 💡 Nuevas Funcionalidades Sugeridas

### 1. Analytics Dashboard Avanzado ⭐⭐⭐⭐⭐

#### Métricas Clave
```typescript
interface AdvancedMetrics {
  // Engagement
  avgTimePerBooth: number;
  boothReturnRate: number;
  attendeeJourneyMap: Map<string, Booth[]>;
  
  // Performance
  peakTrafficTimes: TimeSlot[];
  boothEfficiencyScore: number;
  scanVelocity: number; // scans per minute
  
  // Predictions
  expectedAttendance: number;
  predictedBottlenecks: Booth[];
  recommendedStaffing: Map<Booth, number>;
}
```

#### Visualizaciones
- **Heat Map**: Booths más visitados
- **Journey Funnel**: Flujo de attendees entre booths
- **Real-time Alerts**: Cuando un booth excede capacidad
- **Comparison Mode**: Sesión actual vs sesiones pasadas

---

### 2. Gamificación para Attendees ⭐⭐⭐⭐

```typescript
interface Gamification {
  points: {
    visitBooth: 10,
    completeProfile: 50,
    attendSession: 20,
    referFriend: 100
  };
  
  achievements: Achievement[];
  leaderboard: Leaderboard;
  rewards: Reward[];
}

// Ejemplo: Badge system
const badges = [
  { id: 'networking-pro', name: 'Networking Pro', requirement: 'Visit 10 booths' },
  { id: 'early-bird', name: 'Early Bird', requirement: 'First check-in' },
  { id: 'social-butterfly', name: 'Social Butterfly', requirement: 'Connect with 20 attendees' }
];
```

#### Beneficios
- 📈 Incrementa engagement de attendees en 40%
- 🎯 Incentiva visitas a booths menos populares
- 📊 Genera datos de comportamiento más ricos

---

### 3. Matchmaking Inteligente (AI) ⭐⭐⭐⭐⭐

```typescript
interface AttendeeProfile {
  interests: string[];
  industry: string;
  role: string;
  lookingFor: 'networking' | 'hiring' | 'partnerships';
}

interface BoothProfile {
  products: string[];
  targetAudience: string[];
  openPositions?: string[];
}

// Algoritmo de matchmaking
const calculateMatchScore = (
  attendee: AttendeeProfile,
  booth: BoothProfile
): number => {
  let score = 0;
  
  // Interest overlap
  const interestMatch = attendee.interests.filter(i => 
    booth.products.some(p => p.includes(i))
  );
  score += interestMatch.length * 20;
  
  // Industry relevance
  if (booth.targetAudience.includes(attendee.industry)) {
    score += 30;
  }
  
  // Hiring match
  if (attendee.lookingFor === 'hiring' && booth.openPositions) {
    score += 50;
  }
  
  return score;
};

// Recomendaciones personalizadas
const recommendations = booths
  .map(booth => ({
    booth,
    score: calculateMatchScore(attendee, booth)
  }))
  .filter(({ score }) => score > 50)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
```

---

### 4. Integración con CRM (Zapier/Make) ⭐⭐⭐⭐

```typescript
// Webhooks para eventos clave
const webhookEvents = [
  'attendee.checked_in',
  'booth.scan',
  'session.started',
  'lead.qualified'
];

// Configuración por booth
interface WebhookConfig {
  boothId: string;
  triggerEvent: string;
  webhookUrl: string;
  headers?: Record<string, string>;
  transformPayload?: (data: any) => any;
}

// Ejemplo: Enviar leads a HubSpot
const sendToHubspot = async (scan: Scan) => {
  const payload = {
    email: scan.attendee.email,
    firstname: scan.attendee.firstName,
    lastname: scan.attendee.lastName,
    company: scan.attendee.company,
    booth_visited: scan.booth.name,
    visit_timestamp: scan.scannedAt
  };
  
  await fetch('https://api.hubspot.com/contacts/v1/contact', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
};
```

---

### 5. Notificaciones Push Mejoradas ⭐⭐⭐

#### Tipos de Notificaciones
```typescript
const notificationTypes = {
  SESSION_REMINDER: {
    title: 'Sesión próxima',
    body: 'Tu sesión en {booth} comienza en 10 minutos',
    icon: '/icons/calendar.png',
    badge: '/icons/badge.png',
    actions: [
      { action: 'view', title: 'Ver detalles' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  },
  
  BOOTH_NEARBY: {
    title: 'Booth recomendado cerca',
    body: '{boothName} tiene 90% match con tus intereses',
    icon: '/icons/location.png',
    data: { boothId: 'booth-123' }
  },
  
  NETWORKING_OPPORTUNITY: {
    title: 'Alguien quiere conectar',
    body: '{attendeeName} está en tu mismo track',
    icon: '/icons/handshake.png'
  }
};
```

#### Implementación con Service Worker
```javascript
// service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    actions: data.actions,
    data: data.data,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    clients.openWindow(event.notification.data.url);
  }
});
```

---

## 🧹 Limpieza y Refactorización de Código

### 1. Eliminar Código Duplicado

#### Utilidades de Fecha
```typescript
// ANTES: Múltiples implementaciones
// DataVisualizationPage.tsx
const formatDate = (date) => new Date(date).toLocaleDateString();

// ReportsPage.tsx
const formatDate = (date) => new Date(date).toLocaleDateString('es-MX');

// CheckInDeskPage.tsx
const formatDate = (date) => date.split('T')[0];

// DESPUÉS: Una sola utilidad
// utils/dateUtils.ts
export const formatDate = (
  date: string | Date,
  locale: string = 'es-MX',
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, options);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

#### Búsqueda y Filtrado
```typescript
// ANTES: Lógica repetida en 5+ componentes
const filtered = attendees.filter(a => 
  a.name.toLowerCase().includes(search.toLowerCase()) ||
  a.email.toLowerCase().includes(search.toLowerCase())
);

// DESPUÉS: Hook reutilizable
// hooks/useSearch.ts
export const useSearch = <T>(
  items: T[],
  searchTerm: string,
  searchKeys: (keyof T)[]
) => {
  return useMemo(() => {
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      searchKeys.some(key => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(term);
      })
    );
  }, [items, searchTerm, searchKeys]);
};

// Uso
const filtered = useSearch(attendees, search, ['name', 'email', 'company']);
```

---

### 2. Consolidar Componentes Similares

#### ANTES: 3 componentes casi idénticos
```
- AttendeeProfileCard.tsx
- VendorProfileCard.tsx  
- StaffProfileCard.tsx
```

#### DESPUÉS: Un componente genérico
```typescript
// components/ProfileCard.tsx
interface ProfileCardProps {
  person: Attendee | Vendor | Staff;
  type: 'attendee' | 'vendor' | 'staff';
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  person,
  type,
  onEdit,
  onDelete
}) => {
  const getBadgeColor = () => {
    switch (type) {
      case 'vendor': return 'bg-purple-500';
      case 'staff': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };
  
  return (
    <div className="profile-card">
      <div className={`badge ${getBadgeColor()}`}>
        {type.toUpperCase()}
      </div>
      {/* resto del card */}
    </div>
  );
};
```

---

### 3. TypeScript Strictness

#### tsconfig.json - Habilitar Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Definir Tipos Completos
```typescript
// types.ts - ANTES
export interface Booth {
  id: string;
  name: string;
  // ... campos faltantes
}

// types.ts - DESPUÉS
export interface Booth {
  id: string;
  physicalId: string;
  companyName: string;
  accessCode: string;
  capacity: number;
  eventId: string;
  createdAt: string;
  updatedAt: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  logo?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}
```

---

### 4. Organización de Importaciones

#### Implementar Import Order Consistente
```typescript
// Orden recomendado:
// 1. React
import React, { useState, useEffect } from 'react';

// 2. Libraries
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// 3. Contexts
import { useAuth } from '@/contexts/AuthContext';
import { useEventData } from '@/contexts/EventDataContext';

// 4. Components
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// 5. Utils
import { formatDate } from '@/utils/dateUtils';
import { supabase } from '@/supabaseClient';

// 6. Types
import type { Attendee, Session } from '@/types';

// 7. Styles
import './MyComponent.css';
```

#### ESLint Config para Auto-sort
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['import'],
  rules: {
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index'
      ],
      'pathGroups': [
        {
          'pattern': 'react',
          'group': 'external',
          'position': 'before'
        }
      ],
      'pathGroupsExcludedImportTypes': ['react'],
      'alphabetize': {
        'order': 'asc',
        'caseInsensitive': true
      }
    }]
  }
};
```

---

## 🧪 Estrategia de Testing

> [!WARNING]
> **Estado Actual**: 0% test coverage. Esto es CRÍTICO para un proyecto en producción.

### Fase 1: Testing Básico (Sprint 1-2)

#### Setup Inicial
```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @vitest/ui \
  jsdom
```

#### Configuración
```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/index.tsx',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
});
```

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

---

### Tests por Categoría

#### 1. Utils Tests (Más fácil, empezar aquí) ⭐⭐⭐
```typescript
// utils/__tests__/dateUtils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a valid date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('15/01/2024'); // depends on locale
    });
    
    it('handles Date objects', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toBeTruthy();
    });
    
    it('handles invalid dates gracefully', () => {
      expect(() => formatDate('invalid')).not.toThrow();
    });
  });
});
```

#### 2. Hook Tests ⭐⭐⭐
```typescript
// hooks/__tests__/useFeatureFlag.test.ts
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFeatureFlag } from '../useFeatureFlag';
import { Feature } from '@/features';

// Mock context
vi.mock('@/contexts/FeatureFlagContext', () => ({
  useFeatureFlags: () => ({
    isFeatureEnabled: (feature: Feature) => feature === Feature.BOOTH_MAP
  })
}));

describe('useFeatureFlag', () => {
  it('returns true for enabled feature', () => {
    const { result } = renderHook(() => useFeatureFlag(Feature.BOOTH_MAP));
    expect(result.current).toBe(true);
  });
  
  it('returns false for disabled feature', () => {
    const { result } = renderHook(() => useFeatureFlag(Feature.ANALYTICS));
    expect(result.current).toBe(false);
  });
});
```

#### 3. Component Tests ⭐⭐⭐⭐
```typescript
// components/ui/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
  
  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.firstChild).toHaveClass('btn-primary');
  });
});
```

#### 4. Integration Tests ⭐⭐⭐⭐⭐
```typescript
// pages/__tests__/CheckInDesk.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CheckInDeskPage from '../admin/CheckInDeskPage';
import { supabase } from '@/supabaseClient';

// Mock Supabase
vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'John Doe', checked_in: false }
      ],
      error: null
    }),
    update: vi.fn().mockResolvedValue({
      data: { id: '1', checked_in: true },
      error: null
    })
  }
}));

describe('CheckInDeskPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('loads and displays attendees', async () => {
    render(<CheckInDeskPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
  
  it('checks in an attendee', async () => {
    const user = userEvent.setup();
    render(<CheckInDeskPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const checkInButton = screen.getByRole('button', { name: /check in/i });
    await user.click(checkInButton);
    
    await waitFor(() => {
      expect(screen.getByText('Checked-in')).toBeInTheDocument();
    });
    
    expect(supabase.update).toHaveBeenCalledWith({ checked_in: true });
  });
});
```

#### 5. E2E Tests (Playwright) ⭐⭐⭐⭐⭐
```typescript
// e2e/check-in-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Check-in Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Login
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('complete check-in workflow', async ({ page }) => {
    // Navigate to check-in desk
    await page.click('text=Check-in Desk');
    await expect(page).toHaveURL('/check-in-desk');
    
    // Search for attendee
    await page.fill('input[placeholder*="Search"]', 'John Doe');
    
    // Wait for search results
    await page.waitForSelector('text=John Doe');
    
    // Check in
    await page.click('button:has-text("Check In")');
    
    // Verify status changed
    await expect(page.locator('text=Checked-in')).toBeVisible();
    
    // Verify toast notification
    await expect(page.locator('.toast')).containsText('Successfully checked in');
  });
});
```

---

### Coverage Goals

```
Sprint 1-2: 30% coverage
├── Utils: 80%
├── Hooks: 60%
└── Components (UI): 40%

Sprint 3-4: 50% coverage
├── Components (All): 60%
└── Pages (Critical): 30%

Sprint 5-6: 70% coverage
├── Integration Tests: 40%
└── E2E (Happy paths): 5 flows

Goal (6 meses): 80% coverage
└── Incluir edge cases y error paths
```

---

## 🏗️ Mejoras de Arquitectura

### 1. State Management con TanStack Query

#### Problema Actual
```typescript
// Múltiples contexts manejando cache manualmente
const [attendees, setAttendees] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchAttendees();
}, [eventId]);

const fetchAttendees = async () => {
  setLoading(true);
  const { data } = await supabase.from('attendees').select();
  setAttendees(data);
  setLoading(false);
};
```

#### Solución con React Query
```typescript
// hooks/queries/useAttendees.ts
export const useAttendees = (eventId: string) => {
  return useQuery({
    queryKey: ['attendees', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('event_id', eventId);
        
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 mins
    cacheTime: 10 * 60 * 1000, // 10 mins
    refetchOnWindowFocus: true
  });
};

// Uso en componente
const { data: attendees, isLoading, error, refetch } = useAttendees(eventId);
```

#### Mutations
```typescript
// hooks/mutations/useCheckIn.ts
export const useCheckIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attendeeId, sessionId }) => {
      const { data, error } = await supabase
        .from('scans')
        .insert({
          attendee_id: attendeeId,
          session_id: sessionId,
          scanned_at: new Date().toISOString()
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['attendees', variables.sessionId]);
      queryClient.invalidateQueries(['scans', variables.sessionId]);
      
      toast.success('Check-in exitoso');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });
};
```

---

### 2. API Layer - Abstracción de Supabase

#### Problema
Supabase calls dispersos por todo el código = difícil de mantener y testear.

#### Solución: API Service Layer
```typescript
// services/api/attendees.api.ts
export class AttendeesAPI {
  static async getAll(eventId: string): Promise<Attendee[]> {
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', eventId);
      
    if (error) throw new APIError(error.message, error.code);
    return data;
  }
  
  static async getById(id: string): Promise<Attendee> {
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new APIError(error.message, error.code);
    return data;
  }
  
  static async create(attendee: CreateAttendeeDTO): Promise<Attendee> {
    const { data, error } = await supabase
      .from('attendees')
      .insert(attendee)
      .select()
      .single();
      
    if (error) throw new APIError(error.message, error.code);
    return data;
  }
  
  static async update(
    id: string,
    updates: Partial<Attendee>
  ): Promise<Attendee> {
    const { data, error } = await supabase
      .from('attendees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new APIError(error.message, error.code);
    return data;
  }
  
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', id);
      
    if (error) throw new APIError(error.message, error.code);
  }
}

// services/api/errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

#### Uso
```typescript
// ANTES
const { data } = await supabase.from('attendees').select().eq('event_id', id);

// DESPUÉS
const attendees = await AttendeesAPI.getAll(eventId);
```

#### Beneficios
- ✅ Fácil de mockear en tests
- ✅ Type-safe
- ✅ Manejo de errores centralizado
- ✅ Fácil migrar a otro backend si es necesario

---

### 3. Feature Modules

#### Organización Actual
```
src/
├── components/  # 31 archivos mezclados
├── pages/       # 38 archivos mezclados
└── contexts/    # 8 archivos
```

#### Propuesta: Feature-based Structure
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── MagicLinkForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── auth.api.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts
│   │
│   ├── check-in/
│   │   ├── components/
│   │   │   ├── AttendeeList.tsx
│   │   │   ├── CheckInButton.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── hooks/
│   │   │   ├── useCheckIn.ts
│   │   │   └── useAttendeeSearch.ts
│   │   ├── pages/
│   │   │   └── CheckInDeskPage.tsx
│   │   ├── services/
│   │   │   └── checkin.api.ts
│   │   └── index.ts
│   │
│   ├── booth-map/
│   │   ├── components/
│   │   │   ├── BoothMap.tsx
│   │   │   ├── BoothCell.tsx
│   │   │   └── ZoneContainer.tsx
│   │   ├── hooks/
│   │   │   ├── useBoothLayout.ts
│   │   │   └── useBoothPositioning.ts
│   │   ├── utils/
│   │   │   └── boothPositioning.ts
│   │   └── index.ts
│   │
│   └── analytics/
│       ├── components/
│       │   ├── MetricCard.tsx
│       │   └── ChartContainer.tsx
│       ├── pages/
│       │   └── AnalyticsPage.tsx
│       └── index.ts
│
├── shared/
│   ├── components/  # UI components reutilizables
│   ├── hooks/       # Hooks genéricos
│   ├── utils/       # Utilidades generales
│   └── types/       # Tipos compartidos
│
└── core/
    ├── api/         # API layer
    ├── config/      # Configuración
    └── constants/   # Constantes globales
```

#### Beneficios
- 📁 Código relacionado agrupado
- 🔍 Fácil encontrar features
- ♻️ Reutilización clara (shared/)
- 🧪 Tests al lado del código
- 📦 Tree-shaking más eficiente

---

## 🔒 Seguridad y Rendimiento

### Seguridad

#### 1. Input Validation con Zod
```typescript
// utils/validation.ts
import { z } from 'zod';

export const attendeeSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'Nombre requerido').max(50),
  lastName: z.string().min(1, 'Apellido requerido').max(50),
  company: z.string().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido').optional()
});

export type AttendeeInput = z.infer<typeof attendeeSchema>;

// Uso
const validateAttendee = (input: unknown) => {
  try {
    return attendeeSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Mostrar errores específicos
      console.error(error.errors);
    }
    throw error;
  }
};
```

#### 2. Sanitización de HTML
```typescript
// utils/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
};

// Uso en componentes
<div dangerouslySetInnerHTML={{ 
  __html: sanitizeHTML(userContent) 
}} />
```

#### 3. Rate Limiting Client-side
```typescript
// hooks/useRateLimit.ts
export const useRateLimit = (maxCalls: number, window: number) => {
  const callsRef = useRef<number[]>([]);
  
  const canMakeCall = useCallback(() => {
    const now = Date.now();
    callsRef.current = callsRef.current.filter(
      time => now - time < window
    );
    
    if (callsRef.current.length >= maxCalls) {
      return false;
    }
    
    callsRef.current.push(now);
    return true;
  }, [maxCalls, window]);
  
  return canMakeCall;
};

// Uso
const canScan = useRateLimit(10, 60000); // 10 scans por minuto

const handleScan = () => {
  if (!canScan()) {
    toast.error('Demasiados scans, espera un momento');
    return;
  }
  // Proceder con scan
};
```

---

### Rendimiento

#### 1. Virtual Scrolling (Large Lists)
```typescript
// components/VirtualizedAttendeeList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualizedAttendeeList = ({ attendees }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: attendees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // altura estimada de cada fila
    overscan: 5 // renderizar 5 items extras arriba/abajo
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <AttendeeRow attendee={attendees[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### 2. Image Optimization
```typescript
// components/OptimizedImage.tsx
export const OptimizedImage = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState(
    `${src}?w=20&blur=10` // placeholder blurred
  );
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
    };
  }, [src]);
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};
```

#### 3. Memoization Strategy
```typescript
// ANTES: Re-renderiza en cada cambio de parent
const ExpensiveComponent = ({ data }) => {
  const processed = processData(data); // 🐌 LENTO
  return <div>{processed}</div>;
};

// DESPUÉS: Memoriza cálculo
const ExpensiveComponent = memo(({ data }) => {
  const processed = useMemo(
    () => processData(data),
    [data]
  );
  return <div>{processed}</div>;
});
```

---

## 🚀 DevOps y CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

### Husky Pre-commit Hooks

```bash
npm install --save-dev husky lint-staged

npx husky init
```

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

### Environment Variables Management

```bash
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENVIRONMENT=development
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=
```

```typescript
// config/env.ts
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
] as const;

// Validar en startup
requiredEnvVars.forEach(key => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
} as const;
```

---

## 📅 Hoja de Ruta de Implementación

### Sprint 1-2: Fundamentos (2 semanas)
```
[ ] Setup testing infrastructure
    ├─ [ ] Install Vitest + Testing Library
    ├─ [ ] Configurar coverage
    └─ [ ] Primer batch de tests (utils)

[ ] Fix Booth Map persistence ⭐⭐⭐⭐⭐
    ├─ [ ] Implementar React Query
    └─ [ ] Tests de integración

[ ] Error Boundary
    └─ [ ] Implementar en toda la app

[ ] Documentación
    └─ [ ] README técnico de cada feature
```

### Sprint 3-4: Refactorización (2 semanas)
```
[ ] Separar EventDataContext
    ├─ [ ] SessionContext
    ├─ [ ] BoothContext
    └─ [ ] ScanContext

[ ] API Service Layer
    ├─ [ ] AttendeesAPI
    ├─ [ ] SessionsAPI
    └─ [ ] ScansAPI

[ ] Code splitting
    └─ [ ] Lazy load todas las páginas

[ ] Tests: 30% coverage
```

### Sprint 5-6: Nuevas Features (2 semanas)
```
[ ] Analytics Dashboard Avanzado
    ├─ [ ] Heat map
    ├─ [ ] Journey funnel
    └─ [ ] Real-time alerts

[ ] Gamificación Básica
    ├─ [ ] Sistema de puntos
    └─ [ ] Leaderboard

[ ] Tests: 50% coverage
```

### Sprint 7-8: Performance & Security (2 semanas)
```
[ ] Performance
    ├─ [ ] Virtual scrolling
    ├─ [ ] Image optimization
    └─ [ ] Bundle analysis

[ ] Security
    ├─ [ ] Input validation (Zod)
    ├─ [ ] Rate limiting
    └─ [ ] Security audit

[ ] Tests: 70% coverage
```

### Sprint 9-10: DevOps & Monitoring (2 semanas)
```
[ ] CI/CD
    ├─ [ ] GitHub Actions
    ├─ [ ] Automated deployments
    └─ [ ] Husky hooks

[ ] Monitoring
    ├─ [ ] Sentry integration
    ├─ [ ] Analytics
    └─ [ ] Performance monitoring

[ ] E2E Tests
    └─ [ ] 5 happy paths críticos
```

---

## 📊 KPIs de Éxito

### Métricas Técnicas
- **Test Coverage**: 0% → 70% (6 meses)
- **Bundle Size**: ~2MB → <500KB (inicial)
- **Lighthouse Score**: ? → 90+ (Performance, A11y, Best Practices, SEO)
- **TypeScript Strictness**: Partial → Full strict mode
- **Code Duplication**: ? → <5%

### Métricas de Negocio
- **Time to Interactive**: ? → <2s
- **Error Rate**: ? → <0.1%
- **User Satisfaction (NPS)**: ? → 80+
- **Feature Adoption**: Booth Map 20% → 60%

---

## 🎓 Recursos Recomendados

### Testing
- [Vitest Docs](https://vitest.dev)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Docs](https://playwright.dev)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

### Architecture
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)

---

## 📝 Conclusión

Este plan cubre desde issues críticos (Booth Map) hasta mejoras a largo plazo (AI Matchmaking). 

**Prioridades Recomendadas:**
1. ⭐⭐⭐⭐⭐ **Fix Booth Map** (Bloqueante)
2. ⭐⭐⭐⭐⭐ **Setup Testing** (Crítico)
3. ⭐⭐⭐⭐ **Refactor EventDataContext** (Mantenibilidad)
4. ⭐⭐⭐⭐ **Error Boundaries** (UX)
5. ⭐⭐⭐ **Code Splitting** (Performance)

**Siguiente Paso:** Revisar este documento con el equipo y priorizar según recursos y objetivos de negocio.
