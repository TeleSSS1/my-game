let currentUser = localStorage.getItem("currentUser");
let isAdmin = false;
let lastSpinTime = localStorage.getItem("lastSpinTime");
let isLogin = true;

// Закодированный пароль в base64 для "3gh5vd43gyy6"
const ADMIN_PASS_ENCODED = "M2doNXZkNDNneXk2";

// Простая функция декодирования base64
function decodePass(encoded) {
    return atob(encoded);
}

async function showGamesSection() {
    if (!currentUser) {
        alert("Войдите в аккаунт!");
        return;
    }
    try {
        const userRef = window.dbRef(window.database, 'users/' + currentUser);
        const snapshot = await window.dbGet(userRef);
        const userData = snapshot.val();
        if (!userData || !userData.isVerified) {
            alert("Ваш аккаунт не верифицирован! Обратитесь к администратору.");
            return;
        }
        document.getElementById("mainHeader").style.display = "none";
        document.getElementById("gameGrid").style.display = "grid";
        document.getElementById("gameSectionHeader").style.display = "block";
        document.getElementById("adminButton").style.display = "none";
        document.getElementById("balanceTextSecondary").textContent = "Баланс: " + userData.balance;
        document.getElementById("balanceTextSecondary").classList.remove("blurred");
        document.getElementById("pointsTextSecondary").textContent = "Поинты: " + userData.points;
        document.getElementById("pointsTextSecondary").classList.remove("blurred");
    } catch (error) {
        console.error("Ошибка в showGamesSection:", error);
        alert("Ошибка при загрузке игр!");
    }
}

function backToMain() {
    document.getElementById("mainHeader").style.display = "block";
    document.getElementById("gameGrid").style.display = "none";
    document.getElementById("gameSectionHeader").style.display = "none";
    document.getElementById("adminButton").style.display = "block";
}

async function showRoulette() {
    if (!currentUser) {
        alert("Войдите в аккаунт!");
        return;
    }
    try {
        const userRef = window.dbRef(window.database, 'users/' + currentUser);
        const snapshot = await window.dbGet(userRef);
        const userData = snapshot.val();
        if (!userData || !userData.isVerified) {
            alert("Ваш аккаунт не верифицирован! Обратитесь к администратору.");
            return;
        }
        window.location.href = "roulette.html"; // Путь к файлу в корне
    } catch (error) {
        console.error("Ошибка в showRoulette:", error);
        alert("Ошибка при открытии рулетки!");
    }
}

function backToGames() {
    document.getElementById("gameForm").style.display = "none";
    document.getElementById("gameGrid").style.display = "grid";
    document.getElementById("gameSectionHeader").style.display = "block";
}

function closeGame() {
    document.getElementById("gameForm").style.display = "none";
    document.getElementById("adminButton").style.display = "block";
    backToMain();
}

function showAuth() {
    document.getElementById("authForm").style.display = "block";
    document.getElementById("formTitle").textContent = "Вход";
    document.getElementById("authButton").textContent = "Войти в аккаунт";
    document.getElementById("toggleButton").textContent = "Зарегистрироваться";
    document.getElementById("adminButton").style.display = "none";
    isLogin = true;
}

function closeAuth() {
    document.getElementById("authForm").style.display = "none";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("adminButton").style.display = "block";
}

function toggleForm() {
    isLogin = !isLogin;
    document.getElementById("formTitle").textContent = isLogin ? "Вход" : "Регистрация";
    document.getElementById("authButton").textContent = isLogin ? "Войти в аккаунт" : "Зарегистрироваться";
    document.getElementById("toggleButton").textContent = isLogin ? "Зарегистрироваться" : "Войти в аккаунт";
}

function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateUserInfo();
    closeAuth();
    closeProfile();
    closeGame();
    alert("Вы вышли из аккаунта");
}

function handleAccountClick() {
    if (currentUser) {
        showProfile();
    } else {
        showAuth();
    }
}

async function showProfile() {
    try {
        const userRef = window.dbRef(window.database, 'users/' + currentUser);
        const snapshot = await window.dbGet(userRef);
        const userData = snapshot.val() || { balance: 0, points: 0, isVerified: false };
        const spins = Math.floor(userData.balance / 10);

        document.getElementById("profileLogin").textContent = "Логин: " + currentUser;
        document.getElementById("profileBalance").textContent = "Валюта: " + userData.balance;
        document.getElementById("profilePoints").textContent = "Поинты: " + userData.points;
        document.getElementById("profileSpins").textContent = "Прокруты: " + spins;
        document.getElementById("profileVerified").innerHTML = userData.isVerified 
            ? "Верифицирован: <span class='verified-icon'>✔</span>" 
            : "Верифицирован: <span class='unverified-icon'>✖</span>";
        document.getElementById("profileForm").style.display = "block";
        document.getElementById("adminButton").style.display = "none";
        await updateUserInfo();
    } catch (error) {
        console.error("Ошибка в showProfile:", error);
        alert("Ошибка при загрузке профиля!");
    }
}

