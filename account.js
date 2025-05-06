document.getElementById("profileForm").style.display = "block";

function logout() {
    localStorage.removeItem("currentUser");
    alert("Вы вышли из аккаунта");
    window.location.href = "../index.html";
}

function updateProfileInfo() {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
        alert("Войдите в аккаунт!");
        window.location.href = "../index.html";
        return;
    }

    const users = JSON.parse(localStorage.getItem("users"));
    const userData = users[currentUser];
    const spins = Math.floor(userData.balance / 10);

    document.getElementById("profileLogin").textContent = "Логин: " + currentUser;
    document.getElementById("profileBalance").textContent = "Валюта: " + userData.balance;
    document.getElementById("profilePoints").textContent = "Поинты: " + userData.points;
    document.getElementById("profileSpins").textContent = "Прокруты: " + spins;
    document.getElementById("profileVerified").innerHTML = userData.isVerified 
        ? "Верифицирован: <span class='verified-icon'>✔</span>" 
        : "Верифицирован: <span class='unverified-icon'>✖</span>";
}

updateProfileInfo();