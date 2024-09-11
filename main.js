let currentPage = 1; // Página actual
const limit = 12; // Número de proyectos por solicitud
let isLoading = false; // Para evitar solicitudes múltiples simultáneas

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(reg) {
      console.log('Service Worker registered', reg);
    })
    .catch(function(error) {
      console.log('Service Worker registration failed', error);
    });
  }
  

document.addEventListener('DOMContentLoaded', () => {
    loadProjects(currentPage); // Carga los proyectos de la página inicial
    updateUI(); // Actualiza la UI al cargar la página
    window.addEventListener('scroll', handleScroll); // Añade el listener para el scroll
});

// Función para obtener el token del almacenamiento local
function getToken() {
    console.log("App web V1 Try")
    const token = localStorage.getItem('access_token');
    return token;
}

// Función para cargar los proyectos desde el backend
function loadProjects(page) {
    if (isLoading) return;
    isLoading = true;

    fetch(`https://proyectpaperk-production.up.railway.app/proyectos/proyectos/traer?page=${page}&size=${limit}`, {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(projects => {
        if (projects.length === 0) {
            window.removeEventListener('scroll', handleScroll); // Elimina el listener si no hay más proyectos
            return;
        }

        const container = document.getElementById('projectsContainer');
        projects.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'paper';
            projectDiv.dataset.pdfPath = project.archivo_pdf;

            projectDiv.innerHTML = `
                <h2>${project.nombre}</h2>
                <p><strong>Subido por:</strong> ${project.usuario_nombre}</p> <!-- Mostrar el nombre del usuario -->
                <img src="https://proyectpaperk-production.up.railway.app/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
                <p>${project.descripcion}</p>
                <button id="downloadButton-${project.id}" class="download-button" onclick="downloadPDF('${project.archivo_pdf}', '${project.id}')">Descargar PDF</button>
                <div id="loadingSpinner-${project.id}" class="spinner" style="display: none;"></div>
            `;
            container.appendChild(projectDiv);
        });

        currentPage++; // Incrementa la página para la próxima carga
        isLoading = false;
    })
    .catch(error => {
        console.error('Error al cargar los proyectos:', error);
        isLoading = false;
    });
}
// Función para manejar el scroll y cargar más proyectos
function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
        loadProjects(currentPage); // Carga los proyectos de la siguiente página
    }
}

// Función para descargar un proyecto con spinner
function downloadPDF(pdfPath, projectId) {
    const downloadButton = document.getElementById(`downloadButton-${projectId}`);
    const loadingSpinner = document.getElementById(`loadingSpinner-${projectId}`);

    // Deshabilitar el botón de descarga y mostrar el spinner
    downloadButton.disabled = true;
    downloadButton.textContent = 'Descargando...';
    loadingSpinner.style.display = 'inline-block';

    fetch(`https://proyectpaperk-production.up.railway.app/${pdfPath}`, {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob(); // Convertir la respuesta en un blob para manejar el archivo
    })
    .then(blob => {
        // Crear un enlace temporal para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfPath.split('/').pop(); // Asignar un nombre al archivo
        document.body.appendChild(a);
        a.click(); // Hacer clic en el enlace para descargar
        window.URL.revokeObjectURL(url); // Liberar el objeto URL
        document.body.removeChild(a); // Remover el enlace del DOM
    })
    .catch(error => {
        console.error('Error al descargar el PDF:', error);
        alert('Error al descargar el proyecto. Por favor, intenta de nuevo.');
    })
    .finally(() => {
        // Restaurar el estado del botón
        downloadButton.disabled = false;
        downloadButton.textContent = 'Descargar PDF';
        loadingSpinner.style.display = 'none';
    });
}

// Función para crear un nuevo proyecto
// Función para crear un nuevo proyecto
function createProject() {
    const form = document.querySelector('#proyectoForm');
    const formData = new FormData(form);

    // Cambiar el estado del botón y mostrar el spinner
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
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
            return;
        }
        if (response.ok) {
            alert("Proyecto creado exitosamente");
            closePopup();
            loadProjects(currentPage); // Recargar proyectos para ver el nuevo
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
        // Restaurar el estado del botón
        submitButton.disabled = false;
        submitButton.textContent = 'Publicar Proyecto';
        loadingSpinner.style.display = 'none';
    });
}

// Función para mostrar el popup de creación de proyecto
function openPopup() {
    document.getElementById("popupForm").style.display = "block";
}

// Función para cerrar el popup de creación de proyecto
function closePopup() {
    document.getElementById("popupForm").style.display = "none";
}

// Función para manejar el envío del formulario de creación de proyecto
document.querySelector('#proyectoForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!getToken()) {
        alert("Por favor, inicia sesión para crear un proyecto.");
        return;
    }
    createProject();
});

// Función para actualizar la UI al cargar la página
function updateUI() {
    const usernameElement = document.getElementById('username');
    const logoutButton = document.getElementById('logoutButton');

    function updateUIComponents() {
        const username = getUsername();
        if (username) {
            usernameElement.textContent = username;
            logoutButton.textContent = 'Logout';
            logoutButton.addEventListener('click', function() {
                localStorage.removeItem('username');
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
            });
        } else {
            usernameElement.textContent = 'Usuario no autenticado';
            logoutButton.textContent = 'Login';
            logoutButton.addEventListener('click', function() {
                window.location.href = 'login.html';
            });
        }
    }

    updateUIComponents();
}

// Función para obtener el nombre del usuario del almacenamiento local
function getUsername() {
    return localStorage.getItem('username');
}

// Función para manejar el login del usuario
function handleLoginResponse(response) {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Login failed');
    }
}

// Función para iniciar sesión
function login() {
    const formData = new FormData(document.querySelector('#loginForm'));

    fetch('https://proyectpaperk-production.up.railway.app/auth/login', {
        method: 'POST',
        body: formData
    })
    .then(handleLoginResponse)
    .then(data => {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('username', data.email); // O cualquier otro identificador del usuario
        alert('Login successful!');
        window.location.href = 'index.html'; // Redirige a la página principal
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to login');
    });
}

// Función para rotar la imagen del perfil al hacer scroll
document.addEventListener('scroll', function() {
    const image = document.querySelector('.profile-image');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    image.style.transform = `rotate(${scrollTop / 2}deg)`; // Ajusta la rotación según la velocidad deseada
});

// Control de carrusel
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-item');
const indicators = document.querySelectorAll('.indicator');

function goToSlide(index) {
    const offset = -index * 100;
    document.querySelector('.carousel-inner').style.transform = `translateX(${offset}%)`;
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
    currentSlide = index;
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    goToSlide(currentSlide);
}

// Cambiar la diapositiva automáticamente cada 5 segundos
setInterval(nextSlide, 5000);

// Configurar indicadores para cambiar diapositivas al hacer clic
indicators.forEach((indicator) => {
    indicator.addEventListener('click', () => {
        const index = parseInt(indicator.getAttribute('data-slide'), 10);
        goToSlide(index);
    });
});

// Inicializar el carrusel
goToSlide(currentSlide);