function closeProfile() {
    document.getElementById("profileForm").style.display = "none";
    document.getElementById("adminButton").style.display = "block";
}

function showAdminLogin() {
    document.getElementById("adminLoginForm").style.display = "block";
    document.getElementById("adminButton").style.display = "none";
}

function closeAdminLogin() {
    document.getElementById("adminLoginForm").style.display = "none";
    document.getElementById("adminUsername").value = "";
    document.getElementById("adminPassword").value = "";
    document.getElementById("adminButton").style.display = "block";
}

function handleAdminLogin() {
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (username === "admin" && password === decodePass(ADMIN_PASS_ENCODED)) {
        isAdmin = true;
        closeAdminLogin();
        showAdminPanel();
    } else {
        alert("Неверный логин или пароль!");
    }
}

async function showAdminPanel() {
    try {
        const usersRef = window.dbRef(window.database, 'users');
        const snapshot = await window.dbGet(usersRef);
        const users = snapshot.val() || {};
        const playerSelect = document.getElementById("playerSelect");
        playerSelect.innerHTML = '<option value="">Выберите игрока</option>';

        Object.keys(users).forEach(username => {
            const option = document.createElement("option");
            option.value = username;
            option.textContent = username;
            playerSelect.appendChild(option);
        });

        document.getElementById("playerBalance").textContent = "Валюта: 0";
        document.getElementById("playerPoints").textContent = "Поинты: 0";
        document.getElementById("playerVerified").innerHTML = "Верифицирован: <span class='unverified-icon'>✖</span>";
        document.getElementById("adminPanel").style.display = "block";
    } catch (error) {
        console.error("Ошибка в showAdminPanel:", error);
        alert("Ошибка при загрузке админ-панели!");
    }
}

function closeAdminPanel() {
    isAdmin = false;
    document.getElementById("adminPanel").style.display = "none";
    document.getElementById("adminButton").style.display = "block";
}

async function updatePlayerInfo() {
    const selectedUser = document.getElementById("playerSelect").value;
    if (selectedUser) {
        try {
            const userRef = window.dbRef(window.database, 'users/' + selectedUser);
            const snapshot = await window.dbGet(userRef);
            const userData = snapshot.val() || { balance: 0, points: 0, isVerified: false };
            document.getElementById("playerBalance").textContent = "Валюта: " + userData.balance;
            document.getElementById("playerPoints").textContent = "Поинты: " + userData.points;
            document.getElementById("playerVerified").innerHTML = userData.isVerified 
                ? "Верифицирован: <span class='verified-icon'>✔</span>" 
                : "Верифицирован: <span class='unverified-icon'>✖</span>";
        } catch (error) {
            console.error("Ошибка в updatePlayerInfo:", error);
        }
    } else {
        document.getElementById("playerBalance").textContent = "Валюта: 0";
        document.getElementById("playerPoints").textContent = "Поинты: 0";
        document.getElementById("playerVerified").innerHTML = "Верифицирован: <span class='unverified-icon'>✖</span>";
    }
}

async function updateBalance() {
    const selectedUser = document.getElementById("playerSelect").value;
    const newBalance = parseInt(document.getElementById("newBalance").value);

    if (!selectedUser) {
        alert("Выберите игрока!");
        return;
    }
    if (isNaN(newBalance) || newBalance < 0) {
        alert("Введите корректное значение валюты!");
        return;
    }

    try {
        const userRef = window.dbRef(window.database, 'users/' + selectedUser);
        await window.dbUpdate(userRef, { balance: newBalance });
        document.getElementById("playerBalance").textContent = "Валюта: " + newBalance;
        document.getElementById("newBalance").value = "";
        if (selectedUser === currentUser) await updateUserInfo();
    } catch (error) {
        console.error("Ошибка в updateBalance:", error);
        alert("Ошибка при обновлении валюты!");
    }
}

async function updatePoints() {
    const selectedUser = document.getElementById("playerSelect").value;
    const newPoints = parseInt(document.getElementById("newPoints").value);

    if (!selectedUser) {
        alert("Выберите игрока!");
        return;
    }
    if (isNaN(newPoints) || newPoints < 0) {
        alert("Введите корректное значение поинтов!");
        return;
    }

    try {
        const userRef = window.dbRef(window.database, 'users/' + selectedUser);
        await window.dbUpdate(userRef, { points: newPoints });
        document.getElementById("playerPoints").textContent = "Поинты: " + newPoints;
        document.getElementById("newPoints").value = "";
        if (selectedUser === currentUser) await updateUserInfo();
    } catch (error) {
        console.error("Ошибка в updatePoints:", error);
        alert("Ошибка при обновлении поинтов!");
    }
}

