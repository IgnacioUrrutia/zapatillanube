document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const error = document.getElementById("loginError");

  if (!email || !password) {
    error.textContent = "Todos los campos son obligatorios.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    error.textContent = "Correo inválido.";
    return;
  }

  // Simulación de inicio de sesión exitoso
  localStorage.setItem("usuarioLogueado", email);
  window.location.href = "index.html";
});

document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();
  const error = document.getElementById("registerError");

  if (!name || !email || !password || !confirm) {
    error.textContent = "Todos los campos son obligatorios.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    error.textContent = "Correo inválido.";
    return;
  }

  if (password.length < 6) {
    error.textContent = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  if (password !== confirm) {
    error.textContent = "Las contraseñas no coinciden.";
    return;
  }

  // Simulación de registro exitoso
  localStorage.setItem("usuarioLogueado", email);
  window.location.href = "index.html";
});
