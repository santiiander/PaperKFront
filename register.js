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

    // Para el popup de error
    document.getElementById('closeErrorPopup').addEventListener('click', function() {
        document.getElementById('errorPopupOverlay').style.display = 'none';
        document.getElementById('errorPopup').style.display = 'none';
    });

    document.getElementById('errorPopupOverlay').addEventListener('click', function() {
        document.getElementById('errorPopupOverlay').style.display = 'none';
        document.getElementById('errorPopup').style.display = 'none';
    });

    document.getElementById('continueButton').addEventListener('click', function() {
        window.location.href = 'login.html';
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
            nombre: 'Nombre de Usuario',
            descripcion: 'Descripción del Usuario'
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 400) {
            throw new Error('Usuario ya registrado');
        } else {
            throw new Error('Error en el registro');
        }
    })
    .then(data => {
        alert('¡Registro exitoso!');
        window.location.href = 'login.html';
    })
    .catch(error => {
        if (error.message === 'Usuario ya registrado') {
            document.getElementById('errorPopupOverlay').style.display = 'block';
            document.getElementById('errorPopup').style.display = 'block';
        } else {
            console.error('Error:', error);
            alert('Hubo un problema con el registro.');
        }
    });
}
