document.addEventListener('DOMContentLoaded', () => {
    loadUserProjects();
    updateUserUI(); // Actualiza la UI al cargar la página

    // Asignar el evento al botón de confirmación en el popup
    document.getElementById('confirmDeleteButton').addEventListener('click', () => {
        const projectId = document.getElementById('deletePopup').dataset.projectId;
        if (projectId) {
            deleteProject(projectId);
        }
    });

    // Asignar el evento al botón de cierre del popup
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            closePopup('deletePopup');
        });
    });
});

// Función para obtener el token del almacenamiento local
function getToken() {
    return localStorage.getItem('access_token');
}

// Función para cargar los proyectos del usuario desde el backend
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
        container.innerHTML = ''; // Limpia el contenedor antes de agregar los nuevos proyectos

        if (!Array.isArray(projects)) {
            throw new Error("La respuesta no es un array de proyectos.");
        }

        projects.forEach(project => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'project-item';
            projectDiv.dataset.projectId = project.id; // Guardar el ID del proyecto en un atributo

            projectDiv.innerHTML = `
                <h2>${project.nombre}</h2>
                <img src="https://proyectpaperk-production.up.railway.app/${project.imagen}" alt="Imagen del Proyecto" class="project-image">
                <p>${project.descripcion}</p>
                <img src="/sapiens/delete.png" alt="Eliminar" class="delete-button" onclick="showDeletePopup(${project.id})">
            `;
            container.appendChild(projectDiv);
        });
    })
    .catch(error => console.error('Error al cargar los proyectos:', error));
}

// Función para mostrar el popup de confirmación de eliminación
function showDeletePopup(projectId) {
    const popup = document.getElementById('deletePopup');
    popup.dataset.projectId = projectId; // Guardar el ID del proyecto en un atributo del popup
    popup.style.display = 'flex'; // Mostrar el popup
}

// Función para cerrar el popup
function closePopup(popupId) {
    document.getElementById(popupId).style.display = 'none'; // Ocultar el popup
}

// Función para eliminar un proyecto
function deleteProject(projectId) {
    fetch(`https://proyectpaperk-production.up.railway.app/proyectos/proyectos/${projectId}`, {
        method: 'DELETE',
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
    .then(result => {
        alert('Proyecto eliminado con éxito.');
        loadUserProjects(); // Recargar la lista de proyectos después de la eliminación
        closePopup('deletePopup'); // Ocultar el popup después de eliminar
    })
    .catch(error => console.error('Error al eliminar el proyecto:', error));
}

// Función para actualizar la UI del usuario (eliminada la lógica de logout)
function updateUserUI() {
    const emailElement = document.getElementById('userEmail');
    const userEmail = getUserEmail();
    emailElement.textContent = userEmail ? userEmail : 'Usuario no autenticado';
}

// Función para obtener el correo electrónico del usuario del almacenamiento local
function getUserEmail() {
    return localStorage.getItem('username');
}
