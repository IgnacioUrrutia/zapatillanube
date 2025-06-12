// productos.js - Gestión de productos con Firebase
import { db, collection, getDocs, orderBy, query } from "./firebase-config.js";

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
                imagenes: ["assets/img/shoe6.jpg"]
            },
            {
                id: "2",
                nombre: "NIKE SHOCKS",
                precio: 138990,
                imagenes: ["assets/img/shoe7.jpg"]
            },
            // ... resto de productos locales
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
        document.querySelectorAll('.btn-agregar-carrito').forEach(boton => {
            boton.addEventListener('click', agregarAlCarrito);
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