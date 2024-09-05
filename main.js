let currentPage = 1; // Página actual
const limit = 12; // Número de proyectos por solicitud
let isLoading = false; // Para evitar solicitudes múltiples simultáneas

document.addEventListener('DOMContentLoaded', () => {
    loadProjects(currentPage); // Carga los proyectos de la página inicial
    updateUI(); // Actualiza la UI al cargar la página
    window.addEventListener('scroll', handleScroll); // Añade el listener para el scroll
});

// Función para obtener el token del almacenamiento local
function getToken() {
    const token = localStorage.getItem('access_token');
    console.log('Token:', token); // Añade esto para verificar el token
    return token;
}

// Función para obtener la lista de servidores disponibles
function getAvailableServers() {
    return fetch('https://api.gofile.io/servers', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            return data.data.servers;
        } else {
            throw new Error('Error al obtener servidores');
        }
    })
    .catch(error => console.error(error));
}

// Función para subir archivos a GoFile
function uploadFile(file, serverName) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`https://${serverName}.gofile.io/uploadFile`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'ok') {
            return data.data.downloadPage; // URL de la página de descarga
        } else {
            throw new Error('Error al subir archivo');
        }
    })
    .catch(error => console.error(error));
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
                <img src="${project.imagen}" alt="Imagen del Proyecto" class="project-image">
                <p>${project.descripcion}</p>
                <button class="download-button" onclick="downloadPDF('${project.archivo_pdf}')">Descargar PDF</button>
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

// Función para descargar el archivo PDF
function downloadPDF(pdfPath) {
    fetch(pdfPath, {
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
        return response.blob();
    })
    .then(blob => {
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = pdfPath.split('/').pop(); // Establece el nombre del archivo basado en la ruta
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Elimina el enlace después de hacer clic
        window.URL.revokeObjectURL(url); // Libera el objeto URL
    })
    .catch(error => console.error('Error al descargar el PDF:', error));
}

// Función para crear un nuevo proyecto
function createProject() {
    const form = document.querySelector('#proyectoForm');
    const formData = new FormData(form);

    getAvailableServers()
    .then(servers => {
        const selectedServer = servers[0]; // Selecciona el primer servidor o implementa una lógica para elegir
        const pdfFile = formData.get('archivo_pdf');
        const imageFile = formData.get('imagen');

        return Promise.all([
            uploadFile(pdfFile, selectedServer.name),
            uploadFile(imageFile, selectedServer.name)
        ])
        .then(([pdfLink, imageLink]) => {
            return fetch("https://proyectpaperk-production.up.railway.app/proyectos/proyectos/", {
                method: "POST",
                body: JSON.stringify({
                    nombre: formData.get('nombre'),
                    descripcion: formData.get('descripcion'),
                    archivo_pdf: pdfLink,
                    imagen: imageLink
                }),
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                }
            });
        });
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
        response.json().then(data => {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('username', data.username);
            window.location.href = 'myproy.html'; // Redirige al hub de proyectos
        });
    } else {
        response.json().then(data => {
            alert(data.detail || 'Error al iniciar sesión');
        });
    }
}
