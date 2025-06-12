// admin-panel.js - Gestión de usuarios y administradores
import { auth, onAuthStateChanged } from "./firebase-config.js";
import { db, collection, query, where, getDocs, getDoc, doc } from "./firebase-config.js";
import { 
  esAdministrador, 
  asignarRolAdministrador, 
  revocarRolAdministrador, 
  obtenerAdministradores,
  ROLES
} from "./roles-simple.js";

// Elementos del DOM
const currentUserSpan = document.getElementById('current-user');
const accessDeniedDiv = document.getElementById('accessDenied');
const adminContentDiv = document.getElementById('adminContent');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const adminListLoader = document.getElementById('adminListLoader');
const adminTable = document.getElementById('adminTable');
const adminTableBody = document.getElementById('adminTableBody');
const userListLoader = document.getElementById('userListLoader');
const userTable = document.getElementById('userTable');
const userTableBody = document.getElementById('userTableBody');
const userSearchInput = document.getElementById('userSearch');

// Modales
const addAdminModal = document.getElementById('addAdminModal');
const addAdminForm = document.getElementById('addAdminForm');
const addAdminBtn = document.getElementById('addAdminBtn');
const cancelAddAdminBtn = document.getElementById('cancelAddAdmin');
const adminEmailInput = document.getElementById('adminEmail');
const adminConfirmationInput = document.getElementById('adminConfirmation');

const revokeAdminModal = document.getElementById('revokeAdminModal');
const revokeAdminForm = document.getElementById('revokeAdminForm');
const revokeAdminEmail = document.getElementById('revokeAdminEmail');
const revokeAdminUid = document.getElementById('revokeAdminUid');
const revokeConfirmationInput = document.getElementById('revokeConfirmation');
const cancelRevokeAdminBtn = document.getElementById('cancelRevokeAdmin');

// Variable para almacenar todos los usuarios
let allUsers = [];

// Mostrar un mensaje
function showMessage(type, message, duration = 3000) {
  const messageElement = type === 'success' ? successMessage : errorMessage;
  messageElement.textContent = message;
  messageElement.style.display = 'block';
  
  setTimeout(() => {
    messageElement.style.display = 'none';
  }, duration);
}

// Formatear fecha
function formatDate(timestamp) {
  if (!timestamp) return 'No disponible';
  
  let date;
  try {
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp.toDate) {
      date = timestamp.toDate(); // Para Firestore Timestamp
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return 'Fecha inválida';
  }
}

// Cargar los administradores
async function loadAdministrators() {
  adminTableBody.innerHTML = '';
  adminListLoader.style.display = 'block';
  adminTable.style.display = 'none';
  
  try {
    const administradores = await obtenerAdministradores();
    
    if (administradores.length === 0) {
      adminTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay administradores configurados</td></tr>';
    } else {
      // Para cada administrador, obtener información adicional
      for (const admin of administradores) {
        const row = document.createElement('tr');
        
        // Obtener información del usuario que asignó este admin (si existe)
        let asignadoPorTexto = 'Configuración inicial';
        if (admin.asignadoPor) {
          try {
            const usuariosRef = collection(db, "usuarios");
            const q = query(usuariosRef, where("uid", "==", admin.asignadoPor));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const asignadoPor = querySnapshot.docs[0].data();
              asignadoPorTexto = asignadoPor.email || asignadoPor.nombre || admin.asignadoPor;
            }
          } catch (error) {
            console.error("Error al obtener asignador:", error);
            asignadoPorTexto = 'No disponible';
          }
        }
        
        // No permitir revocar el propio rol de administrador
        const esUsuarioActual = admin.uid === auth.currentUser.uid;
        const botonesAccion = esUsuarioActual 
          ? '<button disabled class="admin-button" style="opacity: 0.5;">No puedes revocarte a ti mismo</button>' 
          : `<button class="admin-button danger revoke-admin" data-uid="${admin.uid}" data-email="${admin.email}">Revocar Permisos</button>`;
        
        row.innerHTML = `
          <td>${admin.email || 'No disponible'}</td>
          <td>${formatDate(admin.fechaAsignacion)}</td>
          <td>${asignadoPorTexto}</td>
          <td>${botonesAccion}</td>
        `;
        
        adminTableBody.appendChild(row);
      }
      
      // Agregar eventos a los botones de revocar
      document.querySelectorAll('.revoke-admin').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const uid = e.currentTarget.dataset.uid;
          const email = e.currentTarget.dataset.email;
          revokeAdminEmail.textContent = email;
          revokeAdminUid.value = uid;
          revokeAdminModal.style.display = 'flex';
        });
      });
    }
  } catch (error) {
    console.error("Error al cargar administradores:", error);
    adminTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error al cargar administradores</td></tr>';
  } finally {
    adminListLoader.style.display = 'none';
    adminTable.style.display = 'table';
  }
}

