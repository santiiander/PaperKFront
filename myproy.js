document.addEventListener('DOMContentLoaded', () => {
    loadUserProjects();
    updateUserUI();

    document.getElementById('confirmDeleteButton').addEventListener('click', () => {
        const projectId = document.getElementById('deletePopup').dataset.projectId;
        if (projectId) {
            deleteProject(projectId);
        }
    });

    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            closePopup('deletePopup');
        });
    });
});

function getToken() {
    return localStorage.getItem('access_token');
}

function loadUserProjects() {
    fetch("https://proyectpaperk-production.up.railway.app/proyectos/proyectos/mi-proyecto", {
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
    .then(projects => {
        const container = document.getElementById('userProjectsContainer');
        container.innerHTML = '';

        if (!Array.isArray(projects)) {
            throw new Error("La respuesta no es un array de proyectos.");
        }

        projects.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'project-item';
            projectDiv.dataset.projectId = project.id;

            projectDiv.innerHTML = `
                <h2>${project.nombre}</h2>
                <img src="https://proyectpaperk-production.up.railway.app/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
                <p>${project.descripcion}</p>
                <button class="delete-button" onclick="showDeletePopup(${project.id})">
                    <img src="delete.png" alt="Eliminar">
                </button>
            `;
            container.appendChild(projectDiv);
        });
    })
    .catch(error => {
        console.error('Error al cargar los proyectos:', error);
        alert('Error al cargar los proyectos. Por favor, intenta de nuevo más tarde.');
    });
}

function showDeletePopup(projectId) {
    const popup = document.getElementById('deletePopup');
    popup.dataset.projectId = projectId;
    popup.style.display = 'flex';
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none';
}

function deleteProject(projectId) {
    fetch(`https://proyectpaperk-production.up.railway.app/proyectos/proyectos/${projectId}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('No autorizado. Por favor, inicia sesión de nuevo.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        alert('Proyecto eliminado con éxito.');
        loadUserProjects();
        closePopup('deletePopup');
    })
    .catch(error => {
        console.error('Error al eliminar el proyecto:', error);
        alert(`Error al eliminar el proyecto: ${error.message}`);
    });
}

function updateUserUI() {
    const emailElement = document.getElementById('userEmails');
    const userEmail = getUserEmail();
    emailElement.textContent = userEmail ? userEmail : 'Usuario no autenticado';
}

function getUserEmail() {
    return localStorage.getItem('username');
}