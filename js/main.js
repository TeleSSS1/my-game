// Инициализация Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentUser = localStorage.getItem("currentUser"); // Сохраняем текущего пользователя локально
let isAdmin = false;
let lastSpinTime = null;
let isLogin = true;

// Закодированный пароль в base64 для "3gh5vd43gyy6"
const ADMIN_PASS_ENCODED = "M2doNXZkNDNneXk2";

// Простая функция декодирования base64
function decodePass(encoded) {
    return atob(encoded);
}

function showGamesSection() {
    if (!currentUser) {
        alert("Войдите в аккаунт!");
        return;
    }
    database.ref('users/' + currentUser).once('value').then((snapshot) => {
        const userData = snapshot.val();
        if (!userData.isVerified) {
            alert("Ваш аккаунт не верифицирован! Обратитесь к администратору.");
            return;
        }
        document.getElementById("mainHeader").style.display = "none";
        document.getElementById("gameGrid").style.display = "grid";
        document.getElementById("gameSectionHeader").style.display = "block";
        document.getElementById("adminButton").style.display = "none";
    });
}

function backToMain() {
    document.getElementById("mainHeader").style.display = "block";
    document.getElementById("gameGrid").style.display = "none";
    document.getElementById("gameSectionHeader").style.display = "none";
    document.getElementById("adminButton").style.display = "block";
}

function showRoulette() {
    if (!currentUser) {
        alert("Войдите в аккаунт!");
        return;
    }
    database.ref('users/' + currentUser).once('value').then((snapshot) => {
        const userData = snapshot.val();
        if (!userData.isVerified) {
            alert("Ваш аккаунт не верифицирован! Обратитесь к администратору.");
            return;
        }
        window.location.href = "games/roulette.html";
    });
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
    if (lastSpinTime) {
        const now = new Date().getTime();
        const timeDiff = (now - lastSpinTime) / (1000 * 60 * 60);
        if (timeDiff < 6) {
            const remaining = 6 - Math.floor(timeDiff);
            document.getElementById("cooldownText").textContent = `Следующая прокрутка доступна через: ${remaining} часов`;
            document.getElementById("bonusSpinBtn").disabled = true;
            document.getElementById("mainSpinBtn").disabled = true;
        } else {
            document.getElementById("cooldownText").textContent = "Следующая прокрутка доступна через: -";
            document.getElementById("bonusSpinBtn").disabled = false;
        }
    } else {
        document.getElementById("cooldownText").textContent = "Следующая прокрутка доступна через: -";
        document.getElementById("bonusSpinBtn").disabled = false;
    }
}

function spinBonus() {
    const bonusValues = [1, 2, 3, 4, 5];
    const bonus = bonusValues[Math.floor(Math.random() * bonusValues.length)];
    document.getElementById("bonusResult").textContent = `Бонус: ${bonus}x`;
    document.getElementById("mainSpinBtn").disabled = false;
}