// Cargar todos los usuarios
async function loadUsers() {
  userTableBody.innerHTML = '';
  userListLoader.style.display = 'block';
  userTable.style.display = 'none';
  
  try {
    // Obtener todos los usuarios de la colección 'usuarios'
    const usuariosRef = collection(db, "usuarios");
    const querySnapshot = await getDocs(usuariosRef);
    
    // Obtener todos los roles para verificar cuáles son administradores
    const rolesRef = collection(db, "roles");
    const rolesQuery = query(rolesRef, where("rol", "==", ROLES.ADMIN));
    const rolesSnapshot = await getDocs(rolesQuery);
    
    // Crear un conjunto de UIDs de administradores para búsqueda rápida
    const adminUids = new Set();
    rolesSnapshot.forEach((doc) => {
      const rolData = doc.data();
      if (rolData.uid) {
        adminUids.add(rolData.uid);
      }
    });
    
    allUsers = [];
    
    if (querySnapshot.empty) {
      userTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay usuarios registrados</td></tr>';
    } else {
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Añadir información de rol
        userData.isAdmin = adminUids.has(userData.uid);
        userData.rol = userData.isAdmin ? ROLES.ADMIN : ROLES.USER;
        
        // Guardar en el array para filtrado
        allUsers.push(userData);
      });
      
      // Renderizar usuarios
      renderUsers(allUsers);
    }
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    userTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar usuarios</td></tr>';
  } finally {
    userListLoader.style.display = 'none';
    userTable.style.display = 'table';
  }
}

// Renderizar lista de usuarios filtrada
function renderUsers(users) {
  userTableBody.innerHTML = '';
  
  if (users.length === 0) {
    userTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No se encontraron usuarios</td></tr>';
    return;
  }
  
  users.forEach(user => {
    const row = document.createElement('tr');
    
    // Determinar si este usuario ya es administrador
    const rolBadge = user.isAdmin 
      ? '<span class="badge admin">Administrador</span>' 
      : '<span class="badge user">Usuario</span>';
    
    // Botón para hacer admin sólo disponible para usuarios normales
    const adminButton = !user.isAdmin 
      ? `<button class="admin-button make-admin" data-uid="${user.uid}" data-email="${user.email}">Hacer Administrador</button>` 
      : '';
    
    row.innerHTML = `
      <td>${user.nombre || 'No disponible'}</td>
      <td>${user.email || 'No disponible'}</td>
      <td>${formatDate(user.fechaRegistro)}</td>
      <td>${rolBadge}</td>
      <td>${adminButton}</td>
    `;
    
    userTableBody.appendChild(row);
  });
  
  // Agregar eventos a botones de convertir en admin
  document.querySelectorAll('.make-admin').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const uid = e.currentTarget.dataset.uid;
      const email = e.currentTarget.dataset.email;
      
      adminEmailInput.value = email;
      addAdminModal.style.display = 'flex';
    });
  });
}

