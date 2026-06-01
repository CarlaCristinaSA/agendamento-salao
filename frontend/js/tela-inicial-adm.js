document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navbar-toggle');
    const navMenu = document.getElementById('navbar-nav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navToggle) {
        console.warn('navbar-toggle não encontrado');
        return;
    }
    if (!navMenu) {
        console.warn('navbar-nav não encontrado');
        return;
    }

    console.log('✓ Menu hamburguer inicializado');

    navToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Clicou no toggle');
        
        navToggle.classList.toggle('is-open');
        navMenu.classList.toggle('is-open');

        const isOpen = navToggle.classList.contains('is-open');
        navToggle.setAttribute('aria-expanded', isOpen);
        
        console.log('Menu aberto:', isOpen);
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navToggle.classList.remove('is-open');
            navMenu.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', false);
            console.log('Menu fechado (link clicado)');
        });
    });

    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target);
        const isClickOnToggle = navToggle.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('is-open')) {
            navToggle.classList.remove('is-open');
            navMenu.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', false);
            console.log('Menu fechado (clique fora)');
        }
    });
});