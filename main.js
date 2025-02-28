let currentPage = 1;
const limit = 12;
let isLoading = false;
let isAdult = false;
let allProjects = [];

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/PaperKFront/service-worker.js')
        .then(function(reg) {
            console.log('Service Worker registered', reg);
        })
        .catch(function(error) {
            console.log('Service Worker registration failed', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingProgress = document.querySelector('.loading-progress');
    
    if (sessionStorage.getItem('animationShown')) {
        loadingScreen.style.display = 'none';
        return;
    }

    let progress = 0;

    function simulateLoading() {
        if (progress < 100) {
            progress += Math.random() * 10;
            progress = Math.min(progress, 100);
            loadingProgress.style.width = `${progress}%`;
            setTimeout(simulateLoading, 200);
        } else {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.visibility = 'hidden';
                sessionStorage.setItem('animationShown', 'true');
                
                // Add entrance animations for main elements
                animateEntranceElements();
            }, 500);
        }
    }

    simulateLoading();
});

function animateEntranceElements() {
    const elements = [
        document.querySelector('.header-principal'),
        document.querySelector('.hero-section'),
        document.querySelector('.info-section'),
        document.querySelector('.top-publishers'),
        document.querySelector('.featured-projects'),
        document.querySelector('.main-content')
    ];
    
    elements.forEach((element, index) => {
        if (element) {
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 200);
        }
    });
}

function handleLogout() {
    // Add a fade-out animation
    document.body.classList.add('fade-out');
    
    setTimeout(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        sessionStorage.clear();
        window.location.href = 'login.html';
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        });
    });
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const ageVerificationToggle = document.getElementById('ageVerificationToggle');
    if (ageVerificationToggle) {
        isAdult = localStorage.getItem('isAdult') === 'true';
        ageVerificationToggle.checked = isAdult;
        ageVerificationToggle.addEventListener('change', handleAgeVerificationToggle);
    }

    loadProjects(currentPage);
    loadFeaturedProjects();
    window.addEventListener('scroll', handleScroll);

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    initializeCarousel();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchProjects();
        });
    }
    
    // Initialize file input labels
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (label && this.files.length > 0) {
                label.textContent = this.files[0].name;
            }
        });
    });
    
    // Add animation to project cards on scroll
    animateOnScroll();
});

function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.paper, .featured-project').forEach(item => {
        observer.observe(item);
    });
}

function getToken() {
    return localStorage.getItem('access_token');
}

function handleAgeVerificationToggle(event) {
    if (event.target.checked && !localStorage.getItem('ageConfirmed')) {
        if (confirm('¿Eres mayor de edad? Este contenido puede ser explícito.')) {
            isAdult = true;
            localStorage.setItem('ageConfirmed', 'true');
        } else {
            event.target.checked = false;
            isAdult = false;
        }
    } else {
        isAdult = event.target.checked;
    }
    localStorage.setItem('isAdult', isAdult);
    
    // Add fade transition before reload
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.reload();
    }, 300);
}

