let currentPage = 1;
const limit = 12;
let isLoading = false;
let isAdult = false;
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
    
    // Verificar si la animación ya se ha mostrado en esta sesión
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
                // Marcar la animación como mostrada para esta sesión
                sessionStorage.setItem('animationShown', 'true');
            }, 500);
        }
    }

    simulateLoading();
});

// Función de cierre de sesión actualizada
function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    // Limpiar el sessionStorage para que la animación se muestre en el próximo inicio de sesión
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Asegúrate de que esta función esté vinculada al botón de cierre de sesión
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
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
});
//Test porque no anda y no se que pasa xd 

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
    
    // Recargar la página después de cambiar el estado
    window.location.reload();
}

function loadProjects(page) {
    if (isLoading) return;
    isLoading = true;

    const url = isAdult
        ? `https://proyectpaperk-production.up.railway.app/proyectos/proyectos/sensibles?page=${page}&size=${limit}`
        : `https://proyectpaperk-production.up.railway.app/proyectos/proyectos/traer?page=${page}&size=${limit}`;

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
        if (projects.length === 0) {
            window.removeEventListener('scroll', handleScroll);
            return;
        }

        const container = document.getElementById('projectsContainer');
        if (page === 1) {
            container.innerHTML = '';
        }
        
        projects.forEach(project => {
            if ((isAdult && project.contenido_sensible) || (!isAdult && !project.contenido_sensible)) {
                const projectDiv = document.createElement('div');
                projectDiv.className = 'paper';
                projectDiv.innerHTML = `
                    <h2>${project.nombre}</h2>
                    <p><strong>Subido por:</strong> ${project.usuario_nombre}</p>
                    <img src="https://proyectpaperk-production.up.railway.app/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
                    <p>${project.descripcion}</p>
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

        currentPage++;
        isLoading = false;
    })
    .catch(error => {
        console.error('Error al cargar los proyectos:', error);
        isLoading = false;
    });
}

function loadFeaturedProjects() {
    console.log('Loading featured projects...');
    fetch('https://proyectpaperk-production.up.railway.app/proyectos/proyectos/destacados', {
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
        }
        if (data.latest) {
            displayFeaturedProject(data.latest, 'latestProject', 'Proyecto más reciente');
        } else {
            console.log('No latest project found');
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
        <img src="https://proyectpaperk-production.up.railway.app/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
        <p>${project.descripcion}</p>
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
    fetch(`https://proyectpaperk-production.up.railway.app/proyectos/proyectos/${projectId}/like`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const likeButton = document.querySelector(`button[onclick="toggleLike('${projectId}')"]`);
        const likesCountSpan = likeButton.querySelector('.likes-count');
        likesCountSpan.textContent = data.likes_count;
        likeButton.classList.toggle('liked', data.liked);
    })
    .catch(error => console.error('Error toggling like:', error));
}
function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
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

    fetch(`https://proyectpaperk-production.up.railway.app/proyectos/proyectos/${projectId}`, {
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

        return fetch(`https://proyectpaperk-production.up.railway.app/${pdfPath}`, {
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

    fetch("https://proyectpaperk-production.up.railway.app/proyectos/proyectos/", {
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
            alert("Proyecto creado exitosamente");
            closePopup();
            currentPage = 1;
            document.getElementById('projectsContainer').innerHTML = '';
            loadProjects(currentPage);
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
    document.getElementById("popupForm").style.display = "block";
}

function closePopup() {
    document.getElementById("popupForm").style.display = "none";
}

function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
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

const profileImage = document.querySelector('.profile-image');
window.addEventListener('scroll', function () {
    const rotation = window.scrollY / 5;
    profileImage.style.transform = `rotate(${rotation}deg)`;
});

document.querySelector('#proyectoForm').addEventListener('submit', event => {
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
            <img src="https://proyectpaperk-production.up.railway.app/${imagen}" alt="Imagen del Proyecto" class="modal-project-image">
            <div class="modal-project-info">
                <h2 class="modal-project-title">${nombre}</h2>
                <p class="modal-project-author"><strong>Subido por:</strong> ${usuario_nombre}</p>
                <p class="modal-project-description">${descripcion}</p>
                <button class="modal-download-btn" onclick="downloadPDF('${archivo_pdf}', '${id}')">Descargar PDF</button>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

window.onclick = function(event) {
    const modal = document.getElementById('projectModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

document.querySelector('.close').onclick = function() {
    document.getElementById('projectModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const userInput = document.getElementById('user-input');
    const chatBubble = document.getElementById('chat-bubble');
    const minimizeBtn = document.getElementById('minimize-btn');
    const chatbotHeader = document.getElementById('chatbot-header');

    // Respuestas del bot mejoradas
    const botResponses = [
        // Saludos
        {
            keywords: ['hola', 'buenas', 'saludos', 'hey', 'ola', 'que tal', 'qué tal', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'bienvenido', 'welcome'],
            response: "¡Hola! Bienvenido a ProyectPaperK. ¿En qué puedo ayudarte hoy?"
        },
        // Descripción de ProyectPaperK
        {
            keywords: ['que es', 'qué es', 'proyectpaperk', 'plataforma', 'sitio', 'web', 'página', 'acerca de', 'about', 'información', 'info', 'tell me about', 'cuéntame sobre', 'explícame', 'explicame'],
            response: "ProyectPaperK es una plataforma donde los amantes del origami pueden subir y compartir sus proyectos en formato PDF junto con una imagen representativa."
        },
        // Cómo funciona
        {
            keywords: ['cómo funciona', 'como funciona', 'uso', 'guía', 'instrucciones', 'pasos', 'how to', 'cómo puedo', 'como puedo'],
            response: "Puedes explorar proyectos de origami, subir tus propios proyectos, descargar PDFs de proyectos que te interesen, y dar 'me gusta' a los proyectos que más te gusten."
        },
        // Cómo subir un proyecto
        {
            keywords: ['subir', 'cargar', 'publicar', 'compartir', 'nuevo proyecto', 'añadir', 'upload', 'post', 'share'],
            response: "Para subir un proyecto, inicia sesión, haz clic en 'Publicar' en la barra de navegación, y sigue las instrucciones para subir tu PDF e imagen representativa."
        },
        // Descargar proyectos
        {
            keywords: ['descargar', 'obtener pdf', 'download', 'get pdf'],
            response: "Para descargar un proyecto, haz clic en el botón 'Descargar PDF' en la tarjeta del proyecto. ¡Es fácil y gratuito!"
        },
        // Iniciar sesión
        {
            keywords: ['login', 'iniciar sesión', 'acceder', 'entrar', 'sign in'],
            response: "Haz clic en 'Iniciar sesión' en la parte superior para ingresar. Si no tienes cuenta, regístrate primero."
        },
        // Registrarse
        {
            keywords: ['registrarse', 'crear cuenta', 'unirse', 'sign up', 'register'],
            response: "Para registrarte, haz clic en 'Registrarse' en la parte superior, y sigue las instrucciones para crear una cuenta. ¡Es gratis y rápido!"
        },
        // Precio
        {
            keywords: ['precio', 'costo', 'tarifa', 'pagar', 'cost', 'price'],
            response: "Todo en ProyectPaperK es completamente gratuito. ¡Disfruta explorando y compartiendo tus proyectos!"
        },
        // Persona de contacto
        {
            keywords: ['persona', 'humano', 'representante', 'alguien', 'contacto', 'hablar con alguien', 'chat', 'person', 'human', 'representative', 'contact', 'talk to someone'],
            response: "Entiendo que a veces prefieras hablar con una persona. Aunque soy un asistente virtual, puedo ayudarte con la mayoría de las preguntas. Sin embargo, si necesitas hablar con alguien del equipo, puedes contactarnos a través de <a href='https://wa.me/+543472468850' target='_blank' class='whatsapp-link'>WhatsApp</a>. Estaremos encantados de ayudarte personalmente."
        },
        // Problemas de acceso
        {
            keywords: ['no puedo entrar', 'no funciona login', 'problema acceso', 'login error', 'error iniciar sesión', 'login not working'],
            response: "Si tienes problemas para iniciar sesión, intenta restablecer tu contraseña haciendo clic en '¿Olvidaste tu contraseña?' en la página de inicio de sesión. Si el problema persiste, contacta con nosotros para recibir ayuda."
        },
        // Recuperar contraseña
        {
            keywords: ['olvidé contraseña', 'recuperar contraseña', 'restablecer contraseña', 'forgot password', 'reset password'],
            response: "Para restablecer tu contraseña, haz clic en '¿Olvidaste tu contraseña?' en la página de inicio de sesión y sigue las instrucciones."
        },
        // Funcionalidades
        {
            keywords: ['qué puedo hacer', 'funciones', 'qué puedo hacer aquí', 'qué ofrece', 'características', 'features'],
            response: "En ProyectPaperK puedes explorar proyectos de origami, subir los tuyos propios, descargar proyectos en PDF, y dar 'me gusta' a los proyectos que más te gusten. También puedes personalizar tu perfil y ver estadísticas de tus proyectos."
        },
        // Cómo dar "Me gusta"
        {
            keywords: ['me gusta', 'like', 'dar me gusta', 'cómo dar me gusta', 'like a project'],
            response: "Para dar 'me gusta' a un proyecto, simplemente haz clic en el icono de corazón en la tarjeta del proyecto. ¡Es una manera genial de apoyar a otros creadores!"
        },
        // Estadísticas de proyectos
        {
            keywords: ['estadísticas', 'stats', 'cómo ver estadísticas', 'ver estadísticas de mis proyectos', 'project stats'],
            response: "Puedes ver las estadísticas de tus proyectos desde la sección 'Mis proyectos' en tu perfil. Te mostrará cuántas veces ha sido descargado y cuántos 'me gusta' ha recibido."
        },
        // Acerca de origami
        {
            keywords: ['qué es origami', 'origami', 'sobre origami', 'acerca de origami', 'información origami'],
            response: "El origami es el arte japonés de doblar papel para crear figuras o formas. En ProyectPaperK, puedes explorar y compartir proyectos que muestran la belleza y creatividad del origami."
        },
        // Materiales para origami
        {
            keywords: ['materiales', 'qué necesito', 'materiales origami', 'qué papel usar', 'tipo de papel', 'materials for origami'],
            response: "Para hacer origami, lo principal es usar papel. Puedes usar papel normal o papel especial para origami, que es más delgado y fácil de doblar. ¡No necesitas mucho más, solo tus manos y creatividad!"
        },
        // Dificultad de los proyectos
        {
            keywords: ['dificultad', 'nivel', 'qué nivel', 'difícil', 'fácil', 'projects difficulty'],
            response: "En ProyectPaperK encontrarás proyectos de diferentes niveles de dificultad, desde principiantes hasta avanzados. Puedes filtrar los proyectos según la dificultad que prefieras."
        },
        // Cómo comentar proyectos
        {
            keywords: ['comentar', 'dejar comentario', 'cómo comentar', 'comment', 'leave comment'],
            response: "Actualmente no contamos con un sistema de comentarios, pero puedes apoyar a los creadores dando 'me gusta' a sus proyectos y compartiéndolos con otros."
        },
        // Cómo buscar proyectos
        {
            keywords: ['buscar', 'encontrar', 'cómo buscar', 'how to search', 'find projects'],
            response: "Para buscar proyectos, utiliza la barra de búsqueda en la parte superior de la página. Puedes buscar por nombre, dificultad, o tipo de proyecto."
        },
        // Privacidad y seguridad
        {
            keywords: ['privacidad', 'seguridad', 'datos personales', 'privacy', 'security', 'personal data'],
            response: "En ProyectPaperK nos tomamos muy en serio la privacidad y seguridad de tus datos. Puedes leer nuestra política de privacidad para más detalles sobre cómo protegemos tu información."
        },
        // Términos y condiciones
        {
            keywords: ['términos', 'condiciones', 'legal', 'terms', 'conditions', 'legal terms'],
            response: "Puedes revisar nuestros términos y condiciones haciendo clic en el enlace correspondiente en el pie de página del sitio."
        },
        // Proyectos populares
        {
            keywords: ['proyectos populares', 'más populares', 'top projects', 'trending projects'],
            response: "Para ver los proyectos más populares, visita la sección 'Proyectos populares' en la página principal. Allí verás los proyectos más descargados y con más 'me gusta'."
        },
        // Contacto
        {
            keywords: ['contacto', 'cómo contactar', 'ayuda', 'soporte', 'support', 'help', 'contact','persona','contactar','contacto','asistencia'],
            response: "Si necesitas ayuda, puedes contactarnos a través de <a href='https://wa.me/+543472468850' target='_blank' class='whatsapp-link'>WhatsApp</a> o en nuestra sección de contacto en el sitio web."
        },
        // Test Versionado 
        {
            keywords:["VersionTest"],
            response: "Version BOT V3"
        }
    ];
    

    // Función para minimizar y maximizar el chatbot
    function minimizeChat() {
        chatbotContainer.classList.add('minimized');
        setTimeout(() => {
            chatBubble.classList.add('visible');
        }, 300);
    }

    function maximizeChat() {
        chatBubble.classList.remove('visible');
        setTimeout(() => {
            chatbotContainer.classList.remove('minimized');
        }, 300);
    }

    // Eventos de minimización/maximización
    minimizeBtn.addEventListener('click', minimizeChat);
    chatBubble.addEventListener('click', maximizeChat);
    chatbotHeader.addEventListener('click', function(e) {
        if (e.target !== minimizeBtn) {
            minimizeChat();
        }
    });

    // Función para enviar el mensaje del usuario
    window.sendMessage = function() {
        const message = userInput.value.trim().toLowerCase();
        if (message) {
            addMessage(message, 'user-message');
            userInput.value = '';

            setTimeout(() => {
                const response = getBotResponse(message);
                addMessage(response, 'bot-message');
            }, 500);
        }
    }

    // Función para añadir mensajes al chat
    function addMessage(message, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);
        if (className === 'bot-message') {
            messageElement.innerHTML = message;
        } else {
            messageElement.textContent = message;
        }
        chatbotMessages.appendChild(messageElement);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Función para obtener la respuesta del bot
    function getBotResponse(message) {
        let bestMatch = null;
        let highestScore = 0;

        for (const item of botResponses) {
            const score = getMatchScore(message, item.keywords);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = item;
            }
        }

        // Si se encuentra una buena coincidencia
        if (bestMatch && highestScore > 0.5) {
            return bestMatch.response;
        }

        // Si no se encuentra una coincidencia
        return "Lo siento, no entiendo completamente tu pregunta. Prueba reformulando o pregunta sobre cómo funciona ProyectPaperK.";
    }

    // Función para calcular el puntaje de coincidencia entre el mensaje del usuario y las palabras clave
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

    // Función para calcular la similitud entre dos cadenas
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

    // Función para calcular la distancia de edición (Levenshtein distance)
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

    // Enviar mensaje al presionar Enter
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Mensaje de bienvenida y minimización automática
    setTimeout(() => {
        addMessage("¡Hola! Soy el asistente virtual de ProyectPaperK. ¿En qué puedo ayudarte hoy?", 'bot-message');
    }, 1000);

    setTimeout(minimizeChat, 5000);
});



function openPopup() {
    document.getElementById('popupForm').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popupForm').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('ageVerificationToggle');
    
    toggle.addEventListener('change', function() {
        if (this.checked) {
            console.log('Contenido explícito activado');
            // Add your logic for when explicit content is enabled
        } else {
            console.log('Contenido explícito desactivado');
            // Add your logic for when explicit content is disabled
        }
    });
});