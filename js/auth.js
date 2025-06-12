// auth.js - control de sesión y navegación en navbar usando Firebase
import { auth, onAuthStateChanged, signOut } from "./firebase-config.js";

// Estado global del usuario
let currentUser = null;

// Listener para cambios en el estado de autenticación
function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario ha iniciado sesión
      currentUser = user;
      console.log("Usuario autenticado:", user.email);
    } else {
      // Usuario ha cerrado sesión
      currentUser = null;
      console.log("No hay usuario autenticado");
    }
    actualizarNavbar();
  });
}

function actualizarNavbar() {
  const navbar = document.querySelector('.navbar-nav');
  if (!navbar) return;
  
  const authItems = document.querySelectorAll('.auth-links');
  authItems.forEach(e => e.remove());

  if (currentUser) {
    const perfil = document.createElement('li');
    perfil.classList.add('auth-links');
    perfil.innerHTML = `<a href="perfil.html">👤 Perfil</a>`;

    const logout = document.createElement('li');
    logout.classList.add('auth-links');
    logout.innerHTML = `<a href="#" id="logout-link">Cerrar Sesión</a>`;

    navbar.appendChild(perfil);
    navbar.appendChild(logout);

    document.getElementById('logout-link').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        console.log("Sesión cerrada con éxito");
        location.reload();
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });

  } else {
    const login = document.createElement('li');
    login.classList.add('auth-links');
    login.innerHTML = `<a href="login-register.html">Iniciar Sesión</a>`;
    navbar.appendChild(login);
  }
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
  return !!currentUser;
}

// Función para obtener el usuario actual
function getCurrentUser() {
  return currentUser;
}

// Iniciar el listener de autenticación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', initAuthListener);

// Exportar funciones para usarlas en otros archivos
export { isAuthenticated, getCurrentUser };