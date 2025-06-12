// login-register.js - Manejo de inicio de sesión y registro con Firebase
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "./firebase-config.js";
import { db, collection, addDoc, getDocs, query, where } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
  // Formulario de Inicio de Sesión
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
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

      try {
        // Iniciar sesión con Firebase
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Inicio de sesión exitoso");
        error.textContent = "¡Inicio de sesión exitoso!";
        error.style.color = "green";
        
        // Redireccionar después de iniciar sesión
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } catch (firebaseError) {
        console.error("Error de inicio de sesión:", firebaseError);
        
        // Manejar diferentes tipos de errores
        if (firebaseError.code === "auth/user-not-found" || firebaseError.code === "auth/wrong-password") {
          error.textContent = "Correo o contraseña incorrectos.";
        } else if (firebaseError.code === "auth/too-many-requests") {
          error.textContent = "Demasiados intentos fallidos. Intente más tarde.";
        } else {
          error.textContent = "Error al iniciar sesión. Intente de nuevo.";
        }
      }
    });
  }

  // Formulario de Registro
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("registerName").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value.trim();
      const confirm = document.getElementById("confirmPassword").value.trim();
      const error = document.getElementById("registerError");

      error.textContent = "";
      error.style.color = "#d62828";
      
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

      try {
        // 1. Crear usuario en Firebase Authentication
        console.log("Creando usuario en Authentication...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Usuario creado en Auth:", user.uid);
        
        // 2. Guardar información adicional en Firestore
        try {
          console.log("Guardando usuario en Firestore...");
          
          // Definir la estructura del documento del usuario
          const userData = {
            uid: user.uid,          // ID del usuario de Auth
            nombre: name,           // Nombre completo
            email: email,           // Email del usuario
            fechaRegistro: new Date().toISOString(), // Fecha como string ISO
            rol: "user"             // Rol por defecto (no es administrador)
          };
          
          // Verificar si el usuario ya existe en Firestore (por si acaso)
          const usuariosRef = collection(db, "usuarios");
          const q = query(usuariosRef, where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            // Si no existe, crear el documento
            console.log("Añadiendo nuevo documento a colección 'usuarios'");
            const docRef = await addDoc(collection(db, "usuarios"), userData);
            console.log("Usuario guardado en Firestore con ID:", docRef.id);
          } else {
            console.log("El usuario ya existe en Firestore, no se creó un duplicado");
          }
          
          // Éxito en todo el proceso
          error.textContent = "¡Cuenta creada exitosamente!";
          error.style.color = "green";
          
          // Redireccionar después del registro
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
        } catch (firestoreError) {
          console.error("Error específico al guardar en Firestore:", firestoreError);
          
          // Mostrar mensaje de error pero mantener la sesión iniciada
          error.textContent = "Cuenta creada, pero hubo un problema al guardar datos adicionales.";
          error.style.color = "orange";
          
          // Redirigir de todos modos después de un tiempo
          setTimeout(() => {
            window.location.href = "index.html";
          }, 2000);
        }
      } catch (authError) {
        console.error("Error en el registro:", authError);
        
        // Manejar diferentes tipos de errores
        if (authError.code === "auth/email-already-in-use") {
          error.textContent = "Este correo ya está registrado. Intenta iniciar sesión en lugar de registrarte o usa otro correo.";
          
          // Resaltar la pestaña de inicio de sesión como sugerencia
          document.querySelector('input#loginEmail').value = email;
          document.querySelector('input#loginPassword').focus();
          
        } else if (authError.code === "auth/weak-password") {
          error.textContent = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
        } else {
          error.textContent = "Error al crear la cuenta: " + (authError.message || "Intente de nuevo.");
        }
      }
    });
  }
});