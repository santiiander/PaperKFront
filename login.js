// Importar funciones de Firebase
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-analytics.js';

// Obtener la configuración de Firebase desde el backend
fetch('http://127.0.0.1:8000/firebase-config')
    .then(response => response.json())
    .then(firebaseConfig => {
        // Corregir la clave privada si es necesario
        if (firebaseConfig.private_key) {
            firebaseConfig.private_key = firebaseConfig.private_key.replace('\\n', '\n');
        }

        // Configuración de Firebase
        const firebaseSettings = {
            apiKey: firebaseConfig.apiKey,
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
            messagingSenderId: firebaseConfig.messagingSenderId,
            appId: firebaseConfig.appId,
            measurementId: firebaseConfig.measurementId
        };

        // Inicializar Firebase
        const app = initializeApp(firebaseSettings);
        const auth = getAuth(app);
        const analytics = getAnalytics(app);

        // Manejo del formulario de login tradicional
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
                const response = await fetch('http://127.0.0.1:8000/usuarios/login', {
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
                    console.error('Error en la respuesta de la red:', errorData);
                    alert('Error de autenticación. Por favor, verifica tus credenciales.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de autenticación. Por favor, verifica tus credenciales.');
            }
        });

        // Manejo del botón "Login with Google"
        document.getElementById('googleLogin').addEventListener('click', function() {
            const provider = new GoogleAuthProvider();

            signInWithPopup(auth, provider)
                .then(async (result) => {
                    const idToken = await result.user.getIdToken();

                    const response = await fetch('http://127.0.0.1:8000/usuarios/login-google', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded' // Cambio a x-www-form-urlencoded
                        },
                        body: new URLSearchParams({ id_token: idToken }) // Uso de URLSearchParams para campos de formulario
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('access_token', data.access_token);
                        window.location.href = 'index.html';
                    } else {
                        const errorData = await response.json();
                        console.error('Error en la respuesta de la red:', errorData);
                        alert('Error de autenticación con Google');
                    }
                })
                .catch((error) => {
                    console.error('Error al iniciar sesión con Google:', error);
                    alert('Error al iniciar sesión con Google.');
                });
        });
    })
    .catch(error => {
        console.error('Error fetching Firebase config:', error);
    });
