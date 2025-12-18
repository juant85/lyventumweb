# 🎯 Plan de Implementación: Fix Booth Map Persistence

> **Prioridad:** ⭐⭐⭐⭐⭐ CRÍTICA  
> **Estimación:** 4-6 horas  
> **Bloqueante:** Sí - Feature principal no funciona

---

## 📋 Problema Actual

El layout personalizado del Booth Map **NO persiste** después de:
- ✅ Guardar → DB actualiza correctamente
- ❌ Component re-renderiza → Layout se resetea
- ❌ Cambiar sesión → Layout desaparece
- ❌ Refrescar página → Vuelve al default

**Causa Raíz:** Race condition entre save y state updates. El `useEffect` sobrescribe con datos stale del context.

---

## 🛠️ Solución: React Query + State Management Mejorado

### Arquitectura Nueva

```
DataVisualizationPage (Parent)
├─ React Query: Maneja cache + mutations
├─ Local State: layoutConfig (optimistic updates)
└─ BoothMap (Child)
   └─ Recibe config fresh del padre
```

---

## 📝 Pasos de Implementación

### **Paso 1: Instalar Dependencias** (5 min)

```bash
npm install @tanstack/react-query
```

### **Paso 2: Setup React Query Provider** (10 min)

#### Archivo: `src/main.tsx` o `src/App.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Crear cliente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Envolver app
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Tu app actual */}
      <YourApp />
      
      {/* DevTools solo en dev */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

**Verificar:**
- ✅ App arranca sin errores
- ✅ React Query DevTools aparece (botón flotante abajo izquierda)

---

### **Paso 3: Crear Custom Hook para Event Query** (20 min)

#### Archivo NUEVO: `src/hooks/queries/useEventConfig.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';
import { BoothLayoutConfig } from '@/types';
import { toast } from 'react-hot-toast';

// Query key factory
export const eventKeys = {
  all: ['events'] as const,
  detail: (id: string) => [...eventKeys.all, id] as const,
  config: (id: string) => [...eventKeys.detail(id), 'config'] as const
};

// Hook para obtener layout config
export const useEventLayoutConfig = (eventId: string | undefined) => {
  return useQuery({
    queryKey: eventKeys.config(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('No event ID');

      const { data, error } = await supabase
        .from('events')
        .select('booth_layout_config')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      
      return data.booth_layout_config as BoothLayoutConfig | null;
    },
    enabled: !!eventId, // Solo ejecuta si hay eventId
    staleTime: 10 * 60 * 1000 // El config rara vez cambia
  });
};

// Hook para actualizar layout config
export const useUpdateLayoutConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      config 
    }: { 
      eventId: string; 
      config: BoothLayoutConfig 
    }) => {
      console.log('🚀 Saving layout config:', config);

      const { data, error } = await supabase
        .from('events')
        .update({ booth_layout_config: config })
        .eq('id', eventId)
        .select('booth_layout_config')
        .single();

      if (error) throw error;
      
      console.log('✅ Layout saved to DB:', data);
      return data.booth_layout_config as BoothLayoutConfig;
    },
    
    onMutate: async ({ eventId, config }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ 
        queryKey: eventKeys.config(eventId) 
      });

      // Snapshot del valor anterior (para rollback)
      const previousConfig = queryClient.getQueryData(
        eventKeys.config(eventId)
      );

      // Optimistic update
      queryClient.setQueryData(
        eventKeys.config(eventId),
        config
      );

      // Retornar context para rollback
      return { previousConfig };
    },
    
    onError: (error, { eventId }, context) => {
      // Rollback en caso de error
      if (context?.previousConfig) {
        queryClient.setQueryData(
          eventKeys.config(eventId),
          context.previousConfig
        );
      }
      
      console.error('❌ Error saving layout:', error);
      toast.error('Error al guardar layout');
    },
    
    onSuccess: (data, { eventId }) => {
      // Invalidar para refetch
      queryClient.invalidateQueries({ 
        queryKey: eventKeys.config(eventId) 
      });
      
      console.log('✅ Layout saved successfully');
      toast.success('Layout guardado correctamente');
    }
  });
};
```

**Verificar:**
- ✅ Archivo compila sin errores TypeScript
- ✅ Imports resuelven correctamente

---

### **Paso 4: Actualizar DataVisualizationPage** (30 min)

#### Archivo: `src/pages/admin/DataVisualizationPage.tsx`

**ANTES:**
```typescript
const [layoutConfig, setLayoutConfig] = useState<BoothLayoutConfig | undefined>(
  currentEvent?.boothLayoutConfig || undefined
);

