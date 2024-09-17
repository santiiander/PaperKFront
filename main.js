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