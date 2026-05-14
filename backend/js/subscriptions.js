
import { get, post } from './api.js';
import { isAuthenticated, hasRole } from './auth.js';

// ─── Definición de planes ─────────────────────────────────────────────────────

/**
 * Configuración de cada plan: límites, precios y features disponibles.
 * Esta es la fuente de verdad en el cliente para validaciones rápidas.
 */
export const PLANS = {
  free: {
    id: 'free',
    name_es: 'Gratuito',
    name_en: 'Free',
    price_quetzales: 0,
    max_destinations: 2,
    featured: false,        // ¿Aparece en sección destacados?
    analytics: false,       // ¿Acceso a estadísticas avanzadas?
    priority_support: false,
    commission_rate: 0.10,  // 10%
    features_es: [
      'Hasta 2 destinos publicados',
      'Perfil básico de negocio',
      'Formulario de reservas',
      'Reseñas de clientes',
    ],
    features_en: [
      'Up to 2 published destinations',
      'Basic business profile',
      'Booking form',
      'Customer reviews',
    ],
  },
  premium: {
    id: 'premium',
    name_es: 'Premium',
    name_en: 'Premium',
    price_quetzales: 299,
    max_destinations: 10,
    featured: true,
    analytics: false,
    priority_support: false,
    commission_rate: 0.10,
    features_es: [
      'Hasta 10 destinos publicados',
      'Apareces en sección Destacados',
      'Galería de hasta 10 fotos por destino',
      'Perfil completo con logo y descripción',
      'Formulario de reservas',
      'Reseñas de clientes',
    ],
    features_en: [
      'Up to 10 published destinations',
      'Featured on homepage',
      'Gallery with up to 10 photos per destination',
      'Full profile with logo and description',
      'Booking form',
      'Customer reviews',
    ],
  },
  elite: {
    id: 'elite',
    name_es: 'Elite',
    name_en: 'Elite',
    price_quetzales: 599,
    max_destinations: Infinity,  // Ilimitado
    featured: true,
    analytics: true,
    priority_support: true,
    commission_rate: 0.08,       // 8% (descuento para Elite)
    features_es: [
      'Destinos ilimitados',
      'Prioridad máxima en búsquedas',
      'Estadísticas avanzadas de visitas y reservas',
      'Badge "Proveedor Verificado"',
      'Soporte prioritario',
      'Comisión reducida al 8%',
    ],
    features_en: [
      'Unlimited destinations',
      'Maximum priority in search results',
      'Advanced analytics on visits and bookings',
      '"Verified Provider" badge',
      'Priority support',
      'Reduced 8% commission',
    ],
  },
};

// ─── Acciones que requieren validación de plan ────────────────────────────────

/**
 * Lista de acciones que se pueden validar contra el plan.
 * Usadas como argumento en checkPlanLimits().
 */
export const PLAN_ACTIONS = {
  CREATE_DESTINATION: 'create_destination',
  USE_FEATURED:       'use_featured',
  VIEW_ANALYTICS:     'view_analytics',
  UNLIMITED_PHOTOS:   'unlimited_photos',
  PRIORITY_SUPPORT:   'priority_support',
};

// ─── Consultar plan activo ────────────────────────────────────────────────────

/**
 * Obtiene el plan activo del proveedor desde el servidor.
 * @param {number|string} providerId
 * @returns {Promise<object>}  Objeto con plan, fecha de inicio y fecha de expiración
 *
 * @example
 * const sub = await getCurrentPlan(3);
 * console.log(sub.plan, sub.end_date);
 */
export async function getCurrentPlan(providerId) {
  return get(`/providers/${providerId}/subscription`);
}

/**
 * Obtiene el plan del proveedor autenticado.
 * @returns {Promise<object>}
 */
export async function getMyPlan() {
  if (!isAuthenticated() || !hasRole('provider')) {
    throw new Error('Solo proveedores pueden consultar planes.');
  }
  return get('/providers/me/subscription');
}

/**
 * Obtiene la configuración completa de un plan por su ID.
 * No hace llamada al servidor, usa la constante PLANS.
 * @param {'free'|'premium'|'elite'} planId
 * @returns {object}  Configuración del plan
 *
 * @example
 * const config = getPlanFeatures('premium');
 * console.log(config.max_destinations); // 10
 */
export function getPlanFeatures(planId) {
  return PLANS[planId] ?? PLANS.free;
}

// ─── Cambiar de plan ──────────────────────────────────────────────────────────

/**
 * Inicia el proceso de upgrade de plan.
 * En producción, esto redirigiría a una pasarela de pago.
 * @param {number|string} providerId
 * @param {'free'|'premium'|'elite'} plan
 * @returns {Promise<object>}  Respuesta con URL de pago o confirmación
 *
 * @example
 * const result = await upgradePlan(3, 'premium');
 * if (result.payment_url) window.location.href = result.payment_url;
 */
