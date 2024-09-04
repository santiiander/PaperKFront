document.addEventListener('DOMContentLoaded', () => {
    const requestResetForm = document.getElementById('requestResetForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const requestResetSection = document.getElementById('request-reset-section');
    const resetPasswordSection = document.getElementById('reset-password-section');
    const pageTitle = document.getElementById('page-title');

    // Manejo del formulario para solicitar el restablecimiento de contraseña
    requestResetForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Evita el envío del formulario tradicional

        const email = document.getElementById('email').value;

        if (!validateEmail(email)) {
            alert('Por favor, ingrese una dirección de correo electrónico válida.');
            return;
        }

        try {
            const response = await fetch(`https://proyectpaperk-production.up.railway.app/usuarios/forgot-password?email=${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.ok) {
                alert('Se ha enviado un enlace de restablecimiento a su correo electrónico.');
                // Cambiar la vista para restablecer la contraseña
                requestResetSection.style.display = 'none';
                resetPasswordSection.style.display = 'block';
                pageTitle.textContent = 'Restablecer Contraseña';
            } else {
                const errorData = await response.text();
                console.error('Error en la respuesta de la red:', errorData);
                alert('Hubo un problema al enviar el enlace de restablecimiento.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un problema al enviar el enlace de restablecimiento.');
        }
    });

    // Manejo del formulario para restablecer la contraseña
    resetPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Evita el envío del formulario tradicional

        const email = document.getElementById('email').value;
        const verification_code = document.getElementById('verification_code').value;
        const new_password = document.getElementById('new_password').value;

        if (!validateEmail(email) || !verification_code || !new_password) {
            alert('Por favor, complete todos los campos.');
            return;
        }

        try {
            const response = await fetch(`https://proyectpaperk-production.up.railway.app/usuarios/reset-password?email=${encodeURIComponent(email)}&verification_code=${encodeURIComponent(verification_code)}&new_password=${encodeURIComponent(new_password)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.ok) {
                alert('La contraseña ha sido restablecida exitosamente.');
                window.location.href = 'login.html'; // Redirige al usuario al login
            } else {
                const errorData = await response.text();
                console.error('Error en la respuesta de la red:', errorData);
                alert('Hubo un problema al restablecer la contraseña.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un problema al restablecer la contraseña.');
        }
    });

    // Función para validar la dirección de correo electrónico
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
});
