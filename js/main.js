document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const heroShoe = document.querySelector('.hero-shoe');

    // Efecto de cambio de color en navbar al hacer scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(33, 33, 33, 0.9)';
        } else {
            navbar.style.backgroundColor = 'var(--dark-color)';
        }
    });

    // Animación de desplazamiento parallax suave
    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset;
        heroShoe.style.transform = `translateY(${scrollPosition * 0.3}px)`;
    });

    // Animación de productos al hacer scroll
    const productos = document.querySelectorAll('.producto');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideIn 1s';
            }
        });
    }, observerOptions);

    productos.forEach(producto => {
        observer.observe(producto);
    });
});