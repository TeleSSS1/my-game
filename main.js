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
        const snapshot = await window.database.ref('users/' + currentUser).once('value');
        const userData = snapshot.val();
        if (!userData || !userData.isVerified) {
            alert("Ваш аккаунт не верифицирован! Обратитесь к администратору.");
            return;
        }
        document.getElementById("mainHeader").style.display = "none";
        document.getElementById("gameGrid").style.display = "grid";
        document.getElementById("gameSectionHeader").style.display = "block";
        document.getElementById("adminButton").style.display = "none";
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
        const snapshot = await window.database.ref('users/' + currentUser).once('value');
        const userData = snapshot.val();
        if (!userData || !userData.isVerified) {
            alert("Ваш аккаунт не верифицирован! Обратитесь к администратору.");
            return;
        }
        window.location.href = "games/roulette.html";
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

function checkSpinCooldown() {
    try {
        const cooldownText = document.getElementById("cooldownText");
        const bonusSpinBtn = document.getElementById("bonusSpinBtn");
        const mainSpinBtn = document.getElementById("mainSpinBtn");
        if (!cooldownText || !bonusSpinBtn || !mainSpinBtn) return;

        if (lastSpinTime) {
            const now = new Date().getTime();
            const timeDiff = (now - lastSpinTime) / (1000 * 60 * 60);
            if (timeDiff < 6) {
                const remaining = 6 - Math.floor(timeDiff);
                cooldownText.textContent = `Следующая прокрутка доступна через: ${remaining} часов`;
                bonusSpinBtn.disabled = true;
                mainSpinBtn.disabled = true;
            } else {
                cooldownText.textContent = "Следующая прокрутка доступна через: -";
                bonusSpinBtn.disabled = false;
            }
        } else {
            cooldownText.textContent = "Следующая прокрутка доступна через: -";
            bonusSpinBtn.disabled = false;
        }
    } catch (error) {
        console.error("Ошибка в checkSpinCooldown:", error);
    }
}

function spinBonus() {
    try {
        const bonusValues = [1, 2, 3, 4, 5];
        const bonus = bonusValues[Math.floor(Math.random() * bonusValues.length)];
        document.getElementById("bonusResult").textContent = `Бонус: ${bonus}x`;
        document.getElementById("mainSpinBtn").disabled = false;
    } catch (error) {
        console.error("Ошибка в spinBonus:", error);
    }
}

async function spinMain() {
    try {
        const mainValues = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
        let result = mainValues[Math.floor(Math.random() * mainValues.length)];
        let emoji = "";
        if (result === 50) emoji = " 🐒";
        else if (result === 100) emoji = " 🐘";
        else if (result === 200) emoji = " 💵";
        document.getElementById("spinResult").textContent = `Выигрыш: ${result}${emoji}`;
        const bonus = parseInt(document.getElementById("bonusResult").textContent.replace("Бонус: ", "").replace("x", ""));
        const totalWin = result * bonus;

        const snapshot = await window.database.ref('users/' + currentUser).once('value');
        const userData = snapshot.val() || { balance: 0, points: 0, isVerified: false };
        const newBalance = userData.balance + totalWin;
        await window.database.ref('users/' + currentUser).update({ balance: newBalance });

        updateUserInfo();
        lastSpinTime = new Date().getTime();
        localStorage.setItem("lastSpinTime", lastSpinTime);
        document.getElementById("bonusSpinBtn").disabled = true;
        document.getElementById("mainSpinBtn").disabled = true;
        checkSpinCooldown();
    } catch (error) {
        console.error("Ошибка в spinMain:", error);
        alert("Ошибка при прокрутке!");
    }
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
        const snapshot = await window.database.ref('users/' + currentUser).once('value');
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
        const snapshot = await window.database.ref('users').once('value');
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
        document.getElementById("newBalance").value = "";
        document.getElementById("newPoints").value = "";
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
            const snapshot = await window.database.ref('users/' + selectedUser).once('value');
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
        await window.database.ref('users/' + selectedUser).update({ balance: newBalance });
        document.getElementById("playerBalance").textContent = "Валюта: " + newBalance;
        document.getElementById("newBalance").value = "";
        if (selectedUser === currentUser) updateUserInfo();
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
        await window.database.ref('users/' + selectedUser).update({ points: newPoints });
        document.getElementById("playerPoints").textContent = "Поинты: " + newPoints;
        document.getElementById("newPoints").value = "";
        if (selectedUser === currentUser) updateUserInfo();
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
        await window.database.ref('users/' + selectedUser).update({ isVerified: verify });
        document.getElementById("playerVerified").innerHTML = verify 
            ? "Верифицирован: <span class='verified-icon'>✔</span>" 
            : "Верифицирован: <span class='unverified-icon'>✖</span>";
        alert(`Верификация для ${selectedUser} ${verify ? "подтверждена" : "отклонена"}!`);
    } catch (error) {
        console.error("Ошибка в verifyPlayer:", error);
        alert("Ошибка при верификации!");
    }
}

