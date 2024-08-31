document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita el envío del formulario tradicional

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const loginData = {
        email: email,
        password: password
    };

    console.log('Datos de inicio de sesión:', loginData); // Imprime los datos enviados

    try {
        const response = await fetch('https://proyectpaperk-production.up.railway.app/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('username', email);
                
                window.location.href = 'index.html';
            } else {
                throw new Error('No se recibió un token de acceso');
            }
        } else {
            const errorData = await response.json();
            console.error('Error en la respuesta de la red:', errorData); // Imprime el error recibido del backend
            alert('Error de autenticación. Por favor, verifica tus credenciales.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de autenticación. Por favor, verifica tus credenciales.');
    }
});
