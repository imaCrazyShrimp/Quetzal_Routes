/* ============================================================
   QUETZAL ROUTES — destinations.js
   Maneja la carga, filtrado y renderizado de destinos
   ============================================================ */

import { getFeaturedDestinations } from './api.js';
import { createDestinationCard } from './ui.js';

/**
 * Carga los destinos destacados en el grid del index.html
 */
async function loadFeatured() {
    const grid = document.getElementById('featured-destinations-grid');
    
    // Si no estamos en una página con este grid, salimos para evitar errores
    if (!grid) return;

    // 1. Obtenemos los datos de db.json a través de api.js
    const featured = await getFeaturedDestinations();

    // 2. Limpiamos el contenido de prueba
    grid.innerHTML = '';

    // 3. Inyectamos los destinos reales
    if (featured.length > 0) {
        featured.forEach(dest => {
            grid.innerHTML += createDestinationCard(dest);
        });
    } else {
        grid.innerHTML = '<p class="text-center">No se encontraron destinos destacados.</p>';
    }
}

// Inicializar cuando el documento esté cargado
document.addEventListener('DOMContentLoaded', () => {
    loadFeatured();
    // Aquí podrías agregar más funciones de inicialización de destinos
});