async function updateUserInfo() {
    try {
        if (currentUser) {
            const snapshot = await window.database.ref('users/' + currentUser).once('value');
            const userData = snapshot.val() || { balance: 0, points: 0, isVerified: false };
            document.getElementById("avatar").textContent = "🧑";
            document.getElementById("loginText").textContent = "Логин: " + currentUser;
            document.getElementById("loginText").classList.remove("blurred");
            document.getElementById("balanceText").textContent = "Баланс: " + userData.balance;
            document.getElementById("balanceText").classList.remove("blurred");
            document.getElementById("pointsText").textContent = "Поинты: " + userData.points;
            document.getElementById("pointsText").classList.remove("blurred");
            document.getElementById("accountButton").textContent = "Мой аккаунт";
            document.getElementById("balanceTextSecondary").textContent = "Баланс: " + userData.balance;
            document.getElementById("balanceTextSecondary").classList.remove("blurred");
            document.getElementById("pointsTextSecondary").textContent = "Поинты: " + userData.points;
            document.getElementById("pointsTextSecondary").classList.remove("blurred");
        } else {
            document.getElementById("avatar").textContent = "🕵️";
            document.getElementById("loginText").textContent = "Логин: [закрыто]";
            document.getElementById("loginText").classList.add("blurred");
            document.getElementById("balanceText").textContent = "Баланс: [закрыто]";
            document.getElementById("balanceText").classList.add("blurred");
            document.getElementById("pointsText").textContent = "Поинты: [закрыто]";
            document.getElementById("pointsText").classList.add("blurred");
            document.getElementById("accountButton").textContent = "Вход/Регистрация";
            document.getElementById("balanceTextSecondary").textContent = "Баланс: [закрыто]";
            document.getElementById("balanceTextSecondary").classList.add("blurred");
            document.getElementById("pointsTextSecondary").textContent = "Поинты: [закрыто]";
            document.getElementById("pointsTextSecondary").classList.add("blurred");
        }
    } catch (error) {
        console.error("Ошибка в updateUserInfo:", error);
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
            const snapshot = await window.database.ref('users/' + username).once('value');
            const userData = snapshot.val();
            if (userData && userData.password === password) {
                console.log("Вход успешен:", username);
                alert("Вход выполнен: " + username);
                currentUser = username;
                localStorage.setItem("currentUser", currentUser);
                updateUserInfo();
                closeAuth();
            } else {
                console.log("Вход неуспешен:", username);
                alert("Неверное имя пользователя или пароль!");
            }
        } else {
            const snapshot = await window.database.ref('users/' + username).once('value');
            if (snapshot.exists()) {
                console.log("Регистрация неуспешна: пользователь уже существует", username);
                alert("Пользователь уже существует!");
            } else {
                await window.database.ref('users/' + username).set({
                    password: password,
                    balance: 0,
                    points: 0,
                    isVerified: false
                });
                console.log("Регистрация успешна:", username);
                alert("Регистрация выполнена: " + username);
                currentUser = username;
                localStorage.setItem("currentUser", currentUser);
                updateUserInfo();
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

// Инициализация
updateUserInfo();