function loadProjects(page) {
    if (isLoading) return;
    isLoading = true;
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Cargando proyectos...</p>';
    document.getElementById('projectsContainer').appendChild(loadingIndicator);

    const url = isAdult
        ? `https://proyectpaperk-ttty.onrender.com/proyectos/proyectos/sensibles?page=${page}&size=${limit}`
        : `https://proyectpaperk-ttty.onrender.com/proyectos/proyectos/traer?page=${page}&size=${limit}`;

    fetch(url, {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(projects => {
        // Remove loading indicator
        document.querySelector('.loading-indicator')?.remove();
        
        if (projects.length === 0) {
            window.removeEventListener('scroll', handleScroll);
            
            if (page === 1) {
                const noProjectsMessage = document.createElement('div');
                noProjectsMessage.className = 'no-projects-message';
                noProjectsMessage.innerHTML = '<p>No hay proyectos disponibles en este momento.</p>';
                document.getElementById('projectsContainer').appendChild(noProjectsMessage);
            }
            return;
        }

        allProjects = allProjects.concat(projects);
        displayProjects(projects);
        currentPage++;
        isLoading = false;
    })
    .catch(error => {
        console.error('Error al cargar los proyectos:', error);
        isLoading = false;
        document.querySelector('.loading-indicator')?.remove();
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = '<p>Error al cargar los proyectos. Por favor, intenta de nuevo más tarde.</p>';
        document.getElementById('projectsContainer').appendChild(errorMessage);
    });
}

function displayProjects(projects) {
    const container = document.getElementById('projectsContainer');
    
    projects.forEach(project => {
        if ((isAdult && project.contenido_sensible) || (!isAdult && !project.contenido_sensible)) {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'paper';
            projectDiv.innerHTML = `
                <h2>${project.nombre}</h2>
                <p><strong>Subido por:</strong> ${project.usuario_nombre}</p>
                <img src="https://proyectpaperk-ttty.onrender.com/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
                <p>${project.descripcion.length > 100 ? project.descripcion.substring(0, 100) + '...' : project.descripcion}</p>
                <div class="project-actions">
                    <button class="view-more-btn" onclick="openModal('${project.id}', '${project.nombre}', '${project.usuario_nombre}', '${project.descripcion}', '${project.imagen}', '${project.archivo_pdf}')">Ver más</button>
                    <button class="like-button" onclick="toggleLike('${project.id}')" data-likes="${project.likes_count}">
                        <span class="heart-icon">❤️</span>
                        <span class="likes-count">${project.likes_count}</span>
                    </button>
                </div>
            `;
            container.appendChild(projectDiv);
        }
    });
}

function searchProjects() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredProjects = allProjects.filter(project => 
        project.nombre.toLowerCase().includes(searchTerm) ||
        project.descripcion.toLowerCase().includes(searchTerm) ||
        project.usuario_nombre.toLowerCase().includes(searchTerm)
    );

    const container = document.getElementById('projectsContainer');
    container.innerHTML = '';

    if (filteredProjects.length === 0) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.className = 'no-results-message';
        noResultsMessage.innerHTML = `<p>No se encontraron resultados para "${searchTerm}"</p>`;
        container.appendChild(noResultsMessage);
    } else {
        displayProjects(filteredProjects);
    }
}

function loadFeaturedProjects() {
    console.log('Loading featured projects...');
    
    const mostLikedProject = document.getElementById('mostLikedProject');
    const latestProject = document.getElementById('latestProject');
    
    if (mostLikedProject) mostLikedProject.innerHTML = '<div class="spinner"></div>';
    if (latestProject) latestProject.innerHTML = '<div class="spinner"></div>';
    
    fetch('https://proyectpaperk-ttty.onrender.com/proyectos/proyectos/destacados', {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Featured projects data:', data);
        if (data.most_liked) {
            displayFeaturedProject(data.most_liked, 'mostLikedProject', 'Proyecto más popular');
        } else {
            console.log('No most liked project found');
            if (mostLikedProject) mostLikedProject.innerHTML = '<p>No hay proyectos destacados disponibles</p>';
        }
        if (data.latest) {
            displayFeaturedProject(data.latest, 'latestProject', 'Proyecto más reciente');
        } else {
            console.log('No latest project found');
            if (latestProject) latestProject.innerHTML = '<p>No hay proyectos recientes disponibles</p>';
        }
    })
    .catch(error => {
        console.error('Error loading featured projects:', error);
        document.getElementById('featuredProjects').style.display = 'none';
    });
}

function displayFeaturedProject(project, containerId, title) {
    if (!project) {
        console.log(`No project data for ${containerId}`);
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    container.innerHTML = `
        <h3>${title}</h3>
        <h4>${project.nombre}</h4>
        <p><strong>Subido por:</strong> ${project.usuario_nombre}</p>
        <img src="https://proyectpaperk-ttty.onrender.com/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
        <p>${project.descripcion.length > 150 ? project.descripcion.substring(0, 150) + '...' : project.descripcion}</p>
        <div class="project-actions">
            <button class="download-button" onclick="downloadPDF('${project.archivo_pdf}', '${project.id}')">Descargar PDF</button>
            <button class="like-button" onclick="toggleLike('${project.id}')" data-likes="${project.likes_count}">
                <span class="heart-icon">❤️</span>
                <span class="likes-count">${project.likes_count}</span>
            </button>
        </div>
        <div id="loadingSpinner-${project.id}" class="spinner" style="display: none;"></div>
    `;
}

function toggleLike(projectId) {
    const likeButton = document.querySelector(`button[onclick="toggleLike('${projectId}')"]`);
    const heartIcon = likeButton.querySelector('.heart-icon');
    
    // Add animation
    heartIcon.classList.add('pulse');
    
    fetch(`https://proyectpaperk-ttty.onrender.com/proyectos/proyectos/${projectId}/like`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const likesCountSpan = likeButton.querySelector('.likes-count');
        likesCountSpan.textContent = data.likes_count;
        likeButton.classList.toggle('liked', data.liked);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            heartIcon.classList.remove('pulse');
        }, 600);
    })
    .catch(error => {
        console.error('Error toggling like:', error);
        heartIcon.classList.remove('pulse');
    });
}

