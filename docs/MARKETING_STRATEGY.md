# Estrategia de Estandarización de Planes y Precios para LyVentum

## 1. Filosofía de Estandarización
Aunque la arquitectura de LyVentum es modular y flexible, presentar demasiadas opciones al cliente puede causar "parálisis por análisis". La estandarización busca:
*   **Simplificar la Venta:** El cliente entiende rápidamente qué obtiene.
*   **Upselling Natural:** Crear una escalera de valor clara donde el siguiente plan resuelve problemas más complejos.
*   **Eficiencia Operativa:** Menos configuraciones únicas que mantener.

## 2. Propuesta de Estructura de Planes (Tiers)
Basado en las *features* encontradas en tu código (`src/features.ts`), propongo dividir la oferta en 3 niveles claros.

### Plan A: "Essentials" (Smart Operations & Real-Time Data)
*Ideal para organizadores que quieren dejar atrás el Excel y ver su evento cobrar vida en tiempo real.*

**La Promesa:** "Tu evento en vivo, no en reportes post-evento."

**Features Incluidas:**
*   ⚡ **Real-Time Core:** `REAL_TIME_ANALYTICS`, `DASHBOARD`, `DATA_VISUALIZATION`. (Ver cuánta gente hay *ahora mismo*, ocupación de salas en vivo).
*   ✅ **Check-in Ágil:** `CHECK_IN_DESK`, `CHECK_IN_PHOTO`, `QR_SCANNER`.
*   ✅ **Gestión:** `ATTENDEE_PROFILES`, `DATA_EDITOR`, `SESSION_SETTINGS`.
*   ✅ **Portal Básico:** `ATTENDEE_PORTAL` (Agenda y QR).

**Diferenciador Clave:** A diferencia de la competencia que cobra extra por "Analytics", nosotros lo damos desde el inicio porque es nuestro ADN.

---

### Plan B: "Professional" (Engagement & Communication)
*Para quienes quieren dejar de ser solo "organizadores" y convertirse en "anfitriones" que interactúan.*

**Enfoque:** Comunicación bidireccional y Networking.

**Features Incluidas (Todo lo de Essentials +):**
*   🚀 **Engagement Tools:** `ATTENDEE_NETWORKING` (Directorios), `BOOTH_QA` (Preguntas a Stands/Staff).
*   📅 **Agenda Pro:** `CALENDAR_SYNC`, `SESSION_REMINDERS`, `DAILY_EMAIL_AGENDA`.
*   🗺️ **Visualización:** `BOOTH_MAP` (Mapa Esquemático de Ocupación), `TRACKS`.
*   📨 **Comunicaciones Completas:** `EMAIL_COMMUNICATIONS`, `ATTENDEE_ALERTS` (Notificaciones push/email en tiempo real).

---

### Plan C: "Enterprise / Full Experience" (Gamificación & Comercialización)
*Para maximizar el ROI, monetizar sponsors y crear una experiencia inolvidable.*

**Enfoque:** Maximizar el ROI de los patrocinadores y la diversión de los asistentes.

**Features Incluidas (Todo lo de Professional +):**
*   🏆 **Gamificación Completa:** `BOOTH_CHALLENGE`, `ACHIEVEMENT_SYSTEM`, `LEADERBOARD`
*   🤝 **Proveedores & Sponsors:** `VENDOR_PROFILES`, `SPONSORSHIP` (Gestión de patrocinadores)
*   📍 **Tecnología Avanzada:** `ATTENDEE_LOCATOR` (Si aplica hardware/wifi), `SCANNER` (Lead retrieval para expositores)
*   🎨 **Personalización Total:** Whitelabeling (Marca blanca), Dominio personalizado.
*   🔧 **Soporte:** Soporte dedicado, SLA de uptime.

## 3. Estrategia de Precios (Pricing)

El precio del software de eventos suele seguir uno de dos modelos. Dado que LyVentum tiene componentes "físicos/operativos" (check-in) y "digitales" (app/networking), el modelo **Híbrido por Asistente** es el más rentable y escalable.

### Modelo Recomendado: Costo Base + Fee por Asistente

Este modelo reduce la barrera de entrada y escala con el éxito del cliente.

| Concepto | Plan Essentials | Plan Professional | Plan Enterprise |
| :--- | :--- | :--- | :--- |
| **Licencia Base (por evento)** | $499 USD | $1,299 USD | Contactar Ventas |
| **Fee por Asistente** | $1.50 USD | $3.50 USD | Negociable (Volumen) |
| **Usuarios Admin** | 3 Incluidos | 10 Incluidos | Ilimitados |
| **Soporte** | Email | Email + Chat | Dedicado 24/7 |

**Análisis Competitivo (Estimado Mercado Global):**
*   **Cvent / grandes jugadores:** Cobran decenas de miles de dólares de base.
*   **Eventbrite / soluciones ticketeras:** Cobran % del ticket (aprox 3-5% + $1 por ticket).
*   **Whova / Apps de eventos:** Suelen cobrar entre $3k - $8k por evento mediano.

**Recomendación de Precio Final (LyVentum):**
Si tu objetivo es penetración de mercado rápida:
*   **Essentials:** $990 USD Flat (hasta 500 asistentes).
*   **Professional:** $2,490 USD Flat (hasta 1,000 asistentes).
*   **Enterprise:** Custom.

*Nota: Es mejor cobrar "Por Evento" que "Mensual" para este tipo de software, a menos que tus clientes sean agencias que hacen eventos todo el año. En ese caso, ofreces una **Licencia Anual "Agency"** (ej. $15k/año por eventos ilimitados hasta X asistentes).*

## 4. Implementación Técnica en Landing

1.  **Switch de "Mensual / Anual" vs "Por Evento":** Decide si vendes SaaS recurrente o transaccional.
2.  **Tabla Comparativa:** Usa los grupos de features que definimos arriba. No listes *cada* feature pequeña, agrupa por valor (ej. "Suite de Gamificación" en lugar de listar cada logro).
3.  **Call to Action (CTA):**
    *   Essentials/Pro: "Empezar Ahora" o "Comprar Licencia".
    *   Enterprise: "Hablar con Ventas" o "Solicitar Demo".

## 5. Siguientes Pasos
1.  **Refinar Features:** Revisa si alguna feature del plan "Enterprise" es crítica para el "Essentials" y ajusta.
2.  **Validar Costos:** Asegúrate que el precio cubra tus costos de servidor (Supabase/Resend), especialmente el envío de emails y almacenamiento de fotos.
3.  **Actualizar el Admin:** Configura estos 3 planes como "Templates" en tu `SuperAdminPlansPage` para poder asignarlos rápidamente a nuevos clientes.
