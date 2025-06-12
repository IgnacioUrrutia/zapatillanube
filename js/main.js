// main.js - Funcionalidades principales de la página de inicio
document.addEventListener('DOMContentLoaded', function() {
    // Agregar eventos a los botones de "Agregar al carrito" en la página principal
    const botonesAgregar = document.querySelectorAll('.btn-agregar-carrito');
    
    botonesAgregar.forEach(boton => {
        boton.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const nombre = this.getAttribute('data-nombre');
            const precio = parseFloat(this.getAttribute('data-precio'));
            const imagen = this.getAttribute('data-imagen');
            
            // Usar la función global del carrito para agregar el producto
            if (typeof window.carritoFunctions !== 'undefined' && window.carritoFunctions.agregarAlCarrito) {
                window.carritoFunctions.agregarAlCarrito({ id, nombre, precio, imagen });
            } else {
                console.error('Error: carritoFunctions no está definido.');
            }
        });
    });
    
    // Asegurarse de que el botón "Finalizar Compra" redirija a la página de opciones de pago
    const checkoutBtn = document.getElementById('checkout-carrito');
    if (checkoutBtn) {
        // Sobrescribir el evento existente (si lo hay)
        const oldClickEvent = checkoutBtn.onclick;
        checkoutBtn.onclick = function(e) {
            // Si hay carritoFunctions definido, usar su función procesarCheckout
            if (typeof window.carritoFunctions !== 'undefined') {
                // Prevenir la acción por defecto
                e.preventDefault();
                
                // Redirigir a la página de opciones de pago
                window.location.href = 'pago-options.html';
            } else if (oldClickEvent) {
                // Si hay un evento click antiguo, ejecutarlo
                return oldClickEvent.call(this, e);
            }
        };
    }
});