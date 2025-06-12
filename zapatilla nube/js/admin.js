// admin.js - Funcionalidades del panel de administración
import { auth, onAuthStateChanged, signOut } from "./firebase-config.js";
import { 
  db, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, 
  query, where, orderBy 
} from "./firebase-config.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Inicializar Firebase Storage
const storage = getStorage();

// Variables globales
let currentUser = null;
let editandoProductoId = null;
let imagenesSeleccionadas = [];

// Referencias a elementos del DOM
const adminUserSpan = document.getElementById('admin-user');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const productosTable = document.getElementById('productos-table');
const pedidosTable = document.getElementById('pedidos-table');
const usuariosTable = document.getElementById('usuarios-table');
const productoForm = document.getElementById('producto-form');
const nuevoProductoBtn = document.getElementById('nuevo-producto');
const cancelarProductoBtn = document.getElementById('cancelar-producto');
const submitSpinner = document.getElementById('submit-spinner');
const imagesPreview = document.getElementById('images-preview');

// Verificar si el usuario es administrador
function esAdmin(user) {
  // Por ahora, simplemente verificamos si existe el usuario
  // En un sistema real, verificaríamos un rol de admin en Firestore
  return !!user;
}

// Mostrar mensaje
function mostrarMensaje(tipo, mensaje, duracion = 3000) {
  const msgElement = tipo === 'success' ? successMessage : errorMessage;
  msgElement.textContent = mensaje;
  msgElement.style.display = 'block';
  
  setTimeout(() => {
    msgElement.style.display = 'none';
  }, duracion);
}

