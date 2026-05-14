-- ============================================================
--  QUETZAL ROUTES — Schema de Base de Datos
--  Versión: 1.0
--  Motor: SQLite (dev) / PostgreSQL (prod)
-- ============================================================

-- ------------------------------------------------------------
-- TABLA: users
-- Todos los usuarios del sistema (turistas, proveedores, admin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  language      TEXT    NOT NULL DEFAULT 'en' CHECK (language IN ('es', 'en')),
  role          TEXT    NOT NULL DEFAULT 'tourist' CHECK (role IN ('tourist', 'provider', 'admin')),
  avatar_url    TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: providers
-- Perfil extendido de las empresas turísticas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name  TEXT    NOT NULL,
  description_es TEXT,
  description_en TEXT,
  contact_email  TEXT,
  whatsapp       TEXT,
  website        TEXT,
  logo_url       TEXT,
  plan           TEXT    NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'elite')),
  plan_expiry    DATETIME,
  verified       INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),  -- 0=false, 1=true (map booleans on seed)
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: destinations
-- Destinos turísticos publicados por proveedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS destinations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id     INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,
  description_es  TEXT    NOT NULL,
  description_en  TEXT,
  category        TEXT    NOT NULL CHECK (category IN (
                    'nature', 'culture', 'adventure',
                    'gastronomy', 'wellness', 'history'
                  )),
  department      TEXT    NOT NULL CHECK (department IN (
                    'Guatemala', 'Sacatepequez', 'Chimaltenango',
                    'Escuintla', 'SantaRosa', 'Solola', 'Totonicapan',
                    'Quetzaltenango', 'Suchitepequez', 'Retalhuleu',
                    'SanMarcos', 'Huehuetenango', 'Quiche',
                    'BajaVerapaz', 'AltaVerapaz', 'Peten',
                    'IzabalNorte', 'Zacapa', 'Chiquimula',
                    'Jalapa', 'Jutiapa'
                  )),
  address         TEXT    NOT NULL,
  lat             REAL    NOT NULL,
  lng             REAL    NOT NULL,
  price_from      REAL    NOT NULL DEFAULT 0,
  price_to        REAL,
  currency        TEXT    NOT NULL DEFAULT 'USD',
  cover_image     TEXT,
  duration_hours  REAL,
  max_people      INTEGER,
  status          TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN (
                    'active', 'inactive', 'pending'
                  )),
  featured        INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),  -- 0=false, 1=true (map booleans on seed)
  views_count     INTEGER NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: destination_images
-- Galería de imágenes de cada destino
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS destination_images (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id  INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  image_url       TEXT    NOT NULL,
  caption         TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: reviews
-- Reseñas de turistas sobre destinos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id  INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  language        TEXT    NOT NULL DEFAULT 'en' CHECK (language IN ('es', 'en')),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(destination_id, user_id)   -- un turista, una reseña por destino
);

-- ------------------------------------------------------------
-- TABLA: bookings
-- Reservas de turistas con cálculo de comisión (10%)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  destination_id     INTEGER NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  date_requested     DATE    NOT NULL,
  people_count       INTEGER NOT NULL DEFAULT 1 CHECK (people_count >= 1),
  total_amount       REAL    NOT NULL,
  commission_amount  REAL    NOT NULL,  -- 10% de total_amount
  net_to_provider    REAL    NOT NULL,  -- 90% de total_amount
  status             TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN (
                       'pending', 'confirmed', 'cancelled', 'completed'
                     )),
  notes              TEXT,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: subscriptions
-- Historial de pagos de planes de proveedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id      INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  plan             TEXT    NOT NULL CHECK (plan IN ('free', 'premium', 'elite')),
  amount_quetzales REAL    NOT NULL DEFAULT 0,
  start_date       DATE    NOT NULL,
  end_date         DATE,             -- NULL = no expiry (free / lifetime plans)
  status           TEXT    NOT NULL DEFAULT 'active' CHECK (status IN (
                     'active', 'expired', 'cancelled'
                   )),
  payment_ref      TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- ÍNDICES — Optimización de consultas frecuentes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_destinations_category   ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_destinations_department ON destinations(department);
CREATE INDEX IF NOT EXISTS idx_destinations_status     ON destinations(status);
CREATE INDEX IF NOT EXISTS idx_destinations_featured   ON destinations(featured);
CREATE INDEX IF NOT EXISTS idx_destinations_provider   ON destinations(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_destination     ON reviews(destination_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user            ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user           ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_destination    ON bookings(destination_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status         ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date           ON bookings(date_requested);

-- ------------------------------------------------------------
-- VISTA: destinations_with_rating
-- Destinos con su rating promedio calculado automáticamente
-- ------------------------------------------------------------
CREATE VIEW IF NOT EXISTS destinations_with_rating AS
SELECT
  d.*,
  p.business_name,
  p.plan       AS provider_plan,
  p.verified   AS provider_verified,
  p.whatsapp   AS provider_whatsapp,
  COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
  COUNT(r.id)                           AS review_count
FROM destinations d
JOIN providers p ON d.provider_id = p.id
LEFT JOIN reviews r ON d.id = r.destination_id
WHERE d.status = 'active'
GROUP BY d.id, d.provider_id, d.title, d.description_es, d.description_en,
         d.category, d.department, d.address, d.lat, d.lng,
         d.price_from, d.price_to, d.currency, d.cover_image,
         d.duration_hours, d.max_people, d.status, d.featured,
         d.views_count, d.created_at, d.updated_at,
         p.business_name, p.plan, p.verified, p.whatsapp;

-- ------------------------------------------------------------
-- VISTA: provider_dashboard
-- Resumen de métricas para el panel del proveedor (plan Elite)
-- ------------------------------------------------------------
CREATE VIEW IF NOT EXISTS provider_dashboard AS
SELECT
  p.id            AS provider_id,
  p.business_name,
  p.plan,
  COUNT(DISTINCT d.id)  AS total_destinations,
  SUM(d.views_count)    AS total_views,
  COUNT(DISTINCT b.id)  AS completed_bookings,
  COALESCE(SUM(b.net_to_provider), 0) AS total_earned,
  COALESCE(ROUND(AVG(r.rating), 1), 0) AS overall_rating
FROM providers p
LEFT JOIN destinations d ON p.id = d.provider_id AND d.status = 'active'
LEFT JOIN bookings b     ON d.id = b.destination_id AND b.status = 'completed'
LEFT JOIN reviews r      ON d.id = r.destination_id
GROUP BY p.id;
