document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm').addEventListener('submit', function(event) {
        event.preventDefault();
        registerUser();
    });

    document.getElementById('termsLink').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('popupOverlay').style.display = 'block';
        document.getElementById('termsPopup').style.display = 'block';
    });

    document.getElementById('closePopup').addEventListener('click', function() {
        document.getElementById('popupOverlay').style.display = 'none';
        document.getElementById('termsPopup').style.display = 'none';
    });

    document.getElementById('popupOverlay').addEventListener('click', function() {
        document.getElementById('popupOverlay').style.display = 'none';
        document.getElementById('termsPopup').style.display = 'none';
    });
});

function registerUser() {
    const form = document.getElementById('registerForm');
    const formData = new FormData(form);

    fetch('https://proyectpaperk-production.up.railway.app/usuarios/register', {
        method: 'POST',
        body: JSON.stringify({
            email: formData.get('email'),
            password: formData.get('password'),
            nombre: 'Nombre de Usuario', // Puedes cambiar esto o agregar un campo en el formulario
            descripcion: 'Descripción del Usuario' // Puedes cambiar esto o agregar un campo en el formulario
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Error en el registro');
        }
    })
    .then(data => {
        alert('Registro exitoso!');
        window.location.href = '/plantillas/login.html'; // Redirige al login después del registro
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un problema con el registro.');
    });
}