useEffect(() => {
  setLayoutConfig(currentEvent?.boothLayoutConfig || undefined);
}, [currentEvent?.id]);

const handleSaveLayout = async (newConfig: BoothLayoutConfig) => {
  // ... código actual
};
```

**DESPUÉS:**
```typescript
import { useEventLayoutConfig, useUpdateLayoutConfig } from '@/hooks/queries/useEventConfig';

// ... dentro del componente

// Query del config
const { 
  data: savedLayoutConfig, 
  isLoading: isLoadingConfig 
} = useEventLayoutConfig(selectedEventId);

// Mutation para guardar
const { 
  mutate: saveLayout, 
  isPending: isSaving 
} = useUpdateLayoutConfig();

// Estado local para edición (opcional, para draft changes)
const [draftConfig, setDraftConfig] = useState<BoothLayoutConfig | undefined>();

// Determinar qué config usar
const layoutConfig = draftConfig || savedLayoutConfig || undefined;

// Handler simplificado
const handleSaveLayout = (newConfig: BoothLayoutConfig) => {
  if (!selectedEventId) return;
  
  // Guardar via mutation
  saveLayout({
    eventId: selectedEventId,
    config: newConfig
  });
  
  // Limpiar draft
  setDraftConfig(undefined);
};

// Reset draft cuando cambia el evento
useEffect(() => {
  setDraftConfig(undefined);
}, [selectedEventId]);
```

**Actualizar JSX:**
```typescript
<BoothMap
  booths={boothDataForGrid}
  config={layoutConfig}
  onBoothClick={handleOpenBoothModal}
  onSaveLayout={handleSaveLayout}
  isLoading={isLoadingConfig || isSaving}
/>
```

**Verificar:**
- ✅ Página carga sin errores
- ✅ `layoutConfig` se muestra en React Query DevTools
- ✅ `isSaving` aparece como `false` inicialmente

---

### **Paso 5: Simplificar BoothMap** (20 min)

#### Archivo: `src/components/booths/BoothMap.tsx`

**ELIMINAR:**
```typescript
// ❌ Este useEffect ya NO es necesario
useEffect(() => {
  console.log('🔍 BoothMap useEffect - Syncing localConfig with prop:', config);
  setLocalConfig(config);
}, [config]);
```

**MANTENER:**
```typescript
const [isEditing, setIsEditing] = useState(false);
const [localConfig, setLocalConfig] = useState<BoothLayoutConfig>(config);

// Solo actualizar al cambiar prop si NO estamos editando
useEffect(() => {
  if (!isEditing) {
    setLocalConfig(config);
  }
}, [config, isEditing]);
```

**handleSave simplificado:**
```typescript
const handleSave = () => {
  const newCustomOrder = { ...(localConfig.customOrder || {}) };
  
  Object.keys(zones).forEach(zoneKey => {
    newCustomOrder[zoneKey] = zones[zoneKey].map(item => item.booth.id);
  });

  const finalConfig = {
    ...localConfig,
    customOrder: newCustomOrder
  };

  console.log('💾 Saving config:', finalConfig);

  // Llamar al handler del padre
  if (onSaveLayout) {
    onSaveLayout(finalConfig);
  }
  
  // Actualizar local
  setLocalConfig(finalConfig);
  
  // Salir de modo edición
  setIsEditing(false);
};
```

**Verificar:**
- ✅ BoothMap renderiza correctamente
- ✅ Botón "Editar Orden" funciona
- ✅ Drag & drop funciona

---

### **Paso 6: Verificación en Base de Datos** (10 min)

Antes de probar, verificar que la columna existe:

```sql
-- En Supabase SQL Editor
SELECT 
  id, 
  name, 
  booth_layout_config 
FROM events 
WHERE id = 'tu-event-id';
```

**Debe retornar:**
- ✅ `booth_layout_config` existe
- ✅ Valor es `null` o un JSON object

Si no existe:
```sql
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS booth_layout_config JSONB;
```

---

### **Paso 7: Testing Manual** (30 min)

#### Test 1: Save básico
1. Abrir `/data-visualization`
2. Click "Editar Orden"
3. Arrastra **1 booth** de `left-wall` a `center-left`
4. Click "Guardar Orden"

**Expectativas:**
- ✅ Toast: "Layout guardado correctamente"
- ✅ Booth permanece en `center-left`
- ✅ React Query DevTools: mutation `success`
- ✅ Console: "✅ Layout saved successfully"

#### Test 2: Persistencia en refresh
1. Después del Test 1
2. **F5** (refresh página)

**Expectativas:**
- ✅ Booth sigue en `center-left`
- ✅ NO vuelve a `left-wall`

#### Test 3: Cambio de sesión
1. Con layout guardado
2. Cambiar sesión en selector
3. Volver a sesión original

**Expectativas:**
- ✅ Layout se mantiene
- ✅ Solo datos (números, colores) cambian

#### Test 4: Supabase verification
```sql
-- Verificar que el JSON está guardado
SELECT 
  booth_layout_config->'customOrder' as custom_order
