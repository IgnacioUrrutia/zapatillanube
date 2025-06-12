// firebase-setup.js - Script para inicializar la configuración de Firebase
// Este script debe ejecutarse solo una vez para configurar el administrador principal

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config-real.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Email y contraseña del administrador principal
const ADMIN_EMAIL = "GengarMarket@gmail.com";
const ADMIN_PASSWORD = "admin123456"; // Cambia esto a una contraseña segura

// Función para crear el administrador principal
async function setupAdminUser() {
  try {
    console.log("Intentando crear administrador principal...");
    
    // Primero intentar iniciar sesión
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log("El administrador ya existe, inicio de sesión exitoso");
    } catch (loginError) {
      // Si no se puede iniciar sesión, crear el usuario
      if (loginError.code === "auth/user-not-found") {
        console.log("El administrador no existe, creando usuario...");
        const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        const user = userCredential.user;
        
        console.log("Usuario administrador creado en Authentication:", user.uid);
        
        // Guardar en Firestore como usuario normal
        const userData = {
          uid: user.uid,
          nombre: "Administrador Gengar Market",
          email: ADMIN_EMAIL,
          fechaRegistro: new Date().toISOString(),
          rol: "admin"
        };
        
        const docRef = await addDoc(collection(db, "usuarios"), userData);
        console.log("Usuario administrador guardado en Firestore:", docRef.id);
      } else {
        throw loginError;
      }
    }
    
    console.log("Configuración completada con éxito!");
    
  } catch (error) {
    console.error("Error en la configuración:", error);
  }
}

// Ejecutar la configuración
setupAdminUser();