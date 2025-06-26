// productos.js - Gestión de productos con Firebase
import { db, collection, getDocs, orderBy, query, doc, getDoc } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    const gridProductos = document.getElementById('grid-productos');
    const loader = document.getElementById('loader');
    const errorContainer = document.getElementById('error-container');
    const filtroSelect = document.getElementById('filtro-productos');

    function formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(precio);
    }

    function crearTarjetaProducto(producto) {
        const productoDiv = document.createElement('div');
        productoDiv.classList.add('producto');

        const imagenUrl = producto.imagenes && producto.imagenes.length > 0
            ? producto.imagenes[0]
            : 'https://via.placeholder.com/600x400?text=Imagen+no+disponible';

        productoDiv.innerHTML = `
            <img src="${imagenUrl}" alt="${producto.nombre}" class="producto-imagen">
            <h3>${producto.nombre}</h3>
            <p class="producto-precio">${formatearPrecio(producto.precio)}</p>
            <button class="btn-comprar ver-detalles" data-id="${producto.id}">Ver Detalles</button>
            <button class="btn-agregar-carrito" 
                    data-id="${producto.id}" 
                    data-nombre="${producto.nombre}" 
                    data-precio="${producto.precio}" 
                    data-imagen="${imagenUrl}">
                Añadir al Carrito
            </button>
        `;
        return productoDiv;
    }

    // Variable para almacenar los productos cargados desde Firestore
    let productosFirestore = [];

    // Función para cargar productos desde Firestore
    async function cargarProductosFirestore() {
        if (loader) loader.style.display = 'block';
        if (errorContainer) errorContainer.textContent = '';
        
        try {
            // Consulta a la colección "productos" en Firestore
            const productosRef = collection(db, "productos");
            const q = query(productosRef, orderBy("nombre"));
            const querySnapshot = await getDocs(q);
            
            productosFirestore = [];
            querySnapshot.forEach((doc) => {
                const productoData = doc.data();
                productosFirestore.push({
                    id: doc.id,
                    nombre: productoData.nombre,
                    precio: productoData.precio,
                    imagenes: productoData.imagenes || [],
                    descripcion: productoData.descripcion,
                    categoria: productoData.categoria,
                    stock: productoData.stock
                });
            });
            
            renderizarProductos(productosFirestore);
        } catch (error) {
            console.error("Error al cargar los productos desde Firestore:", error);
            if (errorContainer) {
                errorContainer.textContent = "Error al cargar los productos. Por favor, intenta nuevamente.";
            }
            // Si hay error, cargar productos locales como respaldo
            cargarProductosLocales();
        } finally {
            if (loader) loader.style.display = 'none';
        }
    }

    // Función para cargar productos locales (respaldo si falla Firestore)
    function cargarProductosLocales() {
        console.log("Cargando productos locales como respaldo");
        const productosLocales = [
            {
                id: "1",
                nombre: "AIR JORDAN 6 RETRO 'CARMINE' 2021",
                precio: 149990,
                imagenes: ["assets/img/shoe6.jpg"],
                descripcion: "Las Air Jordan 6 Retro 'Carmine' son un clásico renovado para el 2021. Con su icónica combinación de colores rojo, blanco y negro, estas zapatillas ofrecen un estilo inconfundible y confort premium."
            },
            {
                id: "2",
                nombre: "NIKE SHOCKS",
                precio: 138990,
                imagenes: ["assets/img/shoe7.jpg"],
                descripcion: "Las Nike Shocks son conocidas por su sistema único de amortiguación. Diseñadas para rendimiento óptimo y estilo distintivo, estas zapatillas son perfectas tanto para deportistas como para amantes de la moda urbana."
            },
            // Más productos locales si es necesario
        ];
        renderizarProductos(productosLocales);
    }

    function renderizarProductos(productos) {
        if (!gridProductos) return;
        
        // Limpia el grid antes de mostrar los productos
        gridProductos.innerHTML = '';
        
        if (productos.length === 0) {
            gridProductos.innerHTML = '<p>No se encontraron productos.</p>';
            return;
        }
        
        productos.forEach(producto => {
            const tarjetaProducto = crearTarjetaProducto(producto);
            gridProductos.appendChild(tarjetaProducto);
        });
        
        agregarEventosBotones();
    }

    function agregarEventosBotones() {
        // Eventos para los botones de agregar al carrito
        document.querySelectorAll('.btn-agregar-carrito').forEach(boton => {
            boton.addEventListener('click', agregarAlCarrito);
        });
        
        // Eventos para los botones de ver detalles
        document.querySelectorAll('.ver-detalles').forEach(boton => {
            boton.addEventListener('click', mostrarDetallesProducto);
        });
    }

    function agregarAlCarrito(event) {
        const boton = event.currentTarget;
        const id = boton.getAttribute('data-id');
        const nombre = boton.getAttribute('data-nombre');
        const precio = parseFloat(boton.getAttribute('data-precio'));
        const imagen = boton.getAttribute('data-imagen');

        if (typeof window.carritoFunctions !== 'undefined' && window.carritoFunctions.agregarAlCarrito) {
            window.carritoFunctions.agregarAlCarrito({ id, nombre, precio, imagen });
        } else {
            console.error('Error: carritoFunctions no está definido.');
        }
    }

    // Función para mostrar detalles del producto
    async function mostrarDetallesProducto(event) {
        const productoId = event.currentTarget.getAttribute('data-id');
        console.log(`Mostrando detalles del producto ID: ${productoId}`);
        
        // Buscar el producto en la lista cargada
        const producto = productosFirestore.find(p => p.id === productoId);
        
        if (!producto) {
            console.error(`Producto con ID ${productoId} no encontrado`);
            return;
        }
        
        // Crear modal para mostrar detalles
        const modal = document.createElement('div');
        modal.className = 'producto-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        
        // Contenido del modal
        const imagenUrl = producto.imagenes && producto.imagenes.length > 0
            ? producto.imagenes[0]
            : 'https://via.placeholder.com/600x400?text=Imagen+no+disponible';
        
        modal.innerHTML = `
            <div style="background-color: white; padding: 20px; border-radius: 10px; max-width: 800px; width: 90%; position: relative;">
                <button class="cerrar-modal" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 1; min-width: 300px;">
                        <img src="${imagenUrl}" alt="${producto.nombre}" style="width: 100%; border-radius: 8px;">
                    </div>
                    <div style="flex: 1; min-width: 300px;">
                        <h2 style="margin-top: 0;">${producto.nombre}</h2>
                        <p style="font-size: 1.5rem; font-weight: bold; color: #111;">${formatearPrecio(producto.precio)}</p>
                        <p style="margin-bottom: 20px;">${producto.descripcion || 'No hay descripción disponible.'}</p>
                        <p><strong>Categoría:</strong> ${producto.categoria || 'No especificada'}</p>
                        <p><strong>Stock:</strong> ${producto.stock || 0} unidades</p>
                        <button class="btn-comprar btn-agregar-modal" 
                                data-id="${producto.id}" 
                                data-nombre="${producto.nombre}" 
                                data-precio="${producto.precio}" 
                                data-imagen="${imagenUrl}" 
                                style="width: 100%; margin-top: 20px; padding: 12px;">
                            Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Añadir modal al body
        document.body.appendChild(modal);
        
        // Evento para cerrar modal
        modal.querySelector('.cerrar-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Evento para agregar al carrito desde el modal
        modal.querySelector('.btn-agregar-modal').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const nombre = this.getAttribute('data-nombre');
            const precio = parseFloat(this.getAttribute('data-precio'));
            const imagen = this.getAttribute('data-imagen');
            
            if (typeof window.carritoFunctions !== 'undefined' && window.carritoFunctions.agregarAlCarrito) {
                window.carritoFunctions.agregarAlCarrito({ id, nombre, precio, imagen });
                // Opcional: Cerrar el modal después de agregar al carrito
                document.body.removeChild(modal);
            }
        });
    }

    function aplicarFiltro() {
        let productosFiltrados = [...productosFirestore]; // copia para no mutar original

        switch(filtroSelect.value) {
            case 'precio-asc':
                productosFiltrados.sort((a, b) => a.precio - b.precio);
                break;
            case 'precio-desc':
                productosFiltrados.sort((a, b) => b.precio - a.precio);
                break;
            case 'nombre-asc':
                productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case 'nombre-desc':
                productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
                break;
            case 'default':
            default:
                // No hacer nada, mantener el orden original
                break;
        }
        renderizarProductos(productosFiltrados);
    }

    // Listener para el filtro
    if (filtroSelect) {
        filtroSelect.addEventListener('change', aplicarFiltro);
    }

    // Cargar productos desde Firestore al iniciar
    cargarProductosFirestore();
});
