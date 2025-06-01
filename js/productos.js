// productos.js adaptado para cargar productos locales con imágenes personalizadas y filtro

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

        const imagenUrl = producto.images && producto.images[0]
            ? producto.images[0]
            : 'https://via.placeholder.com/600x400?text=Imagen+no+disponible';

        productoDiv.innerHTML = `
            <img src="${imagenUrl}" alt="${producto.title}" class="producto-imagen">
            <h3>${producto.title}</h3>
            <p class="producto-precio">${formatearPrecio(producto.price)}</p>
            <button class="btn-agregar-carrito" data-id="${producto.id}" data-nombre="${producto.title}" data-precio="${producto.price}" data-imagen="${imagenUrl}">
                Añadir al Carrito
            </button>
        `;
        return productoDiv;
    }

    // Guardamos los productos en esta variable global local para poder filtrarlos
    const productosLocales = [
        {
            id: "1",
            title: "AIR JORDAN 6 RETRO 'CARMINE' 2021",
            price: 149990,
            images: ["assets/img/shoe6.jpg"]
        },
        {
            id: "2",
            title: "NIKE SHOCKS",
            price: 138990,
            images: ["assets/img/shoe7.jpg"]
        },
        {
            id: "3",
            title: "AF1 NOCTA",
            price: 189990,
            images: ["assets/img/shoe8.jpg"]
        },
        {
            id: "4",
            title: "AIR JORDAN 6 RETRO WHITE INFRARED 23",
            price: 119990,
            images: ["assets/img/shoe9.jpg"]
        },
        {
            id: "5",
            title: "Jordan MVP Hombre Zapatillas",
            price: 88990,
            images: ["assets/img/shoe10.jpg"]
        },
        {
            id: "6",
            title: "Zapatilla Fantasma X",
            price: 59990,
            images: ["assets/img/shoe11.jpg"]
        },
        {
            id: "7",
            title: "AIR JORDAN 6 RETRO 'CARMINE' 2021",
            price: 149990,
            images: ["assets/img/shoe4.jpg"]
        },
        {
            id: "8",
            title: "NIKE SHOCKS",
            price: 138990,
            images: ["assets/img/shoe12.jpg"]
        },
        {
            id: "9",
            title: "NUKE SB POWERPUFF",
            price: 189990,
            images: ["assets/img/shoe13.jpg"]
        },
        {
            id: "10",
            title: "AIR JORDAN 6 RETRO WHITE INFRARED 23",
            price: 119990,
            images: ["assets/img/shoe14.jpg"]
        },
        {
            id: "11",
            title: "Jordan MVP Hombre Zapatillas",
            price: 88990,
            images: ["assets/img/shoe15.jpg"]
        },
        {
            id: "12",
            title: "Zapatilla Fantasma X",
            price: 59990,
            images: ["assets/img/shoe16.jpg"]
        },
        {
            id: "13",
            title: "Zapatilla Fantasma X",
            price: 59990,
            images: ["assets/img/shoe17.jpg"]
        },
        {
            id: "14",
            title: "Zapatilla Fantasma X",
            price: 59990,
            images: ["assets/img/shoe18.jpg"]
        },
        {
            id: "15",
            title: "Zapatilla Fantasma X",
            price: 59990,
            images: ["assets/img/shoe19.jpg"]
        },
        {
            id: "16",
            title: "Poleron",
            price: 59990,
            images: ["assets/img/polerones.jpg"]
        }
    ];

    function renderizarProductos(productos) {
        // Limpia el grid antes de mostrar los productos
        gridProductos.innerHTML = '';
        productos.forEach(producto => {
            const tarjetaProducto = crearTarjetaProducto(producto);
            gridProductos.appendChild(tarjetaProducto);
        });
        agregarEventosBotones();
    }

    function cargarProductosLocales() {
        loader.style.display = 'none';
        renderizarProductos(productosLocales);
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
        let productosFiltrados = [...productosLocales]; // copia para no mutar original

        switch(filtroSelect.value) {
            case 'precio-asc':
                productosFiltrados.sort((a, b) => a.price - b.price);
                break;
            case 'precio-desc':
                productosFiltrados.sort((a, b) => b.price - a.price);
                break;
            case 'nombre-asc':
                productosFiltrados.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'nombre-desc':
                productosFiltrados.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'default':
            default:
                // No hacer nada, mantener el orden original
                break;
        }
        renderizarProductos(productosFiltrados);
    }

    // Listener para el filtro
    filtroSelect.addEventListener('change', aplicarFiltro);

    cargarProductosLocales();
});