// Inicializar los eventos de la página
function initializeEvents() {
  // Evento de búsqueda de usuarios
  userSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      renderUsers(allUsers);
    } else {
      const filteredUsers = allUsers.filter(user => 
        (user.nombre && user.nombre.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
      );
      renderUsers(filteredUsers);
    }
  });
  
  // Evento para mostrar modal de añadir administrador
  addAdminBtn.addEventListener('click', () => {
    addAdminForm.reset();
    addAdminModal.style.display = 'flex';
  });
  
  // Eventos para cerrar modales
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      addAdminModal.style.display = 'none';
      revokeAdminModal.style.display = 'none';
    });
  });
  
  // Eventos para cancelar en modales
  cancelAddAdminBtn.addEventListener('click', () => {
    addAdminModal.style.display = 'none';
  });
  
  cancelRevokeAdminBtn.addEventListener('click', () => {
    revokeAdminModal.style.display = 'none';
  });
  
  // Evento para añadir administrador
  addAdminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = adminEmailInput.value.trim();
    const confirmation = adminConfirmationInput.value.trim();
    
    if (confirmation !== 'CONFIRMAR') {
      showMessage('error', 'Debes escribir "CONFIRMAR" exactamente para continuar');
      return;
    }
    
    // Buscar el usuario por email
    try {
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        showMessage('error', 'No se encontró ningún usuario con ese email');
        return;
      }
      
      const userData = querySnapshot.docs[0].data();
      
      // Verificar si ya es administrador
      if (userData.isAdmin) {
        showMessage('error', 'Este usuario ya es administrador');
        return;
      }
      
      // Asignar rol de administrador
      const result = await asignarRolAdministrador(userData.uid, userData.email);
      
      if (result) {
        showMessage('success', `${userData.email} ahora es administrador`);
        addAdminModal.style.display = 'none';
        
        // Recargar listas
        await loadAdministrators();
        await loadUsers();
      } else {
        showMessage('error', 'No se pudo asignar el rol de administrador');
      }
    } catch (error) {
      console.error("Error al añadir administrador:", error);
      showMessage('error', 'Error al añadir administrador: ' + error.message);
    }
  });
  
  // Evento para revocar administrador
  revokeAdminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const uid = revokeAdminUid.value;
    const confirmation = revokeConfirmationInput.value.trim();
    
    if (confirmation !== 'REVOCAR') {
      showMessage('error', 'Debes escribir "REVOCAR" exactamente para continuar');
      return;
    }
    
    try {
      const result = await revocarRolAdministrador(uid);
      
      if (result) {
        showMessage('success', 'Permisos de administrador revocados correctamente');
        revokeAdminModal.style.display = 'none';
        
        // Recargar listas
        await loadAdministrators();
        await loadUsers();
      } else {
        showMessage('error', 'No se pudieron revocar los permisos de administrador');
      }
    } catch (error) {
      console.error("Error al revocar administrador:", error);
      showMessage('error', 'Error al revocar administrador: ' + error.message);
    }
  });
  
  // Cerrar modales al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === addAdminModal) {
      addAdminModal.style.display = 'none';
    }
    if (e.target === revokeAdminModal) {
      revokeAdminModal.style.display = 'none';
    }
  });
}

// Verificar si el usuario es administrador al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  // Verificar estado de autenticación
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuario autenticado
      currentUserSpan.textContent = user.email;
      
      // Verificar si es administrador
      const isAdmin = await esAdministrador();
      
      if (isAdmin) {
        // Mostrar contenido de administrador
        accessDeniedDiv.style.display = 'none';
        adminContentDiv.style.display = 'block';
        
        // Cargar datos
        await loadAdministrators();
        await loadUsers();
        
        // Inicializar eventos
        initializeEvents();
      } else {
        // Mostrar mensaje de acceso denegado
        accessDeniedDiv.style.display = 'block';
        adminContentDiv.style.display = 'none';
      }
    } else {
      // Usuario no autenticado, redirigir a login
      window.location.href = 'login-register.html';
    }
  });
});