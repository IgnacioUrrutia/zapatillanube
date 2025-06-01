// auth.js - control de sesión y navegación en navbar

function actualizarNavbar() {
  const navbar = document.querySelector('.navbar-nav');
  const isLoggedIn = localStorage.getItem('usuarioLogueado');

  const authItems = document.querySelectorAll('.auth-links');
  authItems.forEach(e => e.remove());

  if (isLoggedIn) {
    const perfil = document.createElement('li');
    perfil.classList.add('auth-links');
    perfil.innerHTML = `<a href="perfil.html">👤 Perfil</a>`;

    const logout = document.createElement('li');
    logout.classList.add('auth-links');
    logout.innerHTML = `<a href="#" id="logout-link">Cerrar Sesión</a>`;

    navbar.appendChild(perfil);
    navbar.appendChild(logout);

    document.getElementById('logout-link').addEventListener('click', () => {
      localStorage.removeItem('usuarioLogueado');
      location.reload();
    });

  } else {
    const login = document.createElement('li');
    login.classList.add('auth-links');
    login.innerHTML = `<a href="login-register.html">Iniciar Sesión</a>`;
    navbar.appendChild(login);
  }
}

document.addEventListener('DOMContentLoaded', actualizarNavbar);
