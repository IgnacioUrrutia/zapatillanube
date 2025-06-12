// admin-button.js - Componente reutilizable para mostrar el botón de administrador
// en cualquier página de la aplicación
import { auth, onAuthStateChanged } from "./firebase-config.js";
import { esAdministrador } from "./roles-simple.js";

// Función para crear y mostrar el botón de administrador
export function initAdminButton() {
  // Comprobar si el elemento contenedor existe
  const navbarNav = document.querySelector('.navbar-nav');
  if (!navbarNav) {
    console.error("No se encontró el elemento .navbar-nav para añadir el botón de administrador");
    return;
  }
  
  // Verificar si el usuario está autenticado y es administrador
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Verificar si es administrador
      const isAdmin = await esAdministrador();
      
      if (isAdmin) {
        // Crear el botón de administrador si no existe
        let adminButton = document.getElementById('admin-button');
        if (!adminButton) {
          // Crear el elemento de lista
          const listItem = document.createElement('li');
          
          // Crear el enlace
          const link = document.createElement('a');
          link.href = 'admin-simple.html';
          link.id = 'admin-button';
          link.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
          link.style.color = '#ffcc00'; // Color distintivo para el botón de admin
          
          // Añadir el enlace al elemento de lista
          listItem.appendChild(link);
          
          // Añadir el elemento de lista a la barra de navegación
          navbarNav.appendChild(listItem);
          
          console.log("Botón de administrador añadido");
        }
      }
    }
  });
}

// Inicializar el botón cuando se carga la página
document.addEventListener('DOMContentLoaded', initAdminButton);