FROM events 
WHERE id = 'tu-event-id';
```

**Expectativas:**
- ✅ Retorna JSON con IDs de booths
- ✅ `customOrder.center-left` contiene el ID del booth movido

---

## 🐛 Troubleshooting

### Problema: "Layout se resetea después de guardar"

**Diagnóstico:**
```typescript
// Agregar logs en handleSaveLayout
console.log('1. Config recibido:', newConfig);
console.log('2. Llamando saveLayout mutation');

// En useUpdateLayoutConfig
onSuccess: (data, { eventId }) => {
  console.log('3. Mutation success, data:', data);
  console.log('4. Invalidando query:', eventKeys.config(eventId));
}
```

**Verificar secuencia:**
```
1. Config recibido: { customOrder: { ... } }
2. Llamando saveLayout mutation
🚀 Saving layout config: { ... }
✅ Layout saved to DB: { ... }
3. Mutation success, data: { ... }
4. Invalidando query: ['events', 'event-id', 'config']
✅ Layout saved successfully
```

### Problema: "React Query no actualiza"

**Solución:**
```typescript
// Forzar refetch manual
const { refetch } = useEventLayoutConfig(selectedEventId);

// Después de save
saveLayout(
  { eventId, config },
  {
    onSuccess: () => {
      refetch(); // Force refresh
    }
  }
);
```

### Problema: "Config es undefined"

**Verificar:**
1. `selectedEventId` tiene valor
2. Query está `enabled: !!eventId`
3. DB tiene el registro

```typescript
console.log('EventId:', selectedEventId);
console.log('Query enabled:', !!selectedEventId);
console.log('Saved config:', savedLayoutConfig);
```

---

## 🔄 Rollback Plan

Si algo sale mal:

```bash
# 1. Revertir cambios de código
git checkout -- src/hooks/queries/useEventConfig.ts
git checkout -- src/pages/admin/DataVisualizationPage.tsx
git checkout -- src/components/booths/BoothMap.tsx

# 2. Desinstalar React Query (opcional)
npm uninstall @tanstack/react-query

# 3. Restaurar versión anterior
git checkout HEAD~1 -- src/
```

**Nota:** La base de datos NO necesita rollback (columna ya existía).

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] React Query instalado y Provider configurado
- [ ] `useEventLayoutConfig` hook creado y funcional
- [ ] `useUpdateLayoutConfig` mutation creada
- [ ] `DataVisualizationPage` actualizado
- [ ] `BoothMap` simplificado
- [ ] Test 1: Save básico ✅
- [ ] Test 2: Persistencia en refresh ✅
- [ ] Test 3: Cambio de sesión ✅
- [ ] Test 4: Verificación en Supabase ✅
- [ ] Console logs limpios (sin errores)
- [ ] React Query DevTools funciona
- [ ] Toast notifications correctas

---

## 📊 Métricas de Éxito

| Métrica | Antes | Después | ✅ |
|---------|-------|---------|---|
| Save funciona | ❌ No | ✅ Sí | |
| Persiste en refresh | ❌ No | ✅ Sí | |
| Persiste en session change | ❌ No | ✅ Sí | |
| DB actualiza | ✅ Sí | ✅ Sí | |
| State sync | ❌ Race condition | ✅ Optimistic | |
| User feedback | ⚠️ Confuso | ✅ Claro | |

---

## 🚀 Próximos Pasos (Después de Fix)

1. **Agregar Tests**
   ```typescript
   describe('Booth Map Persistence', () => {
     it('saves layout config', async () => {
       // Test con React Query
     });
   });
   ```

2. **Agregar Loading States**
   ```typescript
   {isSaving && <Spinner />}
   ```

3. **Agregar Undo/Redo**
   ```typescript
   const history = useRef<BoothLayoutConfig[]>([]);
   ```

4. **Error Boundary**
   ```typescript
   <ErrorBoundary fallback={<LayoutError />}>
     <BoothMap />
   </ErrorBoundary>
   ```

---

## 💡 Notas Adicionales

- **React Query DevTools** es TU AMIGO - úsalo para debuggear
- **Console logs** incluidos son temporales, eliminar después
- **Optimistic updates** mejoran UX 10x
- **Si funciona**, documentar para futuros features

**¿Listo para empezar?** 🎯
