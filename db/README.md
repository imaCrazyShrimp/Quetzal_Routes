# QUETZAL ROUTES — Documentación de Base de Datos
## Capa 1 de 3 (Divide y Vencerás)

---

## Archivos entregados

| Archivo | Descripción |
|---|---|
| `schema.sql` | Schema completo listo para ejecutar en SQLite o PostgreSQL |
| `db.json` | Datos mock realistas para desarrollo y pruebas |

---

## Diagrama de relaciones (ERD simplificado)

```
users (1) ──────────────── (1) providers
  │                               │
  │                               │ (1)
  │ (N)                           │
  │                          (N) destinations (N) ──── (N) destination_images
  │                               │
  │ (N)                           │ (N)
  │                               │
reviews (N) ────────────────────── (conecta user + destination)
bookings (N) ───────────────────── (conecta user + destination)
subscriptions (N) ─────────────── (historial de planes del provider)
```

---

## Descripción de tablas

### `users`
Todos los actores del sistema. El campo `role` determina qué puede hacer cada uno.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Identificador único |
| `name` | TEXT | Nombre completo |
| `email` | TEXT UNIQUE | Email (login) |
| `password_hash` | TEXT | Contraseña encriptada con bcrypt |
| `language` | TEXT | Idioma preferido: `es` o `en` |
| `role` | TEXT | `tourist`, `provider` o `admin` |
| `avatar_url` | TEXT | Foto de perfil (opcional) |

---

### `providers`
Perfil de negocio de cada empresa turística. Solo usuarios con `role = 'provider'`.

| Campo | Tipo | Descripción |
|---|---|---|
| `user_id` | FK → users | Relación 1:1 con users |
| `business_name` | TEXT | Nombre del negocio |
| `description_es/en` | TEXT | Descripción bilingüe |
| `whatsapp` | TEXT | Número para contacto directo (plan premium+) |
| `plan` | TEXT | `free`, `premium` o `elite` |
| `plan_expiry` | DATETIME | Cuándo vence el plan |
| `verified` | BOOLEAN | Admin verificó al proveedor |

---

### `destinations`
El corazón del sistema. Cada atractivo turístico publicado.

| Campo | Tipo | Descripción |
|---|---|---|
| `provider_id` | FK → providers | Quién publicó este destino |
| `title` | TEXT | Nombre del tour/destino |
| `description_es/en` | TEXT | Descripción bilingüe |
| `category` | TEXT | `nature`, `culture`, `adventure`, `gastronomy`, `wellness`, `history` |
| `department` | TEXT | Región de Guatemala (21 departamentos) |
| `lat / lng` | REAL | Coordenadas para mapa |
| `price_from / price_to` | REAL | Rango de precios en USD |
| `duration_hours` | REAL | Duración estimada |
| `status` | TEXT | `pending` → admin aprueba → `active` |
| `featured` | BOOLEAN | Aparece en "Recomendados" (plan premium+) |
| `views_count` | INTEGER | Contador de visitas |

---

### `reviews`
Reseñas de turistas. **Una reseña por turista por destino** (restricción UNIQUE).

| Campo | Tipo | Descripción |
|---|---|---|
| `rating` | INTEGER | 1 a 5 estrellas |
| `comment` | TEXT | Comentario escrito |
| `language` | TEXT | Idioma del comentario |

---

### `bookings`
Reservas con cálculo automático de comisión.

**Regla de negocio:**
```
total_amount     = precio × personas
commission_amount = total_amount × 0.10   (10% para Quetzal Routes)
net_to_provider  = total_amount × 0.90   (90% para el proveedor)
```

| Estado | Significado |
|---|---|
| `pending` | Reserva enviada, esperando confirmación del proveedor |
| `confirmed` | Proveedor confirmó disponibilidad |
| `cancelled` | Cancelada por cualquiera de las partes |
| `completed` | Tour realizado exitosamente |

---

### `subscriptions`
Historial de pagos de planes. Permite auditoría y renovaciones.

---

## Vistas (Views)

### `destinations_with_rating`
Consulta optimizada para mostrar destinos con su rating calculado:
```sql
SELECT * FROM destinations_with_rating
WHERE category = 'adventure'
ORDER BY avg_rating DESC;
```

### `provider_dashboard`
Métricas para el panel de proveedor (disponible solo en plan Elite):
```sql
SELECT * FROM provider_dashboard WHERE provider_id = 1;
```

---

## Reglas de negocio reflejadas en la BD

| Regla | Implementación |
|---|---|
| Plan Free: máx 3 fotos | Verificado en lógica JS (`subscriptions.js`) |
| Plan Free: máx 1 destino | Verificado en lógica JS antes de `INSERT` |
| Un turista, una reseña | `UNIQUE(destination_id, user_id)` en tabla reviews |
| Destino nuevo = pendiente | `status DEFAULT 'pending'` |
| Featured = solo premium+ | Verificado en lógica JS |
| Comisión = 10% exacto | Calculado y guardado en `bookings` |

---

## Datos mock incluidos (db.json)

| Entidad | Cantidad | Detalles |
|---|---|---|
| Usuarios | 6 | 1 admin, 3 proveedores, 2 turistas |
| Proveedores | 3 | Free, Premium y Elite (uno de cada plan) |
| Destinos | 5 | Atitlán, Tikal, Antigua, Volcán San Pedro, Semuc Champey |
| Imágenes | 13 | 2-3 por destino |
| Reseñas | 5 | Todas en inglés (turistas extranjeros) |
| Reservas | 3 | En diferentes estados |
| Suscripciones | 3 | Una por proveedor |

### Destinos de prueba (lugares reales de Guatemala)
1. **Kayak Tour — Lago de Atitlán** (Sololá) — Aventura — $35–$50
2. **Expedición Tikal** (Petén) — Historia — $75–$110
3. **Tour Histórico Antigua Guatemala** (Sacatepéquez) — Cultura — $20–$30
4. **Volcán San Pedro** (Sololá) — Naturaleza — $45–$65
5. **Semuc Champey** (Alta Verapaz) — Naturaleza — $55–$80

---

## Próximo paso: Capa 2 — Lógica JS

Con la BD definida, el siguiente bloque construye los módulos JavaScript:
- `api.js` — comunicación con backend
- `auth.js` — login / registro / sesiones
- `destinations.js` — CRUD de destinos
- `filters.js` — búsqueda y filtros
- `i18n.js` — sistema bilingüe ES/EN
- `reviews.js`, `bookings.js`, `ui.js`, `maps.js`
