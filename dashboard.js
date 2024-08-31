$(document).ready(function () {
    const token = localStorage.getItem("access_token");

    if (!token) {
        // Redirigir a la página de login si no está autenticado
        window.location.href = "/login.html";
    } else {
        // Obtener el nombre del usuario y mostrarlo
        $.ajax({
            url: "http://localhost:8000/users/me/",
            type: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
            success: function (response) {
                $("#username").text(response.full_name);
            },
            error: function () {
                // Manejar el error si el token es inválido
                window.location.href = "/login.html";
            }
        });
    }

    $("#logoutButton").on("click", function () {
        localStorage.removeItem("access_token");
        window.location.href = "/login.html";
    });
});