async function verifyPlayer(verify) {
    const selectedUser = document.getElementById("playerSelect").value;
    if (!selectedUser) {
        alert("Выберите игрока!");
        return;
    }

    try {
        const userRef = window.dbRef(window.database, 'users/' + selectedUser);
        await window.dbUpdate(userRef, { isVerified: verify });
        document.getElementById("playerVerified").innerHTML = verify 
            ? "Верифицирован: <span class='verified-icon'>✔</span>" 
            : "Верифицирован: <span class='unverified-icon'>✖</span>";
        alert(`Верификация для ${selectedUser} ${verify ? "подтверждена" : "отклонена"}!`);
        if (selectedUser === currentUser) await updateUserInfo();
    } catch (error) {
        console.error("Ошибка в verifyPlayer:", error);
        alert("Ошибка при верификации!");
    }
}

async function updateUserInfo() {
    try {
        const avatarElement = document.getElementById("avatar");
        const loginTextElement = document.getElementById("loginText");
        const balanceTextElement = document.getElementById("balanceText");
        const pointsTextElement = document.getElementById("pointsText");
        const accountButtonElement = document.getElementById("accountButton");
        const balanceTextSecondaryElement = document.getElementById("balanceTextSecondary");
        const pointsTextSecondaryElement = document.getElementById("pointsTextSecondary");

        if (currentUser) {
            const userRef = window.dbRef(window.database, 'users/' + currentUser);
            const snapshot = await window.dbGet(userRef);
            const userData = snapshot.val() || { balance: 0, points: 0, isVerified: false };

            if (avatarElement) avatarElement.textContent = "🧑";
            if (loginTextElement) {
                loginTextElement.textContent = "Логин: " + currentUser;
                loginTextElement.classList.remove("blurred");
            }
            if (balanceTextElement) {
                balanceTextElement.textContent = "Баланс: " + userData.balance;
                balanceTextElement.classList.remove("blurred");
            }
            if (pointsTextElement) {
                pointsTextElement.textContent = "Поинты: " + userData.points;
                pointsTextElement.classList.remove("blurred");
            }
            if (accountButtonElement) accountButtonElement.textContent = "Мой аккаунт";
            if (balanceTextSecondaryElement) {
                balanceTextSecondaryElement.textContent = "Баланс: " + userData.balance;
                balanceTextSecondaryElement.classList.remove("blurred");
            }
            if (pointsTextSecondaryElement) {
                pointsTextSecondaryElement.textContent = "Поинты: " + userData.points;
                pointsTextSecondaryElement.classList.remove("blurred");
            }
        } else {
            if (avatarElement) avatarElement.textContent = "🕵️";
            if (loginTextElement) {
                loginTextElement.textContent = "Логин: [закрыто]";
                loginTextElement.classList.add("blurred");
            }
            if (balanceTextElement) {
                balanceTextElement.textContent = "Баланс: [закрыто]";
                balanceTextElement.classList.add("blurred");
            }
            if (pointsTextElement) {
                pointsTextElement.textContent = "Поинты: [закрыто]";
                pointsTextElement.classList.add("blurred");
            }
            if (accountButtonElement) accountButtonElement.textContent = "Вход/Регистрация";
            if (balanceTextSecondaryElement) {
                balanceTextSecondaryElement.textContent = "Баланс: [закрыто]";
                balanceTextSecondaryElement.classList.add("blurred");
            }
            if (pointsTextSecondaryElement) {
                pointsTextSecondaryElement.textContent = "Поинты: [закрыто]";
                pointsTextSecondaryElement.classList.add("blurred");
            }
        }
    } catch (error) {
        console.error("Ошибка в updateUserInfo:", error);
        alert("Ошибка при обновлении информации пользователя!");
    }
}

async function handleAuth() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (!username || !password) {
        alert("Заполните все поля!");
        return;
    }

    try {
        if (isLogin) {
            const userRef = window.dbRef(window.database, 'users/' + username);
            const snapshot = await window.dbGet(userRef);
            const userData = snapshot.val();
            if (userData && userData.password === password) {
                console.log("Вход успешен:", username);
                alert("Вход выполнен: " + username);
                currentUser = username;
                localStorage.setItem("currentUser", currentUser);
                await updateUserInfo();
                closeAuth();
            } else {
                console.log("Вход неуспешный:", username);
                alert("Неверное имя пользователя или пароль!");
            }
        } else {
            const userRef = window.dbRef(window.database, 'users/' + username);
            const snapshot = await window.dbGet(userRef);
            if (snapshot.exists()) {
                console.log("Регистрация неуспешна: пользователь уже существует", username);
                alert("Пользователь уже существует!");
            } else {
                await window.dbSet(userRef, {
                    password: password,
                    balance: 0,
                    points: 0,
                    isVerified: false,
                    lastSpinTime: null
                });
                console.log("Регистрация успешна:", username);
                alert("Регистрация выполнена: " + username);
                currentUser = username;
                localStorage.setItem("currentUser", currentUser);
                await updateUserInfo();
                closeAuth();
            }
        }
    } catch (error) {
        console.error("Ошибка в handleAuth:", error);
        alert("Ошибка при авторизации!");
    }
}

function showShop() {
    alert("Переход к Магазину");
}

document.addEventListener("DOMContentLoaded", updateUserInfo);