function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading) {
        loadProjects(currentPage);
    }
}

function downloadPDF(pdfPath, projectId) {
    const downloadButton = event.target;
    
    let loadingSpinner = document.getElementById(`loadingSpinner-${projectId}`);
    if (!loadingSpinner) {
        loadingSpinner = document.createElement('div');
        loadingSpinner.id = `loadingSpinner-${projectId}`;
        loadingSpinner.className = 'spinner';
        loadingSpinner.style.display = 'none';
        downloadButton.parentNode.insertBefore(loadingSpinner, downloadButton.nextSibling);
    }

    downloadButton.disabled = true;
    downloadButton.textContent = 'Descargando...';
    loadingSpinner.style.display = 'inline-block';

    fetch(`https://proyectpaperk-ttty.onrender.com/proyectos/proyectos/${projectId}`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (response.status === 401) {
            handleUnauthorized();
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return fetch(`https://proyectpaperk-ttty.onrender.com/${pdfPath}`, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfPath.split('/').pop();
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Descarga completada';
        downloadButton.parentNode.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.remove();
        }, 3000);
    })
    .catch(error => {
        console.error('Error al descargar el PDF:', error);
        alert('Error al descargar el proyecto. Por favor, intenta de nuevo.');
    })
    .finally(() => {
        downloadButton.disabled = false;
        downloadButton.textContent = 'Descargar PDF';
        loadingSpinner.style.display = 'none';
    });
}

function createProject(event) {
    event.preventDefault();
    const form = document.querySelector('#proyectoForm');
    const formData = new FormData(form);

    formData.append('contenido_sensible', form.contenido_sensible.checked);

    const submitButton = document.getElementById('submitButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    submitButton.disabled = true;
    submitButton.textContent = 'Subiendo...';
    loadingSpinner.style.display = 'inline-block';

    fetch("https://proyectpaperk-ttty.onrender.com/proyectos/proyectos/", {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        if (response.ok) {
            // Show success animation
            const successAnimation = document.createElement('div');
            successAnimation.className = 'success-animation';
            successAnimation.innerHTML = '<div class="checkmark"></div>';
            form.appendChild(successAnimation);
            
            setTimeout(() => {
                alert("Proyecto creado exitosamente");
                closePopup();
                currentPage = 1;
                document.getElementById('projectsContainer').innerHTML = '';
                loadProjects(currentPage);
                successAnimation.remove();
            }, 1500);
        } else {
            return response.json().then(result => {
                throw new Error(result.detail || 'Error creando proyecto');
            });
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error al subir el proyecto. Por favor, intenta de nuevo.");
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Publicar Proyecto';
        loadingSpinner.style.display = 'none';
    });
}

function openPopup() {
    document.getElementById("popupForm").style.display = "flex";
    document.getElementById("popupForm").classList.add("show");
    
    // Reset form
    document.getElementById("proyectoForm").reset();
    
    // Reset file input labels
    const fileLabels = document.querySelectorAll('.file-input-label');
    fileLabels.forEach(label => {
        label.textContent = 'Seleccionar archivo';
    });
    
    // Add animation to form elements
    const formElements = document.querySelectorAll('.popup-content > *, .form-group');
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100 + (index * 50));
    });
}

function closePopup() {
    const popupForm = document.getElementById("popupForm");
    popupForm.classList.remove("show");
    setTimeout(() => {
        popupForm.style.display = "none";
    }, 300);
}

function handleUnauthorized() {
    alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function initializeCarousel() {
    const carousel = document.querySelector('.carousel');
    const carouselInner = carousel.querySelector('.carousel-inner');
    const items = carousel.querySelectorAll('.carousel-item');
    const prevButton = document.querySelector('.carousel-control.prev');
    const nextButton = document.querySelector('.carousel-control.next');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    let currentIndex = 0;
    const totalItems = items.length;

    indicatorsContainer.innerHTML = '';

    items.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });

    const indicators = indicatorsContainer.querySelectorAll('.indicator');

    function goToSlide(index) {
        currentIndex = index;
        const offset = -index * 100;
        carouselInner.style.transform = `translateX(${offset}%)`;
        updateIndicators();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalItems;
        goToSlide(currentIndex);
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        goToSlide(currentIndex);
    }

    function updateIndicators() {
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    nextButton.addEventListener('click', nextSlide);
    prevButton.addEventListener('click', prevSlide);

    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            nextSlide();
        } else if (touchEndX - touchStartX > 50) {
            prevSlide();
        }
    }, false);

    let autoPlayInterval = setInterval(nextSlide, 5000);

    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoPlayInterval);
    });

    carousel.addEventListener('mouseleave', () => {
        autoPlayInterval = setInterval(nextSlide, 5000);
    });

    goToSlide(0);
}

