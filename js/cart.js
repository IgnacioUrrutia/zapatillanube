// cart.js actualizado para redirigir a pantallacompra.html

let carritoItems = JSON.parse(localStorage.getItem('gengarMarketCart')) || [];
let subtotal = 0;

document.addEventListener('DOMContentLoaded', () => {
    actualizarCarritoUI();

    const btnCarritoNav = document.getElementById('carrito-nav');
    if (btnCarritoNav) btnCarritoNav.addEventListener('click', toggleCarrito);

    const btnCerrarCarrito = document.getElementById('cerrar-carrito');
    if (btnCerrarCarrito) btnCerrarCarrito.addEventListener('click', toggleCarrito);

    const carritoOverlay = document.getElementById('carrito-overlay');
    if (carritoOverlay) carritoOverlay.addEventListener('click', toggleCarrito);

    const btnVaciarCarrito = document.getElementById('vaciar-carrito');
    if (btnVaciarCarrito) btnVaciarCarrito.addEventListener('click', vaciarCarrito);

    const btnCheckout = document.getElementById('checkout-carrito');
    if (btnCheckout) btnCheckout.addEventListener('click', procesarCheckout);
});

function toggleCarrito(event) {
    event.preventDefault();
    const carritoModal = document.getElementById('carrito-modal');
    const carritoOverlay = document.getElementById('carrito-overlay');

    carritoModal.classList.toggle('activo');
    carritoOverlay.classList.toggle('activo');

    actualizarCarritoUI();
}

function agregarAlCarrito(producto) {
    const itemExistente = carritoItems.find(item => item.id === producto.id);
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carritoItems.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    actualizarCarritoUI();
    mostrarNotificacion(`${producto.nombre} añadido al carrito`);
}

function modificarCantidad(id, accion) {
    const item = carritoItems.find(item => item.id === id);
    if (!item) return;

    if (accion === 'aumentar') {
        item.cantidad++;
    } else if (accion === 'disminuir') {
        item.cantidad--;
        if (item.cantidad <= 0) {
            eliminarDelCarrito(id);
            return;
        }
    }

    guardarCarrito();
    actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
    carritoItems = carritoItems.filter(item => item.id !== id);
    guardarCarrito();
    actualizarCarritoUI();
}

function vaciarCarrito() {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        carritoItems = [];
        guardarCarrito();
        actualizarCarritoUI();
    }
}

function guardarCarrito() {
    localStorage.setItem('gengarMarketCart', JSON.stringify(carritoItems));
}

function actualizarCarritoUI() {
    const carritoContainer = document.getElementById('carrito-items');
    const contadorCarrito = document.getElementById('contador-carrito');
    const subtotalElement = document.getElementById('subtotal-carrito');

    if (!carritoContainer) return;

    carritoContainer.innerHTML = '';
    subtotal = 0;
    let totalItems = 0;

    if (carritoItems.length === 0) {
        carritoContainer.innerHTML = '<div class="carrito-vacio">Tu carrito está vacío</div>';
    } else {
        carritoItems.forEach(item => {
            subtotal += item.precio * item.cantidad;
            totalItems += item.cantidad;

            const itemElement = document.createElement('div');
            itemElement.className = 'carrito-item';
            itemElement.innerHTML = `
                <div class="carrito-item-imagen"><img src="${item.imagen}" alt="${item.nombre}"></div>
                <div class="carrito-item-detalles">
                    <h4>${item.nombre}</h4>
                    <div class="carrito-item-precio">$${item.precio.toFixed(0)}</div>
                </div>
                <div class="carrito-item-cantidad">
                    <button class="btn-cantidad btn-disminuir" data-id="${item.id}">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-cantidad btn-aumentar" data-id="${item.id}">+</button>
                </div>
                <div class="carrito-item-total">$${(item.precio * item.cantidad).toFixed(0)}</div>
                <button class="btn-eliminar" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            `;
            carritoContainer.appendChild(itemElement);
        });
    }

    contadorCarrito.textContent = totalItems;
    contadorCarrito.style.display = totalItems > 0 ? 'flex' : 'none';
    subtotalElement.textContent = `$${subtotal.toFixed(0)}`;

    document.querySelectorAll('.btn-aumentar').forEach(btn => btn.addEventListener('click', e => modificarCantidad(e.currentTarget.getAttribute('data-id'), 'aumentar')));
    document.querySelectorAll('.btn-disminuir').forEach(btn => btn.addEventListener('click', e => modificarCantidad(e.currentTarget.getAttribute('data-id'), 'disminuir')));
    document.querySelectorAll('.btn-eliminar').forEach(btn => btn.addEventListener('click', e => eliminarDelCarrito(e.currentTarget.getAttribute('data-id'))));
}

function mostrarNotificacion(mensaje) {
    alert(mensaje);
}

function procesarCheckout() {
    if (carritoItems.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de proceder.');
        return;
    }

    localStorage.setItem('gengarUltimaCompra', JSON.stringify(carritoItems));
    carritoItems = [];
    guardarCarrito();
    actualizarCarritoUI();

    // Animación de cierre del carrito antes de redirigir
    const carritoModal = document.getElementById('carrito-modal');
    const carritoOverlay = document.getElementById('carrito-overlay');
    carritoModal.classList.remove('activo');
    carritoOverlay.classList.remove('activo');

    setTimeout(() => {
        window.location.href = 'pantallacompra.html';
    }, 500); // Espera 0.5s para permitir que la animación visual termine
}


window.carritoFunctions = { agregarAlCarrito };
