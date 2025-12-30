# Crear Usuario de Prueba y Probar Vista Mobile

## 🎯 Objetivo
Crear un superadmin de prueba en Supabase y usarlo para acceder a la plataforma y verificar la vista mobile.

---

## 📝 Método 1: Supabase Dashboard (MÁS FÁCIL) ⭐

### Paso 1: Crear Usuario en Dashboard
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto: **Lyventum**
3. Navega a: **Authentication** → **Users** (en el menú lateral)
4. Click: **"Add user"** → **"Create new user"**
5. Completa el formulario:
   ```
   Email: test@lyventum.com
   Password: TestAdmin123!
   ☑ Auto Confirm User (marcar checkbox)
   ```
6. Click: **"Create user"**
7. Copia el **User ID** que aparece (lo necesitas para el siguiente paso)

### Paso 2: Asignar Rol Superadmin
1. En el mismo dashboard, ve a: **SQL Editor** (menú lateral)
2. Click: **"New query"**
3. Pega este SQL:
   ```sql
   UPDATE public.profiles
   SET role = 'superadmin'
   WHERE email = 'test@lyventum.com';
   ```
4. Click: **"Run"** (o presiona Cmd/Ctrl + Enter)
5. Debería decir: **"Success. 1 row(s) affected"**

### Paso 3: Verificar
Ejecuta esta query para confirmar:
```sql
SELECT id, email, role, created_at
FROM public.profiles
WHERE email = 'test@lyventum.com';
```

Deberías ver:
```
id: [UUID]
email: test@lyventum.com
role: superadmin
created_at: [timestamp]
```

---

## 🔧 Método 2: SQL Script (Avanzado)

Si prefieres hacerlo todo por SQL:

### Archivo Creado
He creado: `scripts/create_test_superadmin.sql`

### Usar el Script
1. Ve a Supabase: **SQL Editor**
2. Copy/paste el contenido del archivo
3. Ejecuta la sección "ALTERNATIVE: Single Transaction"
4. Debería mostrar: "Superadmin created with ID: [UUID]"

---

## 🧪 Probar la Vista Mobile

### Paso 1: Login
1. Abre: http://localhost:5173/login
2. Ingresa credenciales:
   ```
   Email: test@lyventum.com
   Password: TestAdmin123!
   ```
3. Click: **"Inicio de Sesión"**
4. Deberías ser redirigido al dashboard

### Paso 2: Activar Vista Mobile
**Con Chrome DevTools:**
1. Presiona: `Cmd + Shift + M` (Mac) o `Ctrl + Shift + M` (Windows)
2. Selecciona dispositivo: **"iPhone 12 Pro"** (o cualquier <768px)
3. La página debería cambiar automáticamente

**Deberías ver:**
- ✅ **Bottom Navigation** (fija abajo con 4 iconos)
- ✅ **Header minimal** (sin sidebar)
- ✅ **Event chip** en header
- ✅ Menu hamburger en header

### Paso 3: Navegar al Dashboard Visualización
1. Click en **"More"** (⋯) en el bottom nav
   - O ve directamente a: http://localhost:5173/admin/data-visualization
2. **Vista Mobile esperada:**
   ```
   [Header minimal con event chip]
   
   [SessionBanner grande - verde/azul/gris]
   
   [2 Quick Stats lado a lado]
   ┌─────────┐ ┌─────────┐
   │ Present │ │ Active  │
   │   234   │ │  18/25  │
   └─────────┘ └─────────┘
   
   [Booth List - vertical]
   ┌─────────────────────────────┐
   │ 🟢 Booth A1    45/50 ━━━━■ │
   │    Microsoft               │
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │ 🟡 Booth A2    12/50 ━━■   │
   │    Google                  │
   └─────────────────────────────┘
   
   [Bottom Nav: 🏠 📷 📊 ⋯]
   ```

### Paso 4: Interacción
1. **Tap en booth card** → Debería abrir modal con detalles
2. **Tap en bottom nav icons** → Debería navegar
3. **Scroll vertical** → Lista de booths
4. **Header menu** → Slide-out con opciones

---

## 🖥️ Verificar que Desktop NO Cambió

### Paso 1: Desactivar Mobile Mode
1. Presiona: `Cmd + Shift + M` (toggle off)
2. O resize window a >768px

### Paso 2: Verificar
**Deberías ver:**
- ✅ Sidebar (256px ancho, izquierda)
- ✅ 4 Stats cards en grid (2x2)
- ✅ Booth grid con columnas
- ✅ Header completo con controles
- ✅ NO bottom navigation

---

## 📸 Capturar Screenshots

### Mobile View
```bash
# En DevTools con mobile mode activo:
1. Cmd + Shift + P (Command palette)
2. Type: "Capture screenshot"
3. Select: "Capture full size screenshot"
4. Guarda como: mobile_dashboard.png
```

### Desktop View
```bash
# En DevTools con mobile mode desactivado:
1. Mismo proceso
2. Guarda como: desktop_dashboard.png
```

---

## 🔍 Troubleshooting

### Problema: "Invalid login credentials"
**Causa:** Usuario no creado correctamente en Supabase

**Solución:**
1. Verifica en Supabase Dashboard → Authentication → Users
2. Debería aparecer: test@lyventum.com
3. Check que "Email Confirmed" = ✓

### Problema: "No veo bottom navigation en mobile"
**Causa:** Width del viewport >= 768px

**Solución:**
1. En DevTools, verifica width actual (arriba del viewport)
2. Debe decir: 390px o similar (<768px)
3. Si dice 768px o más, cambia a un dispositivo más pequeño

### Problema: "Veo sidebar en mobile"
**Causa:** El hook `useIsMobile` no detecta correctamente

**Solución:**
1. Hard refresh: Cmd + Shift + R
2. Check console: `console.log(window.innerWidth)`
3. Debe ser <768

### Problema: "No veo SessionBanner o booth cards"
**Causa:** Posible error en componentes o no hay datos

**Solución:**
1. Abre DevTools → Console
2. Busca errores rojos
3. Verifica que hay eventos/sesiones creados
4. Si no hay eventos, crea uno en Settings → Events

---

## ✅ Checklist de Verificación

### Usuario Creado:
- [ ] Usuario existe en Supabase (Authentication → Users)
- [ ] Email confirmed = ✓
- [ ] Profile tiene role = 'superadmin'
- [ ] Puedo hacer login exitosamente

### Vista Mobile:
- [ ] Bottom nav visible (4 icons)
- [ ] Header minimal (sin sidebar)
- [ ] SessionBanner muestra status
- [ ] 2 Quick Stats visibles
- [ ] Booth cards son full-width
- [ ] Modal abre al tap en booth
- [ ] Scroll vertical funciona

### Vista Desktop:
- [ ] Sidebar visible (izquierda)
- [ ] 4 Stats en grid
- [ ] Booth grid con columnas
- [ ] NO bottom nav
- [ ] Todo igual que antes

---

## 🗑️ Limpieza (Después de Testing)

Cuando termines de probar, puedes eliminar el usuario:

```sql
-- En Supabase SQL Editor:
DELETE FROM public.profiles WHERE email = 'test@lyventum.com';
DELETE FROM auth.users WHERE email = 'test@lyventum.com';
```

O simplemente elimínalo desde Supabase Dashboard → Authentication → Users → Delete.

---

## 🎯 Credenciales de Acceso

```
URL: http://localhost:5173/login
Email: test@lyventum.com
Password: TestAdmin123!
```

**¡Listo para probar!** 🚀
