// roles-simple.js - Sistema simplificado de roles
import { auth, onAuthStateChanged } from "./firebase-config.js";
import { db, collection, addDoc, query, where, getDocs } from "./firebase-config.js";

// Email fijo del administrador principal
const ADMIN_EMAIL = "gengarmarket@gmail.com";

// Roles disponibles
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

/**
 * Comprueba si el usuario actual es administrador
 * @returns {Promise<boolean>} True si el usuario es administrador
 */
async function esAdministrador() {
  // Verificar si hay un usuario autenticado
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return false;
  }
  
  // Si es el administrador principal, retornar true directamente
  if (currentUser.email === ADMIN_EMAIL) {
    return true;
  }
  
  try {
    // Buscar en la colección 'adminUsers' si el usuario tiene rol de admin
    const adminsRef = collection(db, "adminUsers");
    const q = query(adminsRef, where("email", "==", currentUser.email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error al verificar rol de administrador:", error);
    return false;
  }
}

/**
 * Asigna el rol de administrador a un usuario
 * @param {string} email - Email del usuario a convertir en administrador
 * @returns {Promise<boolean>} - True si se asignó correctamente
 */
async function asignarRolAdministrador(email) {
  try {
    // Solo un administrador puede asignar roles de administrador
    if (!await esAdministrador()) {
      console.error("No tienes permisos para asignar roles de administrador");
      return false;
    }
    
    // Verificar si el email ya es admin
    const adminsRef = collection(db, "adminUsers");
    const q = query(adminsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log("Este usuario ya es administrador");
      return true;
    }
    
    // Asignar rol de administrador
    await addDoc(collection(db, "adminUsers"), {
      email: email,
      fechaAsignacion: new Date().toISOString(),
      asignadoPor: auth.currentUser.email
    });
    
    console.log(`Rol de administrador asignado a ${email}`);
    return true;
  } catch (error) {
    console.error("Error al asignar rol de administrador:", error);
    return false;
  }
}

/**
 * Revoca el rol de administrador de un usuario
 * @param {string} email - Email del usuario
 * @returns {Promise<boolean>} - True si se revocó correctamente
 */
async function revocarRolAdministrador(email) {
  try {
    // Solo un administrador puede revocar roles de administrador
    if (!await esAdministrador()) {
      console.error("No tienes permisos para revocar roles de administrador");
      return false;
    }
    
    // No permitir revocar al administrador principal
    if (email === ADMIN_EMAIL) {
      console.error("No se puede revocar el rol del administrador principal");
      return false;
    }
    
    // Buscar documento del admin a revocar
    const adminsRef = collection(db, "adminUsers");
    const q = query(adminsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("Este usuario no es administrador");
      return false;
    }
    
    // Eliminar todos los documentos encontrados (debería ser solo uno)
    let eliminados = 0;
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      eliminados++;
    }
    
    console.log(`Rol de administrador revocado para ${email}. Documentos eliminados: ${eliminados}`);
    return true;
  } catch (error) {
    console.error("Error al revocar rol de administrador:", error);
    return false;
  }
}

/**
 * Obtiene todos los administradores del sistema
 * @returns {Promise<Array>} - Lista de administradores
 */
async function obtenerAdministradores() {
  try {
    // Solo un administrador puede ver la lista de administradores
    if (!await esAdministrador()) {
      console.error("No tienes permisos para ver la lista de administradores");
      return [];
    }
    
    const administradores = [
      // Incluir siempre al administrador principal
      {
        email: ADMIN_EMAIL,
        esPrincipal: true,
        fechaAsignacion: "Administrador Principal"
      }
    ];
    
    // Obtener administradores adicionales
    const adminsRef = collection(db, "adminUsers");
    const querySnapshot = await getDocs(adminsRef);
    
    querySnapshot.forEach((doc) => {
      administradores.push({
        id: doc.id,
        ...doc.data(),
        esPrincipal: false
      });
    });
    
    return administradores;
  } catch (error) {
    console.error("Error al obtener lista de administradores:", error);
    return [];
  }
}

// Exportar funciones para uso en otros archivos
export {
  ROLES,
  ADMIN_EMAIL,
  esAdministrador,
  asignarRolAdministrador,
  revocarRolAdministrador,
  obtenerAdministradores
};