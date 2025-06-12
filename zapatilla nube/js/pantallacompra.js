// pantallacompra.js - Gestión de la pantalla de confirmación de compra
import { auth, onAuthStateChanged } from "./firebase-config.js";
import { db, doc, getDoc } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('detalle-compra');
    const totalCompra = document.getElementById('total-compra');
    const nombreCliente = document.getElementById('nombre-cliente');
    
    // Verificar si hay un usuario autenticado
    onAuthStateChanged(auth, async (user) => {
        if (user && nombreCliente) {
            nombreCliente.textContent = user.email;
        }
    });
    
    // Obtener el ID de la última compra (si existe)
    const ultimaCompraId = localStorage.getItem('gengarUltimaCompraId');
    
    if (ultimaCompraId) {
        try {
            // Intentar obtener los detalles de la compra desde Firestore
            const compraDoc = await getDoc(doc(db, "compras", ultimaCompraId));
            
            if (compraDoc.exists()) {
                const compraData = compraDoc.data();
                mostrarDetallesCompra(compraData);
            } else {
                // Si no se encuentra en Firestore, intentar con localStorage (respaldo)
                cargarDesdeLocalStorage();
            }
        } catch (error) {
            console.error("Error al cargar detalles de la compra:", error);
            cargarDesdeLocalStorage();
        }
    } else {
        // Si no hay ID de compra, intentar con localStorage
        cargarDesdeLocalStorage();
    }
    
    function mostrarDetallesCompra(compra) {
        if (!contenedor || !totalCompra) return;
        
        let total = compra.total || 0;
        let htmlBoleta = '<h2>Boleta de Compra</h2><ul>';
        
        contenedor.innerHTML = '';
        
        if (compra.productos && compra.productos.length > 0) {
            compra.productos.forEach(prod => {
                const linea = document.createElement('p');
                const subtotal = prod.precio * prod.cantidad;
                const texto = `${prod.nombre} x${prod.cantidad} - $${subtotal.toFixed(0)}`;
                
                linea.textContent = texto;
                contenedor.appendChild(linea);
                
                htmlBoleta += `<li>${texto}</li>`;
            });
        } else {
            contenedor.innerHTML = '<p>No hay detalles disponibles para esta compra.</p>';
        }
        
        htmlBoleta += `</ul><strong>Total: $${total.toFixed(0)}</strong>`;
        totalCompra.textContent = `Total: $${total.toFixed(0)}`;
        
        // Guardar el HTML de la boleta para posible descarga
        localStorage.setItem('gengarBoletaHTML', htmlBoleta);
    }
    
    function cargarDesdeLocalStorage() {
        const productosComprados = JSON.parse(localStorage.getItem('gengarUltimaCompra')) || [];
        
        if (productosComprados.length === 0) {
            if (contenedor) contenedor.innerHTML = '<p>No hay información de compra disponible.</p>';
            return;
        }
        
        let total = 0;
        let htmlBoleta = '<h2>Boleta de Compra</h2><ul>';
        
        if (contenedor) contenedor.innerHTML = '';
        
        productosComprados.forEach(prod => {
            if (contenedor) {
                const linea = document.createElement('p');
                const subtotal = prod.precio * prod.cantidad;
                const texto = `${prod.nombre} x${prod.cantidad} - $${subtotal.toFixed(0)}`;
                
                linea.textContent = texto;
                contenedor.appendChild(linea);
                
                total += subtotal;
                htmlBoleta += `<li>${texto}</li>`;
            }
        });
        
        htmlBoleta += `</ul><strong>Total: $${total.toFixed(0)}</strong>`;
        if (totalCompra) totalCompra.textContent = `Total: $${total.toFixed(0)}`;
        
        // Guardar el HTML de la boleta para posible descarga
        localStorage.setItem('gengarBoletaHTML', htmlBoleta);
    }
});

// Función para descargar la boleta
function descargarBoleta() {
    const htmlBoleta = localStorage.getItem('gengarBoletaHTML') || '<h2>No hay información de compra disponible</h2>';
    const blob = new Blob([htmlBoleta], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boleta_gengar.html';
    a.click();
    URL.revokeObjectURL(url);
}

// Función para limpiar los datos de la compra
function limpiarCompra() {
    localStorage.removeItem('gengarUltimaCompra');
    localStorage.removeItem('gengarUltimaCompraId');
}

// Exportar funciones para el HTML
window.descargarBoleta = descargarBoleta;
window.limpiarCompra = limpiarCompra;