function spinMain() {
    const mainValues = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
    const spins = Math.floor(Math.random() * 40);
    let result = mainValues[Math.floor(Math.random() * mainValues.length)];
    let emoji = "";
    if (result === 50) emoji = " 🐒";
    else if (result === 100) emoji = " 🐘";
    else if (result === 200) emoji = " 💵";
    document.getElementById("spinResult").textContent = `Выигрыш: ${result}${emoji}`;
    const bonus = parseInt(document.getElementById("bonusResult").textContent.replace("Бонус: ", "").replace("x", ""));
    const totalWin = result * bonus;

    database.ref('users/' + currentUser).once('value').then((snapshot) => {
        const userData = snapshot.val();
        const newBalance = (userData.balance || 0) + totalWin;
        database.ref('users/' + currentUser).update({ balance: newBalance });
        updateUserInfo();
    });

    lastSpinTime = new Date().getTime();
    document.getElementById("bonusSpinBtn").disabled = true;
    document.getElementById("mainSpinBtn").disabled = true;
    checkSpinCooldown();
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

function showProfile() {
    database.ref('users/' + currentUser).once('value').then((snapshot) => {
        const userData = snapshot.val();
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
    });
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

function showAdminPanel() {
    database.ref('users').once('value').then((snapshot) => {
        const users = snapshot.val();
        const playerSelect = document.getElementById("playerSelect");
        playerSelect.innerHTML = '<option value="">Выберите игрока</option>';

        for (const user in users) {
            const option = document.createElement("option");
            option.value = user;
            option.textContent = user;
            playerSelect.appendChild(option);
        }

        document.getElementById("playerBalance").textContent = "Валюта: 0";
        document.getElementById("playerPoints").textContent = "Поинты: 0";
        document.getElementById("playerVerified").innerHTML = "Верифицирован: <span class='unverified-icon'>✖</span>";
        document.getElementById("newBalance").value = "";
        document.getElementById("newPoints").value = "";
        document.getElementById("adminPanel").style.display = "block";
    });
}

function closeAdminPanel() {
    isAdmin = false;
    document.getElementById("adminPanel").style.display = "none";
    document.getElementById("adminButton").style.display = "block";
}

function updatePlayerInfo() {
    const selectedUser = document.getElementById("playerSelect").value;
    if (selectedUser) {
        database.ref('users/' + selectedUser).once('value').then((snapshot) => {
            const userData = snapshot.val();
            document.getElementById("playerBalance").textContent = "Валюта: " + userData.balance;
            document.getElementById("playerPoints").textContent = "Поинты: " + userData.points;
            document.getElementById("playerVerified").innerHTML = userData.isVerified 
                ? "Верифицирован: <span class='verified-icon'>✔</span>" 
                : "Верифицирован: <span class='unverified-icon'>✖</span>";
        });
    } else {
        document.getElementById("playerBalance").textContent = "Валюта: 0";
        document.getElementById("playerPoints").textContent = "Поинты: 0";
        document.getElementById("playerVerified").innerHTML = "Верифицирован: <span class='unverified-icon'>✖</span>";
    }
}

function updateBalance() {
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

    database.ref('users/' + selectedUser).update({ balance: newBalance }).then(() => {
        document.getElementById("playerBalance").textContent = "Валюта: " + newBalance;
        document.getElementById("newBalance").value = "";
        if (selectedUser === currentUser) updateUserInfo();
    });
}

function updatePoints() {
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

    database.ref('users/' + selectedUser).update({ points: newPoints }).then(() => {
        document.getElementById("playerPoints").textContent = "Поинты: " + newPoints;
        document.getElementById("newPoints").value = "";
        if (selectedUser === currentUser) updateUserInfo();
    });
}

function verifyPlayer(verify) {
    const selectedUser = document.getElementById("playerSelect").value;
    if (!selectedUser) {
        alert("Выберите игрока!");
        return;
    }

    database.ref('users/' + selectedUser).update({ isVerified: verify }).then(() => {
        document.getElementById("playerVerified").innerHTML = verify 
            ? "Верифицирован: <span class='verified-icon'>✔</span>" 
            : "Верифицирован: <span class='unverified-icon'>✖</span>";
        alert(`Верификация для ${selectedUser} ${verify ? "подтверждена" : "отклонена"}!`);
    });
}

function updateUserInfo() {
    if (currentUser) {
        database.ref('users/' + currentUser).once('value').then((snapshot) => {
            const userData = snapshot.val() || { balance: 0, points: 0 };
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
        });
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
}

function handleAuth() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (!username || !password) {
        alert("Заполните все поля!");
        return;
    }

    if (isLogin) {
        database.ref('users/' + username).once('value').then((snapshot) => {
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
        });
    } else {
        database.ref('users/' + username).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                console.log("Регистрация неуспешна: пользователь уже существует", username);
                alert("Пользователь уже существует!");
            } else {
                database.ref('users/' + username).set({
                    password: password,
                    balance: 0,
                    points: 0,
                    isVerified: false
                }).then(() => {
                    console.log("Регистрация успешна:", username, password);
                    alert("Регистрация выполнена: " + username);
                    currentUser = username;
                    localStorage.setItem("currentUser", currentUser);
                    updateUserInfo();
                    closeAuth();
                });
            }
        });
    }
}

function showShop() {
    alert("Переход к Магазину");
}

updateUserInfo();
checkSpinCooldown();
