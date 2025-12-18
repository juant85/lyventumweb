#!/bin/bash

# 🚀 Pre-Deploy Verification Script
# Verifica que tu proyecto esté listo para deployment en Vercel

echo "🔍 Verificando preparación para deployment en Vercel..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check
check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $2${NC}"
    ((FAILED++))
  fi
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

# 1. Check Node version
echo "📦 Verificando Node.js..."
node -v > /dev/null 2>&1
check $? "Node.js instalado"

# 2. Check if package.json exists
echo ""
echo "📋 Verificando archivos de configuración..."
[ -f "package.json" ]
check $? "package.json existe"

# 3. Check build script
if grep -q '"build"' package.json; then
  check 0 "Script 'build' configurado en package.json"
else
  check 1 "Script 'build' NO encontrado en package.json"
fi

# 4. Check vite.config.ts
[ -f "vite.config.ts" ]
check $? "vite.config.ts existe"

# 5. Check vercel.json
[ -f "vercel.json" ]
check $? "vercel.json existe"

# 6. Check .gitignore
echo ""
echo "🔒 Verificando seguridad..."
if [ -f ".gitignore" ]; then
  check 0 ".gitignore existe"
  
  if grep -q ".env.local" .gitignore; then
    check 0 ".env.local está en .gitignore"
  else
    check 1 ".env.local NO está en .gitignore (CRÍTICO)"
  fi
else
  check 1 ".gitignore NO existe"
fi

# 7. Check if .env.local exists (should not be committed)
if [ -f ".env.local" ]; then
  warn ".env.local existe localmente (OK, pero NO lo commits)"
else
  warn ".env.local no encontrado (necesitarás configurar variables en Vercel)"
fi

# 8. Try to build
echo ""
echo "🏗️  Intentando build local..."
if npm run build > /dev/null 2>&1; then
  check 0 "Build exitoso localmente"
  
  # Check if dist folder was created
  if [ -d "dist" ]; then
    check 0 "Carpeta 'dist' generada"
    
    # Check if index.html exists in dist
    if [ -f "dist/index.html" ]; then
      check 0 "dist/index.html generado"
    else
      check 1 "dist/index.html NO encontrado"
    fi
  else
    check 1 "Carpeta 'dist' NO generada"
  fi
else
  check 1 "Build FALLÓ (revisa errores arriba)"
fi

# 9. Check git status
echo ""
echo "📝 Verificando Git..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  check 0 "Git inicializado"
  
  # Check if there's a remote
  if git remote -v | grep -q "origin"; then
    check 0 "Remote 'origin' configurado"
    
    # Get remote URL
    REMOTE_URL=$(git remote get-url origin 2>/dev/null)
    echo "   Repository: $REMOTE_URL"
  else
    check 1 "Remote 'origin' NO configurado"
  fi
  
  # Check for uncommitted changes
  if [ -z "$(git status --porcelain)" ]; then
    check 0 "No hay cambios sin commitear"
  else
    warn "Tienes cambios sin commitear"
    echo "   Archivos modificados:"
    git status --short | head -5
  fi
else
  check 1 "Git NO inicializado"
fi

# 10. Check for required environment variables in code
echo ""
echo "🔑 Verificando uso de variables de entorno..."
if grep -r "VITE_SUPABASE_URL" src/ > /dev/null 2>&1; then
  warn "Código usa VITE_SUPABASE_URL (recuerda configurarlo en Vercel)"
fi
if grep -r "VITE_SUPABASE_ANON_KEY" src/ > /dev/null 2>&1; then
  warn "Código usa VITE_SUPABASE_ANON_KEY (recuerda configurarlo en Vercel)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Verificaciones pasadas: $PASSED${NC}"
echo -e "${RED}❌ Verificaciones falladas: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Advertencias: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ¡Tu proyecto está listo para deployment en Vercel!${NC}"
  echo ""
  echo "Próximos pasos:"
  echo "1. Commit y push a GitHub (si no lo has hecho)"
  echo "2. Ve a vercel.com y conecta tu repositorio"
  echo "3. Configura las variables de entorno en Vercel"
  echo "4. ¡Deploy! 🚀"
  exit 0
else
  echo -e "${RED}⚠️  Hay problemas que debes resolver antes de deployar.${NC}"
  echo ""
  echo "Revisa los errores arriba y corrígelos."
  exit 1
fi