export async function upgradePlan(providerId, plan) {
  if (!isAuthenticated() || !hasRole('provider')) {
    throw new Error('Solo proveedores pueden cambiar de plan.');
  }
  if (!PLANS[plan]) {
    throw new Error(`Plan inválido: ${plan}. Opciones: free, premium, elite.`);
  }

  return post(`/providers/${providerId}/subscription`, { plan });
}

/**
 * Cancela el plan actual y vuelve al plan gratuito.
 * @param {number|string} providerId
 * @returns {Promise<object>}
 */
export async function cancelPlan(providerId) {
  return upgradePlan(providerId, 'free');
}

// ─── Validar límites ──────────────────────────────────────────────────────────

/**
 * Verifica si un proveedor puede realizar una acción según su plan.
 * Recibe el perfil del proveedor ya cargado para evitar llamadas extra.
 *
 * @param {object} providerProfile  Perfil del proveedor con propiedad 'plan'
 * @param {string} action           Una de las constantes PLAN_ACTIONS
 * @param {object} [context]        Datos adicionales para la validación
 * @param {number} [context.current_destinations]  Cuántos destinos tiene actualmente
 * @returns {{ allowed: boolean, reason_es: string|null, reason_en: string|null }}
 *
 * @example
 * const { allowed, reason_es } = checkPlanLimits(profile, 'create_destination', {
 *   current_destinations: 2,
 * });
 * if (!allowed) showToast(reason_es, 'error');
 */
export function checkPlanLimits(providerProfile, action, context = {}) {
  const planId = providerProfile?.plan || 'free';
  const plan = PLANS[planId];

  switch (action) {
    case PLAN_ACTIONS.CREATE_DESTINATION: {
      const current = context.current_destinations ?? 0;
      const allowed = current < plan.max_destinations;
      return {
        allowed,
        reason_es: allowed
          ? null
          : `Tu plan ${plan.name_es} permite máximo ${plan.max_destinations} destinos. Mejora tu plan para publicar más.`,
        reason_en: allowed
          ? null
          : `Your ${plan.name_en} plan allows a maximum of ${plan.max_destinations} destinations. Upgrade to publish more.`,
      };
    }

    case PLAN_ACTIONS.USE_FEATURED: {
      return {
        allowed: plan.featured,
        reason_es: plan.featured
          ? null
          : 'La sección Destacados está disponible desde el plan Premium.',
        reason_en: plan.featured
          ? null
          : 'The Featured section is available from the Premium plan.',
      };
    }

    case PLAN_ACTIONS.VIEW_ANALYTICS: {
      return {
        allowed: plan.analytics,
        reason_es: plan.analytics
          ? null
          : 'Las estadísticas avanzadas están disponibles solo en el plan Elite.',
        reason_en: plan.analytics
          ? null
          : 'Advanced analytics are only available on the Elite plan.',
      };
    }

    case PLAN_ACTIONS.PRIORITY_SUPPORT: {
      return {
        allowed: plan.priority_support,
        reason_es: plan.priority_support
          ? null
          : 'El soporte prioritario está disponible solo en el plan Elite.',
        reason_en: plan.priority_support
          ? null
          : 'Priority support is only available on the Elite plan.',
      };
    }

    default:
      return { allowed: true, reason_es: null, reason_en: null };
  }
}

/**
 * Verifica si un plan está activo (no expirado).
 * @param {object} subscription  Objeto de suscripción con end_date
 * @returns {boolean}
 */
export function isPlanActive(subscription) {
  if (!subscription || subscription.plan === 'free') return true; // Free nunca expira
  if (!subscription.end_date) return false;

  return new Date(subscription.end_date) > new Date();
}

/**
 * Calcula cuántos días faltan para que expire el plan.
 * @param {object} subscription
 * @returns {number}  Días restantes. -1 si ya expiró. Infinity si es gratuito.
 */
export function getDaysRemaining(subscription) {
  if (!subscription || subscription.plan === 'free') return Infinity;
  if (!subscription.end_date) return -1;

  const end = new Date(subscription.end_date);
  const now = new Date();
  const diff = end - now;

  if (diff < 0) return -1;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Comparación de planes ────────────────────────────────────────────────────

/**
 * Devuelve los tres planes formateados para renderizar la tabla de precios.
 * @param {'es'|'en'} [lang='es']
 * @returns {object[]}
 *
 * @example
 * const plans = getPlansForDisplay('es');
 * plans.forEach(plan => renderPricingCard(plan));
 */
export function getPlansForDisplay(lang = 'es') {
  return Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: lang === 'es' ? plan.name_es : plan.name_en,
    price: plan.price_quetzales,
    price_label:
      plan.price_quetzales === 0
        ? lang === 'es' ? 'Gratis' : 'Free'
        : `Q${plan.price_quetzales}/mes`,
    max_destinations:
      plan.max_destinations === Infinity
        ? lang === 'es' ? 'Ilimitados' : 'Unlimited'
        : plan.max_destinations,
    features: lang === 'es' ? plan.features_es : plan.features_en,
    featured: plan.featured,
    analytics: plan.analytics,
    commission_rate: `${plan.commission_rate * 100}%`,
    recommended: plan.id === 'premium', // Destacar el plan recomendado
  }));
}