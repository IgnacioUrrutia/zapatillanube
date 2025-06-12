// perfil.js - Gestión de perfil de usuario con Firebase
import { auth, onAuthStateChanged, signOut } from "./firebase-config.js";
import { db, doc, getDoc, collection, getDocs, query, where } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
  const spanCorreo = document.getElementById("perfilCorreo");
  const nombreElement = document.getElementById("perfilNombre");
  const logoutBtn = document.getElementById("logout");
  const historialCompras = document.getElementById("historialCompras");
  
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    });
  }

  // Comprobar estado de autenticación y cargar datos del usuario
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Si no hay usuario autenticado, redirigir al login
      window.location.href = "login-register.html";
      return;
    }
    
    // Mostrar correo del usuario
    if (spanCorreo) {
      spanCorreo.textContent = user.email;
    }
    
    try {
      // Buscar información adicional del usuario en Firestore
      const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (nombreElement && userData.nombre) {
          nombreElement.textContent = userData.nombre;
        }
      }
      
      // Cargar historial de compras si existe el elemento
      if (historialCompras) {
        const comprasQuery = query(collection(db, "compras"), where("usuarioId", "==", user.uid));
        const comprasSnapshot = await getDocs(comprasQuery);
        
        if (comprasSnapshot.empty) {
          historialCompras.innerHTML = "<p>No has realizado compras aún.</p>";
        } else {
          let html = "<h3>Tus compras anteriores</h3>";
          
          comprasSnapshot.forEach((doc) => {
            const compra = doc.data();
            html += `
              <div class="compra-item">
                <p><strong>Fecha:</strong> ${compra.fecha.toDate().toLocaleDateString()}</p>
                <p><strong>Total:</strong> $${compra.total.toFixed(0)}</p>
                <p><strong>Estado:</strong> ${compra.estado || 'Completado'}</p>
                <details>
                  <summary>Ver productos</summary>
                  <ul>
                    ${compra.productos.map(p => `<li>${p.nombre} x${p.cantidad} - $${(p.precio * p.cantidad).toFixed(0)}</li>`).join('')}
                  </ul>
                </details>
              </div>
            `;
          });
          
          historialCompras.innerHTML = html;
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
    }
  });
});