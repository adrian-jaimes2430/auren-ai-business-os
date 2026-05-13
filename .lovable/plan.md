## Plan: Academia interactiva + Sistema de tickets de soporte

### 1. Academia (Educación interactiva)
Nueva ruta `/app/academy` accesible desde el sidebar con icono `GraduationCap`.

**Estructura:**
- Página principal con grid de "cursos" (módulos) categorizados:
  - **Primeros pasos**: Tour del workspace, configuración inicial
  - **CRM y Pipeline**: Crear contactos, mover deals, etapas
  - **Inbox y Conversaciones**: Gestión multicanal, respuestas
  - **Conexión de canales**: Guías paso a paso WhatsApp, Instagram, Facebook, Email (con capturas y deep-links a `/app/channels`)
  - **Automatizaciones**: Crear flujos, triggers, acciones
  - **IA**: Configurar autoreply, knowledge base
  - **Marketing**: Campañas, plantillas, audiencias
  - **Equipo y permisos**: Invitar miembros, roles

**Formato interactivo:**
- Cada módulo: lista de lecciones con `Accordion` expandible
- Cada lección: contenido en pasos (`Stepper` numerado), tips, callouts, botones "Ir ahora →" que navegan a la sección real
- Progreso local persistido en `localStorage` (`auren.academy.progress`) — checkbox al completar cada lección, barra de progreso por módulo
- Badges de "Completado" / "En curso"
- Sin backend: contenido estático en `src/content/academy.ts`

### 2. Sistema de tickets

**Base de datos** (migración):
- Enum `ticket_status`: `open`, `in_progress`, `waiting_user`, `resolved`, `closed`
- Enum `ticket_priority`: `low`, `normal`, `high`, `urgent`
- Tabla `support_tickets`:
  - `organization_id`, `created_by` (user), `assigned_to` (user, nullable), `subject`, `description`, `category`, `status`, `priority`, `resolved_at`
- Tabla `support_ticket_messages` (hilo de conversación):
  - `ticket_id`, `author_id`, `body`, `is_internal` (notas internas solo staff)
- Constante: workspace de soporte interno = "Company A&O Ecosystem" — staff = miembros de esa org. Helper `is_support_staff(_user_id)` que verifica membresía en la org soporte (slug fijo o flag `is_support_org` en `organizations`). Añadir columna `is_support_org boolean default false` y permitir que super_admin la marque.
- RLS:
  - Usuarios ven sus propios tickets (de su org)
  - Miembros del org ven tickets de su org
  - Staff de soporte (membresía en org soporte) y super_admin ven TODOS los tickets, pueden actualizar status/asignación
  - Mensajes `is_internal=true` solo visibles para staff/super_admin

**UI usuario** — `/app/support`:
- Botón "Nuevo ticket" → dialog con asunto/descripción/categoría/prioridad
- Lista de tickets propios con estado, prioridad, último update
- Detalle del ticket con hilo de mensajes y campo de respuesta

**UI super admin** — `/admin/tickets`:
- Tabla de todos los tickets con filtros por status/prioridad/org
- Detalle: cambiar status, prioridad, asignar a miembro de la org soporte (dropdown), agregar notas internas, responder al cliente
- Badge de tickets sin asignar en sidebar admin

### 3. Optimizaciones generales
- `useAuth`: cachear roles entre renders, evitar refetch en cada cambio de auth state — usar `useMemo` y solo recargar roles cuando cambia `user.id`
- `useOrganization`: memoizar membership lookup
- `AppGate`: skeleton en vez de texto plano, evitar flash de contenido
- Lazy-load rutas pesadas (`app.analytics`, `app.marketing`, `app.automations`) con `React.lazy` no aplica directamente en TanStack file routes — usar `loader` con dynamic imports queda fuera; en su lugar, mover componentes pesados de cada ruta a imports dinámicos en sus tabs internos donde aplique
- Realtime: revisar suscripciones duplicadas en `app.inbox` (si existen) y limpiar en `useEffect` cleanup
- Añadir índices DB: `support_tickets(organization_id, status)`, `support_tickets(assigned_to, status)`

### Archivos nuevos
- `src/routes/app.academy.tsx`
- `src/routes/app.support.tsx`
- `src/routes/admin.tickets.tsx` (sub-ruta admin)
- `src/content/academy.ts` (contenido de cursos)
- `src/hooks/use-tickets.ts`
- `src/hooks/use-academy-progress.ts`
- `supabase/migrations/...sql` (tabla tickets + RLS)

### Archivos editados
- `src/routes/app.tsx` (añadir links sidebar Academia + Soporte)
- `src/routes/admin.tsx` (añadir pestaña/sección Tickets)
- `src/hooks/use-auth.ts` (memoización)
- `src/hooks/use-organization.ts` (memoización)

### Plan de pruebas
1. Iniciar sesión con usuario normal → ver sidebar con "Academia" y "Soporte"
2. Academia: abrir un módulo, marcar lección completada, verificar progreso
3. Crear ticket desde `/app/support` → verificar aparece en lista
4. Iniciar sesión como super_admin → ir a `/admin` pestaña Tickets → ver el ticket creado
5. Asignar ticket a miembro del workspace "Company A&O Ecosystem" → verificar asignación
6. Responder con nota interna y mensaje público → verificar visibilidad por rol
7. Cambiar estado a `resolved` → verificar en panel de usuario
