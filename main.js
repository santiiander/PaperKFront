document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    updateUI(); // Actualiza la UI al cargar la página
});

// Función para obtener el token del almacenamiento local
function getToken() {
    const token = localStorage.getItem('access_token');
    console.log('Token:', token); // Añade esto para verificar el token
    console.log('Versión: V.TokenExpanded')
    return token;
}

// Función para cargar los proyectos desde el backend
function loadProjects() {
    fetch("https://proyectpaperk-production.up.railway.app/proyectos/proyectos/traer", {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
            localStorage.removeItem('access_token');
            window.location.href = '/plantillas/login.html';
            return;
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(projects => {
        const container = document.getElementById('projectsContainer');
        container.innerHTML = ''; // Limpia el contenedor antes de agregar los nuevos proyectos

        if (!Array.isArray(projects)) {
            throw new Error("La respuesta no es un array de proyectos.");
        }

        projects.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'paper';
            projectDiv.dataset.pdfPath = project.archivo_pdf; // Añadido para almacenar la ruta del PDF
            
            projectDiv.innerHTML = `
                <h2>${project.nombre}</h2>
                <img src="https://proyectpaperk-production.up.railway.app/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
                <p>${project.descripcion}</p>
                <button class="download-button" onclick="downloadPDF('${project.archivo_pdf}')"></button>
            `;
            container.appendChild(projectDiv);
        });
    })
    .catch(error => console.error('Error al cargar los proyectos:', error));
}

// Función para descargar el archivo PDF
function downloadPDF(pdfPath) {
    const url = `https://proyectpaperk-production.up.railway.app/${pdfPath}`;
    
    fetch(url, {
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

    fetch("https://proyectpaperk-production.up.railway.app/proyectos/proyectos/", {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": `Bearer ${getToken()}` // No necesitas especificar Content-Type cuando usas FormData
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
            loadProjects(); // Recargar proyectos para ver el nuevo
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
                window.location.href = '/plantillas/login.html';
            });
        } else {
            usernameElement.textContent = 'Usuario no autenticado';
            logoutButton.textContent = 'Login';
            logoutButton.addEventListener('click', function() {
                window.location.href = '/plantillas/login.html';
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
        window.location.href = '/plantillas/index.html'; // Redirige a la página principal
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
