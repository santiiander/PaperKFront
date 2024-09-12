let currentPage = 1; // Página actual
const limit = 12; // Número de proyectos por solicitud
let isLoading = false; // Para evitar solicitudes múltiples simultáneas

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
    // Muestra tu botón de "Instalar"
    const installButton = document.getElementById('installButton');
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
});

document.addEventListener('DOMContentLoaded', () => {
    loadProjects(currentPage); // Carga los proyectos de la página inicial
    updateUI(); // Actualiza la UI al cargar la página
    window.addEventListener('scroll', handleScroll); // Añade el listener para el scroll

    // Añade el evento al botón de logout
    document.getElementById('logoutButton').addEventListener('click', () => {
        handleLogout();
    });

    console.log(getUsername()); // Depuración: Muestra el nombre de usuario almacenado
});

// Función para obtener el token del almacenamiento local
function getToken() {
    return localStorage.getItem('access_token');
}

// Función para obtener el nombre del usuario del almacenamiento local
function getUsername() {
    return localStorage.getItem('username');
}

// Función para cargar los proyectos desde el backend
function loadProjects(page) {
    if (isLoading) return;
    isLoading = true;

    fetch(`https://proyectpaperk-production.up.railway.app/proyectos/proyectos/traer?page=${page}&size=${limit}`, {
        headers: {
            "Authorization": `Bearer ${getToken()}` // Incluye el token en el encabezado
        }
    })
    .then(response => {
        if (response.status === 401) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            localStorage.removeItem('access_token');
            localStorage.removeItem('username');
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
            "Authorization": `Bearer ${getToken()}` // Incluye el token en el encabezado
        }
    })
    .then(response => {
        if (response.status === 401) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            localStorage.removeItem('access_token');
            localStorage.removeItem('username');
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
            "Authorization": `Bearer ${getToken()}` // Incluye el token en el encabezado
        }
    })
    .then(response => {
        if (response.status === 401) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            localStorage.removeItem('access_token');
            localStorage.removeItem('username');
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

// Función de logout
function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Mostrar el nombre del usuario en la UI
function updateUI() {
    const usernameElement = document.getElementById('usernameDisplay');
    if (usernameElement) {
        usernameElement.textContent = `Bienvenido, ${getUsername()}`; // Muestra el nombre de usuario
    }
}