document.addEventListener('DOMContentLoaded', initializeCarousel);

document.querySelector('#proyectoForm')?.addEventListener('submit', event => {
    event.preventDefault();
    if (!getToken()) {
        alert("Por favor, inicia sesión para crear un proyecto.");
        return;
    }
    createProject(event);
});

function openModal(id, nombre, usuario_nombre, descripcion, imagen, archivo_pdf) {
    const modal = document.getElementById('projectModal');
    const modalContent = document.getElementById('modalProjectContent');
    
    modalContent.innerHTML = `
        <div class="modal-project-details">
            <img src="https://proyectpaperk-ttty.onrender.com/${imagen}" alt="Imagen del Proyecto" class="modal-project-image">
            <div class="modal-project-info">
                <h2 class="modal-project-title">${nombre}</h2>
                <p class="modal-project-author"><strong>Subido por:</strong> ${usuario_nombre}</p>
                <p class="modal-project-description">${descripcion}</p>
                <button class="modal-download-btn" onclick="downloadPDF('${archivo_pdf}', '${id}')">Descargar PDF</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    modal.classList.add('show');
    
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 10);
}

window.onclick = function(event) {
    const modal = document.getElementById('projectModal');
    if (event.target == modal) {
        closeModal();
    }
}

document.querySelector('.close').onclick = function() {
    closeModal();
}

function closeModal() {
    const modal = document.getElementById('projectModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.style.transform = 'translateY(20px)';
    modalContent.style.opacity = '0';
    
    setTimeout(() => {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const userInput = document.getElementById('user-input');
    const chatBubble = document.getElementById('chat-bubble');
    const minimizeBtn = document.getElementById('minimize-btn');
    const chatbotHeader = document.getElementById('chatbot-header');

    const botResponses = [
        {
            keywords: ['hola', 'buenas', 'saludos', 'hey', 'ola', 'que tal', 'qué tal', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'bienvenido', 'welcome'],
            response: "¡Hola! Bienvenido a ProyectPaperK. ¿En qué puedo ayudarte hoy?"
        },
        {
            keywords: ['que es', 'qué es', 'proyectpaperk', 'plataforma', 'sitio', 'web', 'página', 'acerca de', 'about', 'información', 'info', 'tell me about', 'cuéntame sobre', 'explícame', 'explicame'],
            response: "ProyectPaperK es una plataforma donde los amantes del origami pueden subir y compartir sus proyectos en formato PDF junto con una imagen representativa."
        },
        {
            keywords: ['cómo funciona', 'como funciona', 'uso', 'guía', 'instrucciones', 'pasos', 'how to', 'cómo puedo', 'como puedo'],
            response: "Puedes explorar proyectos de origami, subir tus propios proyectos, descargar PDFs de proyectos que te interesen, y dar 'me gusta' a los proyectos que más te gusten."
        },
        {
            keywords: ['subir', 'cargar', 'publicar', 'compartir', 'nuevo proyecto', 'añadir', 'upload', 'post', 'share'],
            response: "Para subir un proyecto, inicia sesión, haz clic en 'Publicar' en la barra de navegación, y sigue las instrucciones para subir tu PDF e imagen representativa."
        },
        {
            keywords: ['descargar', 'obtener pdf', 'download', 'get pdf'],
            response: "Para descargar un proyecto, haz clic en el botón 'Descargar PDF' en la tarjeta del proyecto. ¡Es fácil y gratuito!"
        },
        {
            keywords: ['login', 'iniciar sesión', 'acceder', 'entrar', 'sign in'],
            response: "Haz clic en 'Iniciar sesión' en la parte superior para ingresar. Si no tienes cuenta, regístrate primero."
        },
        {
            keywords: ['registrarse', 'crear cuenta', 'unirse', 'sign up', 'register'],
            response: "Para registrarte, haz clic en 'Registrarse' en la parte superior, y sigue las instrucciones para crear una cuenta. ¡Es gratis y rápido!"
        },
        {
            keywords: ['precio', 'costo', 'tarifa', 'pagar', 'cost', 'price'],
            response: "Todo en ProyectPaperK es completamente gratuito. ¡Disfruta explorando y compartiendo tus proyectos!"
        },
        {
            keywords: ['persona', 'humano', 'representante', 'alguien', 'contacto', 'hablar con alguien', 'chat', 'person', 'human', 'representative', 'contact', 'talk to someone'],
            response: "Entiendo que a veces prefieras hablar con una persona. Aunque soy un asistente virtual, puedo ayudarte con la mayoría de las preguntas. Sin embargo, si necesitas hablar con alguien del equipo, puedes contactarnos a través de <a href='https://wa.me/+543472468850' target='_blank' class='whatsapp-link'>WhatsApp</a>. Estaremos encantados de ayudarte personalmente."
        },
        {
            keywords: ['no puedo entrar', 'no funciona login', 'problema acceso', 'login error', 'error iniciar sesión', 'login not working'],
            response: "Si tienes problemas para iniciar sesión, intenta restablecer tu contraseña haciendo clic en '¿Olvidaste tu contraseña?' en la página de inicio de sesión. Si el problema persiste, contacta con nosotros para recibir ayuda."
        },
        {
            keywords: ['olvidé contraseña', 'recuperar contraseña', 'restablecer contraseña', 'forgot password', 'reset password'],
            response: "Para restablecer tu contraseña, haz clic en '¿Olvidaste tu contraseña?' en la página de inicio de sesión y sigue las instrucciones."
        },
        {
            keywords: ['qué puedo hacer', 'funciones', 'qué puedo hacer aquí', 'qué ofrece', 'características', 'features'],
            response: "En ProyectPaperK puedes explorar proyectos de origami, subir los tuyos propios, descargar proyectos en PDF, y dar 'me gusta' a los proyectos que más te gusten. También puedes personalizar tu perfil y ver estadísticas de tus proyectos."
        },
        {
            keywords: ['me gusta', 'like', 'dar me gusta', 'cómo dar me gusta', 'like a project'],
            response: "Para dar 'me gusta' a un proyecto, simplemente haz clic en el icono de corazón en la tarjeta del proyecto. ¡Es una manera genial de apoyar a otros creadores!"
        },
        {
            keywords: ['estadísticas', 'stats', 'cómo ver estadísticas', 'ver estadísticas de mis proyectos', 'project stats'],
            response: "Puedes ver las estadísticas de tus proyectos desde la sección 'Mis proyectos' en tu perfil. Te mostrará cuántas veces ha sido descargado y cuántos 'me gusta' ha recibido."
        },
        {
            keywords: ['qué es origami', 'origami', 'sobre origami', 'acerca de origami', 'información origami'],
            response: "El origami es el arte japonés de doblar papel para crear figuras o formas. En ProyectPaperK, puedes explorar y compartir proyectos que muestran la belleza y creatividad del origami."
        },
        {
            keywords: ['materiales', 'qué necesito', 'materiales origami', 'qué papel usar', 'tipo de papel', 'materials for origami'],
            response: "Para hacer origami, lo principal es usar papel. Puedes usar papel normal o papel especial para origami, que es más delgado y fácil de doblar. ¡No necesitas mucho más, solo tus manos y creatividad!"
        },
        {
            keywords: ['dificultad', 'nivel', 'qué nivel', 'difícil', 'fácil', 'projects difficulty'],
            response: "En ProyectPaperK encontrarás proyectos de diferentes niveles de dificultad, desde principiantes hasta avanzados. Puedes filtrar los proyectos según la dificultad que prefieras."
        },
        {
            keywords: ['comentar', 'dejar comentario', 'cómo comentar', 'comment', 'leave comment'],
            response: "Actualmente no contamos con un sistema de comentarios, pero puedes apoyar a los creadores dando 'me gusta' a sus proyectos y compartiéndolos con otros."
        },
        {
            keywords: ['buscar', 'encontrar', 'cómo buscar', 'how to search', 'find projects'],
            response: "Para buscar proyectos, utiliza la barra de búsqueda en la parte superior de la página. Puedes buscar por nombre, dificultad, o tipo de proyecto."
        },
        {
            keywords: ['privacidad', 'seguridad', 'datos personales', 'privacy', 'security', 'personal data'],
            response: "En ProyectPaperK nos tomamos muy en serio la privacidad y seguridad de tus datos. Puedes leer nuestra política de privacidad para más detalles sobre cómo protegemos tu información."
        },
        {
            keywords: ['términos', 'condiciones', 'legal', 'terms', 'conditions', 'legal terms'],
            response: "Puedes encontrar nuestros términos y condiciones en el enlace al pie de página. Es importante leerlos para entender tus derechos y responsabilidades al usar ProyectPaperK."
        },
        {
            keywords: ['eliminar cuenta', 'borrar cuenta', 'delete account', 'remove account'],
            response: "Si deseas eliminar tu cuenta, por favor contáctanos directamente y te ayudaremos con el proceso. Recuerda que esta acción es irreversible."
        },
        {
            keywords: ['reportar', 'denunciar', 'contenido inapropiado', 'report', 'inappropriate content'],
            response: "Si encuentras contenido inapropiado o que viola nuestras normas, por favor repórtalo usando el botón de 'Reportar' en el proyecto o contáctanos directamente. Revisaremos el contenido lo antes posible."
        },
        {
            keywords: ['contacto', 'cómo contactar', 'ayuda', 'soporte', 'support', 'help', 'contact', 'contactar', 'contacto', 'asistencia'],
            response: "Si necesitas ayuda adicional, puedes contactarnos a través de <a href='https://wa.me/+543472468850' target='_blank' class='whatsapp-link'>WhatsApp</a> o en nuestra sección de contacto en el sitio web."
        }
    ];

    function getBotResponse(message) {
        message = message.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;

        for (const item of botResponses) {
            const score = getMatchScore(message, item.keywords);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = item;
            }
        }

        if (bestMatch && highestScore > 0.5) {
            return bestMatch.response;
        }

        return "Lo siento, no entiendo completamente tu pregunta. Prueba reformulando o pregunta sobre cómo funciona ProyectPaperK.";
    }

    function getMatchScore(message, keywords) {
        let maxScore = 0;
        for (const keyword of keywords) {
            const score = similarity(message, keyword);
            if (score > maxScore) {
                maxScore = score;
            }
        }
        return maxScore;
    }

    function similarity(s1, s2) {
        let longer = s1;
        let shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        const longerLength = longer.length;
        if (longerLength === 0) {
            return 1.0;
        }
        return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
    }

    function editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0)
                    costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue),
                                costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    function addMessage(message, isUser = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');
        messageElement.innerHTML = message;
        chatbotMessages.appendChild(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';

            setTimeout(() => {
                const botResponse = getBotResponse(message);
                addMessage(botResponse);
            }, 500);
        }
    }

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    chatBubble.addEventListener('click', () => {
        chatbotContainer.classList.remove('minimized');
        chatBubble.classList.remove('visible');
    });

    minimizeBtn.addEventListener('click', () => {
        chatbotContainer.classList.add('minimized');
        chatBubble.classList.add('visible');
    });

    chatbotHeader.addEventListener('click', (e) => {
        if (e.target !== minimizeBtn) {
            chatbotContainer.classList.toggle('minimized');
            chatBubble.classList.toggle('visible');
        }
    });

    setTimeout(() => {
        addMessage("¡Hola! Soy el asistente virtual de ProyectPaperK. ¿En qué puedo ayudarte hoy?");
    }, 1000);

    setTimeout(() => {
        chatbotContainer.classList.add('minimized');
        chatBubble.classList.add('visible');
    }, 5000);
});

// Top Publishers
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    fetch('https://proyectpaperk-ttty.onrender.com/api/dashboard/stats', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const topPublishers = data.top_publishers;
        if (topPublishers && topPublishers.length > 0) {
            updatePublisherInfo('firstPublisher', topPublishers[0]);
            if (topPublishers.length > 1) {
                updatePublisherInfo('secondPublisher', topPublishers[1]);
            }
            createConfetti();
        }
    })
    .catch(error => console.error('Error fetching top publishers:', error));
});

function updatePublisherInfo(elementId, publisher) {
    const element = document.getElementById(elementId);
    if (element) {
        const emailElement = element.querySelector('.publisher-email');
        const projectsElement = element.querySelector('.publisher-projects');
        if (emailElement) emailElement.textContent = publisher.email;
        if (projectsElement) projectsElement.textContent = `Proyectos: ${publisher.project_count}`;
    }
}

function createConfetti() {
    const confettiContainer = document.querySelector('.confetti-container');
    if (!confettiContainer) return;

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDelay = `${Math.random() * 3}s`;
        confetti.style.backgroundColor = getRandomColor();
        confettiContainer.appendChild(confetti);
    }
}

function getRandomColor() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle")
    const mainNav = document.querySelector(".main-nav")
  
    menuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("active")
    })
  })


  