// Cambiar entre pestañas
function cambiarTab() {
  const tabButtons = document.querySelectorAll('.admin-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remover clase active de todos los botones y contenidos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Agregar clase active al botón clickeado y su contenido correspondiente
      button.classList.add('active');
      const tabId = `tab-${button.dataset.tab}`;
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Formatear precio
function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(precio);
}

// Formatear fecha
function formatearFecha(timestamp) {
  if (!timestamp) return 'Fecha no disponible';
  
  const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return fecha.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Función para cargar productos
async function cargarProductos() {
  try {
    if (!productosTable) return;
    
    const tbody = productosTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando productos...</td></tr>';
    
    const productosRef = collection(db, "productos");
    const q = query(productosRef, orderBy("nombre"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay productos registrados.</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    querySnapshot.forEach((doc) => {
      const producto = doc.data();
      const tr = document.createElement('tr');
      
      const imagenUrl = producto.imagenes && producto.imagenes.length > 0 
        ? producto.imagenes[0] 
        : 'https://via.placeholder.com/60x60?text=No+Imagen';
      
      const stockBadge = producto.stock > 0 
        ? `<span class="badge badge-success">${producto.stock}</span>` 
        : `<span class="badge badge-danger">Agotado</span>`;
      
      tr.innerHTML = `
        <td><img src="${imagenUrl}" alt="${producto.nombre}" class="producto-imagen-preview"></td>
        <td>${producto.nombre}</td>
        <td>${formatearPrecio(producto.precio)}</td>
        <td>${producto.categoria || 'Sin categoría'}</td>
        <td>${stockBadge}</td>
        <td class="producto-acciones">
          <button class="btn-admin btn-secondary btn-sm editar-producto" data-id="${doc.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-admin btn-danger btn-sm eliminar-producto" data-id="${doc.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
    // Agregar eventos a los botones de editar y eliminar
    document.querySelectorAll('.editar-producto').forEach(btn => {
      btn.addEventListener('click', () => editarProducto(btn.dataset.id));
    });
    
    document.querySelectorAll('.eliminar-producto').forEach(btn => {
      btn.addEventListener('click', () => eliminarProducto(btn.dataset.id));
    });
    
  } catch (error) {
    console.error("Error al cargar productos:", error);
    mostrarMensaje('error', 'Error al cargar los productos');
  }
}

// Función para cargar pedidos
async function cargarPedidos() {
  try {
    if (!pedidosTable) return;
    
    const tbody = pedidosTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando pedidos...</td></tr>';
    
    const pedidosRef = collection(db, "compras");
    const q = query(pedidosRef, orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay pedidos registrados.</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    
    for (const pedidoDoc of querySnapshot.docs) {
      const pedido = pedidoDoc.data();
      const tr = document.createElement('tr');
      
      // Obtener información del usuario
      let emailUsuario = "Usuario no encontrado";
      if (pedido.usuarioId) {
        try {
          const usuariosQuery = query(collection(db, "usuarios"), where("uid", "==", pedido.usuarioId));
          const usuariosSnapshot = await getDocs(usuariosQuery);
          
          if (!usuariosSnapshot.empty) {
            emailUsuario = usuariosSnapshot.docs[0].data().email || "Email no disponible";
          }
        } catch (error) {
          console.error("Error al obtener información del usuario:", error);
        }
      }
      
      let estadoBadge;
      switch (pedido.estado) {
        case "Completado":
          estadoBadge = `<span class="badge badge-success">${pedido.estado}</span>`;
          break;
        case "Pendiente":
          estadoBadge = `<span class="badge badge-warning">${pedido.estado}</span>`;
          break;
        case "Cancelado":
          estadoBadge = `<span class="badge badge-danger">${pedido.estado}</span>`;
          break;
        default:
          estadoBadge = `<span class="badge">${pedido.estado || 'Completado'}</span>`;
      }
      
      tr.innerHTML = `
        <td>${pedidoDoc.id.substring(0, 8)}...</td>
        <td>${emailUsuario}</td>
        <td>${formatearFecha(pedido.fecha)}</td>
        <td>${formatearPrecio(pedido.total)}</td>
        <td>${estadoBadge}</td>
        <td>
          <button class="btn-admin btn-secondary btn-sm ver-pedido" data-id="${pedidoDoc.id}">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    }
    
    // Agregar eventos a los botones de ver pedido
    document.querySelectorAll('.ver-pedido').forEach(btn => {
      btn.addEventListener('click', () => verDetallesPedido(btn.dataset.id));
    });
    
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    mostrarMensaje('error', 'Error al cargar los pedidos');
  }
}

// Función para cargar usuarios
async function cargarUsuarios() {
  try {
    if (!usuariosTable) return;
    
    const tbody = usuariosTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando usuarios...</td></tr>';
    
    const usuariosRef = collection(db, "usuarios");
    const querySnapshot = await getDocs(usuariosRef);
    
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay usuarios registrados.</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    querySnapshot.forEach((doc) => {
      const usuario = doc.data();
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${usuario.nombre || 'Sin nombre'}</td>
        <td>${usuario.email || 'Sin email'}</td>
        <td>${formatearFecha(usuario.fechaRegistro)}</td>
        <td>
          <button class="btn-admin btn-secondary btn-sm ver-usuario" data-id="${doc.id}">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    mostrarMensaje('error', 'Error al cargar los usuarios');
  }
}

// Función para ver detalles de un pedido
async function verDetallesPedido(pedidoId) {
  try {
    const pedidoDoc = await getDoc(doc(db, "compras", pedidoId));
    
    if (!pedidoDoc.exists()) {
      mostrarMensaje('error', 'El pedido no existe');
      return;
    }
    
    const pedido = pedidoDoc.data();
    const modal = document.getElementById('pedido-modal');
    const contenido = document.getElementById('pedido-detalles-contenido');
    
    // Obtener información del usuario
    let infoUsuario = "Usuario no encontrado";
    if (pedido.usuarioId) {
      try {
        const usuariosQuery = query(collection(db, "usuarios"), where("uid", "==", pedido.usuarioId));
        const usuariosSnapshot = await getDocs(usuariosQuery);
        
        if (!usuariosSnapshot.empty) {
          const userData = usuariosSnapshot.docs[0].data();
          infoUsuario = `
            <p><strong>Nombre:</strong> ${userData.nombre || 'No disponible'}</p>
            <p><strong>Email:</strong> ${userData.email || 'No disponible'}</p>
          `;
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
      }
    }
    
    // Generar HTML para los productos
    let productosHTML = '';
    if (pedido.productos && pedido.productos.length > 0) {
      productosHTML = `
        <div style="margin-top: 20px;">
          <h3>Productos</h3>
          <div style="max-height: 300px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Producto</th>
                  <th style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">Cantidad</th>
                  <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Precio</th>
                  <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      pedido.productos.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;
        productosHTML += `
          <tr>
            <td style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">
              <div style="display: flex; align-items: center;">
                <img src="${producto.imagen}" alt="${producto.nombre}" style="width: 40px; height: 40px; object-fit: contain; margin-right: 10px;">
                <span>${producto.nombre}</span>
              </div>
            </td>
            <td style="text-align: center; padding: 8px; border-bottom: 1px solid #ddd;">${producto.cantidad}</td>
            <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${formatearPrecio(producto.precio)}</td>
            <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${formatearPrecio(subtotal)}</td>
          </tr>
        `;
      });
      
      productosHTML += `
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Total:</td>
                  <td style="text-align: right; padding: 8px; font-weight: bold;">${formatearPrecio(pedido.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
    } else {
      productosHTML = '<p>No hay productos en este pedido.</p>';
    }
    
    // Acciones para cambiar el estado del pedido
    const accionesPedido = `
      <div style="margin-top: 20px; text-align: right;">
        <button class="btn-admin btn-primary cambiar-estado" data-id="${pedidoId}" data-estado="Completado">
          Marcar como Completado
        </button>
        <button class="btn-admin btn-warning cambiar-estado" data-id="${pedidoId}" data-estado="Pendiente">
          Marcar como Pendiente
        </button>
        <button class="btn-admin btn-danger cambiar-estado" data-id="${pedidoId}" data-estado="Cancelado">
          Marcar como Cancelado
        </button>
      </div>
    `;
    
    // Armar el contenido completo del modal
    contenido.innerHTML = `
      <div>
        <h3>Información del Cliente</h3>
        ${infoUsuario}
      </div>
      <div style="margin-top: 20px;">
        <h3>Información del Pedido</h3>
        <p><strong>ID:</strong> ${pedidoId}</p>
        <p><strong>Fecha:</strong> ${formatearFecha(pedido.fecha)}</p>
        <p><strong>Estado:</strong> ${pedido.estado || 'Completado'}</p>
        <p><strong>Total:</strong> ${formatearPrecio(pedido.total)}</p>
      </div>
      ${productosHTML}
      ${accionesPedido}
    `;
    
    // Mostrar el modal
    modal.style.display = 'flex';
    
    // Agregar evento para cerrar el modal
    document.getElementById('cerrar-pedido-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Agregar eventos a los botones de cambiar estado
    document.querySelectorAll('.cambiar-estado').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const nuevoEstado = btn.dataset.estado;
        
        try {
          await updateDoc(doc(db, "compras", id), {
            estado: nuevoEstado
          });
          
          mostrarMensaje('success', `Estado actualizado a: ${nuevoEstado}`);
          
          // Actualizar el contenido del modal
          const estadoElement = contenido.querySelector('p:contains("Estado:")');
          if (estadoElement) {
            estadoElement.innerHTML = `<strong>Estado:</strong> ${nuevoEstado}`;
          }
          
          // Recargar la tabla de pedidos
          cargarPedidos();
        } catch (error) {
          console.error("Error al actualizar estado:", error);
          mostrarMensaje('error', 'Error al actualizar el estado');
        }
      });
    });
    
  } catch (error) {
    console.error("Error al cargar detalles del pedido:", error);
    mostrarMensaje('error', 'Error al cargar los detalles del pedido');
  }
}

// Función para editar un producto
async function editarProducto(productoId) {
  try {
    const productoDoc = await getDoc(doc(db, "productos", productoId));
    
    if (!productoDoc.exists()) {
      mostrarMensaje('error', 'El producto no existe');
      return;
    }
    
    const producto = productoDoc.data();
    
    // Llenar el formulario con los datos del producto
    document.getElementById('producto-nombre').value = producto.nombre || '';
    document.getElementById('producto-precio').value = producto.precio || 0;
    document.getElementById('producto-categoria').value = producto.categoria || 'zapatillas';
    document.getElementById('producto-stock').value = producto.stock || 0;
    document.getElementById('producto-descripcion').value = producto.descripcion || '';
    
    // Mostrar las imágenes actuales
    if (imagesPreview) {
      imagesPreview.innerHTML = '';
      if (producto.imagenes && producto.imagenes.length > 0) {
        producto.imagenes.forEach((url, index) => {
          agregarImagenPreview(url, index);
        });
      }
    }
    
    // Guardar las imágenes actuales
    imagenesSeleccionadas = producto.imagenes || [];
    
    // Actualizar el estado de edición
    editandoProductoId = productoId;
    
    // Mostrar el formulario
    productoForm.style.display = 'block';
    
    // Hacer scroll hasta el formulario
    productoForm.scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    console.error("Error al cargar producto para editar:", error);
    mostrarMensaje('error', 'Error al cargar el producto para editar');
  }
}

// Función para eliminar un producto
async function eliminarProducto(productoId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    // Obtener el producto para eliminar sus imágenes
    const productoDoc = await getDoc(doc(db, "productos", productoId));
    
    if (productoDoc.exists()) {
      const producto = productoDoc.data();
      
      // Eliminar imágenes de Storage
      if (producto.imagenes && producto.imagenes.length > 0) {
        for (const imageUrl of producto.imagenes) {
          try {
            // Extraer la ruta del archivo de la URL
            const urlObj = new URL(imageUrl);
            const path = urlObj.pathname;
            const fileName = path.substring(path.lastIndexOf('/') + 1);
            const imageRef = ref(storage, `productos/${fileName}`);
            
            await deleteObject(imageRef);
            console.log(`Imagen eliminada: ${fileName}`);
          } catch (imgError) {
            console.error("Error al eliminar imagen:", imgError);
          }
        }
      }
    }
    
    // Eliminar el documento del producto
    await deleteDoc(doc(db, "productos", productoId));
    
    mostrarMensaje('success', 'Producto eliminado con éxito');
    
    // Recargar la tabla de productos
    cargarProductos();
    
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    mostrarMensaje('error', 'Error al eliminar el producto');
  }
}

// Función para subir una imagen a Firebase Storage
async function subirImagen(file) {
  try {
    // Crear una referencia única para la imagen
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `productos/${fileName}`);
    
    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error al subir imagen:", error);
    throw error;
  }
}

// Función para agregar una imagen a la vista previa
function agregarImagenPreview(url, index) {
  if (!imagesPreview) return;
  
  const container = document.createElement('div');
  container.className = 'image-preview-container';
  container.dataset.index = index;
  
  container.innerHTML = `
    <img src="${url}" class="image-preview" alt="Vista previa">
    <button type="button" class="remove-image" data-index="${index}">×</button>
  `;
  
  imagesPreview.appendChild(container);
  
  // Agregar evento para eliminar la imagen
  container.querySelector('.remove-image').addEventListener('click', (e) => {
    const index = parseInt(e.target.dataset.index);
    imagenesSeleccionadas.splice(index, 1);
    
    // Actualizar la vista previa
    actualizarImagenesPreview();
  });
}

// Función para actualizar la vista previa de imágenes
function actualizarImagenesPreview() {
  if (!imagesPreview) return;
  
  imagesPreview.innerHTML = '';
  
  imagenesSeleccionadas.forEach((url, index) => {
    agregarImagenPreview(url, index);
  });
}

// Inicializar el panel de administración
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el usuario está autenticado
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    if (user && esAdmin(user)) {
      // Usuario autenticado y es admin
      if (adminUserSpan) {
        adminUserSpan.textContent = user.email;
      }
      
      // Cargar datos
      cargarProductos();
      cargarPedidos();
      cargarUsuarios();
      
      // Configurar cambio de pestañas
      cambiarTab();
      
      // Configurar botones
      if (nuevoProductoBtn) {
        nuevoProductoBtn.addEventListener('click', () => {
          // Resetear el formulario
          productoForm.reset();
          imagesPreview.innerHTML = '';
          imagenesSeleccionadas = [];
          editandoProductoId = null;
          
          // Mostrar el formulario
          productoForm.style.display = 'block';
          
          // Hacer scroll hasta el formulario
          productoForm.scrollIntoView({ behavior: 'smooth' });
        });
      }
      
      if (cancelarProductoBtn) {
        cancelarProductoBtn.addEventListener('click', () => {
          // Ocultar el formulario
          productoForm.style.display = 'none';
          
          // Resetear el formulario
          productoForm.reset();
          imagesPreview.innerHTML = '';
          imagenesSeleccionadas = [];
          editandoProductoId = null;
        });
      }
      
      // Configurar input de imágenes
      const inputImagenes = document.getElementById('producto-imagenes');
      if (inputImagenes) {
        inputImagenes.addEventListener('change', (e) => {
          const files = e.target.files;
          
          if (files && files.length > 0) {
            // Crear una vista previa para cada archivo seleccionado
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const reader = new FileReader();
              
              reader.onload = (event) => {
                // Agregar la URL temporal a la vista previa
                imagenesSeleccionadas.push(event.target.result);
                
                // Actualizar la vista previa
                actualizarImagenesPreview();
              };
              
              reader.readAsDataURL(file);
            }
          }
        });
      }
      
      // Configurar envío del formulario
      if (productoForm) {
        productoForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // Mostrar spinner
          if (submitSpinner) submitSpinner.style.display = 'inline-block';
          
          try {
            // Obtener los valores del formulario
            const nombre = document.getElementById('producto-nombre').value;
            const precio = parseFloat(document.getElementById('producto-precio').value);
            const categoria = document.getElementById('producto-categoria').value;
            const stock = parseInt(document.getElementById('producto-stock').value);
            const descripcion = document.getElementById('producto-descripcion').value;
            
            // Preparar el objeto producto
            const productoData = {
              nombre,
              precio,
              categoria,
              stock,
              descripcion,
              imagenes: []
            };
            
            // Subir las imágenes a Firebase Storage
            const inputImagenes = document.getElementById('producto-imagenes');
            const files = inputImagenes.files;
            
            // Procesar las imágenes
            for (let i = 0; i < imagenesSeleccionadas.length; i++) {
              const url = imagenesSeleccionadas[i];
              
              // Si la URL comienza con 'data:', es una imagen nueva que debemos subir
              if (url.startsWith('data:')) {
                // Convertir la URL de datos a un archivo
                const response = await fetch(url);
                const blob = await response.blob();
                const file = new File([blob], `imagen_${i}.jpg`, { type: 'image/jpeg' });
                
                // Subir la imagen
                const imageUrl = await subirImagen(file);
                productoData.imagenes.push(imageUrl);
              } else {
                // Es una URL existente, la mantenemos
                productoData.imagenes.push(url);
              }
            }
            
            // Guardar el producto en Firestore
            if (editandoProductoId) {
              // Actualizar producto existente
              await updateDoc(doc(db, "productos", editandoProductoId), productoData);
              mostrarMensaje('success', 'Producto actualizado con éxito');
            } else {
              // Crear nuevo producto
              await addDoc(collection(db, "productos"), productoData);
              mostrarMensaje('success', 'Producto creado con éxito');
            }
            
            // Resetear el formulario
            productoForm.reset();
            imagesPreview.innerHTML = '';
            imagenesSeleccionadas = [];
            editandoProductoId = null;
            
            // Ocultar el formulario
            productoForm.style.display = 'none';
            
            // Recargar la tabla de productos
            cargarProductos();
            
          } catch (error) {
            console.error("Error al guardar producto:", error);
            mostrarMensaje('error', 'Error al guardar el producto');
          } finally {
            // Ocultar spinner
            if (submitSpinner) submitSpinner.style.display = 'none';
          }
        });
      }
      
    } else {
      // Usuario no autenticado o no es admin
      window.location.href = 'login-register.html';
    }
  });
});