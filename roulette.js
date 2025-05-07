const bonusCanvas = document.getElementById("bonusCanvas");
const mainCanvas = document.getElementById("mainCanvas");
const bonusCtx = bonusCanvas ? bonusCanvas.getContext("2d") : null;
const mainCtx = mainCanvas ? mainCanvas.getContext("2d") : null;
const centerX = bonusCanvas ? bonusCanvas.width / 2 : 200;
const centerY = bonusCanvas ? bonusCanvas.height / 2 : 200;
const radius = bonusCanvas ? bonusCanvas.width / 2 - 10 : 190;
let currentBonusAngle = 0;
let currentMainAngle = 0;
let isSpinning = false;
let bonusMultiplier = 1;
const currentUser = localStorage.getItem("currentUser");

const bonusSegments = ["1x", "2x", "3x", "4x", "5x"];
const mainSegments = [1, 5, 10, 20, 30, 40, "🐒", 60, 70, 80, 90, "🐘", 110, 120, 130, 140, 150, 160, 170, 180, 190, "💵"];
const tooltip = document.getElementById("segmentTooltip");

async function checkLogin() {
    if (!currentUser) {
        alert("Войдите в аккаунт!");
        window.location.href = "index.html";
        return false;
    }
    try {
        const userRef = window.dbRef(window.database, 'users/' + currentUser);
        const snapshot = await window.dbGet(userRef);
        const userData = snapshot.val();
        if (!userData || !userData.isVerified) {
            alert("Ваш аккаунт не верифицирован! Обратитесь к администратору.");
            window.location.href = "index.html";
            return false;
        }
        await updateUserInfo();
        return true;
    } catch (error) {
        console.error("Ошибка проверки логина:", error);
        return false;
    }
}

async function updateUserInfo() {
    const balanceTextSecondary = document.getElementById("balanceTextSecondary");
    const pointsTextSecondary = document.getElementById("pointsTextSecondary");
    if (balanceTextSecondary && pointsTextSecondary) {
        try {
            const userRef = window.dbRef(window.database, 'users/' + currentUser);
            const snapshot = await window.dbGet(userRef);
            const userData = snapshot.val() || { balance: 0, points: 0 };
            balanceTextSecondary.textContent = "Баланс: " + userData.balance;
            pointsTextSecondary.textContent = "Поинты: " + userData.points;
        } catch (error) {
            console.error("Ошибка обновления информации:", error);
        }
    }
}

function handleAccountClick() {
    if (!currentUser) {
        window.location.href = "index.html";
    } else {
        alert("Функция 'Мой аккаунт' пока не реализована полностью. Используйте главную страницу для профиля.");
    }
}

function showTooltip(element, text) {
    const tooltip = document.getElementById("tooltip");
    if (tooltip) {
        tooltip.textContent = text;
        tooltip.style.left = element.getBoundingClientRect().left + "px";
        tooltip.style.top = (element.getBoundingClientRect().top - 30) + "px";
    }
}

function showSegmentTooltip(x, y, text) {
    const tooltip = document.getElementById("segmentTooltip");
    if (tooltip) {
        tooltip.style.left = x + "px";
        tooltip.style.top = y + "px";
        tooltip.textContent = text;
        tooltip.style.display = "block";
    }
}

function hideSegmentTooltip() {
    const tooltip = document.getElementById("segmentTooltip");
    if (tooltip) tooltip.style.display = "none";
}

function drawWheel(canvas, ctx, segments, currentAngle, wheelType, highlightSegment = -1, highlightScale = 1) {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const segmentCount = segments.length;
    const anglePerSegment = (2 * Math.PI) / segmentCount;

    for (let i = 0; i < segmentCount; i++) {
        const startAngle = i * anglePerSegment + currentAngle;
        const endAngle = startAngle + anglePerSegment;
        let currentRadius = radius;

        if (i === highlightSegment) {
            currentRadius *= highlightScale;
        }

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, currentRadius, startAngle, endAngle);
        ctx.closePath();

        let fillColor = i % 2 === 0 ? "#FFD700" : "#FFCA5A";
        if (i === highlightSegment) {
            fillColor = "#FFFFFF";
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#FFFF00";
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = "#FFD700";
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(segments[i], radius - 20, 0);

        let validityCount;
        if (wheelType === "bonus") {
            validityCount = parseInt(segments[i].replace("x", ""));
        } else {
            const value = typeof segments[i] === "string" ? parseInt(segments[i].replace(/[^0-9]/g, "")) || 1 : segments[i];
            if (value <= 40) validityCount = 1;
            else if (value <= 80) validityCount = 2;
            else if (value <= 120) validityCount = 3;
            else if (value <= 160) validityCount = 4;
            else validityCount = 5;
        }
        const boxSize = 8;
        const boxX = radius - 10;
        const boxY = -4;
        const colors = ["#8B0000", "#A52A2A", "#CD5C5C", "#F08080", "#FF0000"];
        ctx.fillStyle = colors[Math.min(validityCount - 1, 4)];
        ctx.fillRect(boxX, boxY, boxSize, boxSize);

        const rect = { x: boxX, y: boxY, width: boxSize, height: boxSize };
        ctx.canvas.addEventListener("mousemove", (e) => {
            const rectX = centerX + (rect.x * Math.cos(currentAngle) - rect.y * Math.sin(currentAngle));
            const rectY = centerY + (rect.x * Math.sin(currentAngle) + rect.y * Math.cos(currentAngle));
            const mouseX = e.clientX - canvas.getBoundingClientRect().left;
            const mouseY = e.clientY - canvas.getBoundingClientRect().top;
            if (mouseX >= rectX && mouseX <= rectX + boxSize && mouseY >= rectY && mouseY <= rectY + boxSize) {
                showSegmentTooltip(e.clientX, e.clientY, `Уровень валидности: ${validityCount}/5`);
            } else {
                hideSegmentTooltip();
            }
        });
        ctx.restore();
    }
}

function spinWheel(canvas, ctx, segments, currentAngle, callback, wheelType) {
    if (!canvas || !ctx || isSpinning) return;
    isSpinning = true;

    const randomSpins = Math.floor(Math.random() * 5) + 3;
    const totalDegrees = randomSpins * 360 + Math.floor(Math.random() * 360);
    const startAngle = currentAngle;
    const endAngle = currentAngle + totalDegrees;
    const startTime = performance.now();
    const duration = Math.random() * (30 - 10) + 10;

    function animate(time) {
        const elapsed = (time - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentAngle = startAngle + (endAngle - startAngle) * easeOut;

        drawWheel(canvas, ctx, segments, currentAngle, wheelType);
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            currentAngle = currentAngle % (2 * Math.PI);

            const segmentCount = segments.length;
            const anglePerSegment = (2 * Math.PI) / segmentCount;
            const normalizedAngle = (2 * Math.PI - currentAngle) % (2 * Math.PI);
            const segmentIndex = Math.floor(normalizedAngle / anglePerSegment) % segmentCount;

            const highlightDuration = 2500;
            const highlightStartTime = performance.now();
            function highlightAnimate(highlightTime) {
                const highlightElapsed = (highlightTime - highlightStartTime) / 1000;
                const highlightProgress = Math.min(highlightElapsed / (highlightDuration / 1000), 1);
                const scale = 1 + 0.1 * Math.sin(highlightProgress * Math.PI * 2 * 2);
                drawWheel(canvas, ctx, segments, currentAngle, wheelType, segmentIndex, scale);
                if (highlightProgress < 1) {
                    requestAnimationFrame(highlightAnimate);
                } else {
                    drawWheel(canvas, ctx, segments, currentAngle, wheelType);
                    if (callback) callback(currentAngle, segmentIndex);
                }
            }
            requestAnimationFrame(highlightAnimate);
        }
    }

    requestAnimationFrame(animate);
}

async function checkSpinCooldown() {
    const cooldownText = document.getElementById("cooldownText");
    if (cooldownText) {
        try {
            const userRef = window.dbRef(window.database, 'users/' + currentUser);
            const snapshot = await window.dbGet(userRef);
            const userData = snapshot.val() || { lastSpinTime: null };

            const lastSpinTime = userData.lastSpinTime;
            if (lastSpinTime) {
                const now = new Date().getTime();
                const timeDiff = (now - lastSpinTime) / (1000 * 60 * 60);
                if (timeDiff < 6) {
                    const remaining = 6 - Math.floor(timeDiff);
                    cooldownText.textContent = `Следующая прокрутка доступна через: ${remaining} часов`;
                    document.getElementById("bonusSpinBtn").disabled = true;
                    document.getElementById("bonusSpinBtn").classList.add("disabled");
                    document.getElementById("mainSpinBtn").disabled = true;
                    document.getElementById("mainSpinBtn").classList.add("disabled");
                } else {
                    cooldownText.textContent = "Следующая прокрутка доступна через: -";
                    document.getElementById("bonusSpinBtn").disabled = false;
                    document.getElementById("bonusSpinBtn").classList.remove("disabled");
                }
            } else {
                cooldownText.textContent = "Следующая прокрутка доступна через: -";
                document.getElementById("bonusSpinBtn").disabled = false;
                document.getElementById("bonusSpinBtn").classList.remove("disabled");
            }
        } catch (error) {
            console.error("Ошибка проверки времени спина:", error);
        }
    }
}

async function spinBonus() {
    if (!await checkLogin()) return;
    const bonusSpinBtn = document.getElementById("bonusSpinBtn");
    const bonusResult = document.getElementById("bonusResult");
    if (bonusSpinBtn && bonusResult) {
        spinWheel(bonusCanvas, bonusCtx, bonusSegments, currentBonusAngle, async (finalAngle, segmentIndex) => {
            bonusMultiplier = parseInt(bonusSegments[segmentIndex].replace("x", ""));
            bonusResult.textContent = `Бонус: ${bonusMultiplier}x`;
            currentBonusAngle = finalAngle;
            document.getElementById("mainSpinBtn").disabled = false;
            document.getElementById("mainSpinBtn").classList.remove("disabled");
            bonusSpinBtn.disabled = true;
            bonusSpinBtn.classList.add("disabled");
        }, "bonus");
    }
}

async function spinMain() {
    if (!await checkLogin()) return;
    const mainSpinBtn = document.getElementById("mainSpinBtn");
    const spinResult = document.getElementById("spinResult");
    const totalResult = document.getElementById("totalResult");
    if (mainSpinBtn && spinResult && totalResult) {
        spinWheel(mainCanvas, mainCtx, mainSegments, currentMainAngle, async (finalAngle, segmentIndex) => {
            const win = mainSegments[segmentIndex];
            let displayWin = win;
            if (typeof win === "string") displayWin = win;
            spinResult.textContent = `Выигрыш: ${displayWin}`;
            const totalWin = typeof win === "string" ? parseInt(win.replace(/[^0-9]/g, "")) * bonusMultiplier : win * bonusMultiplier;
            totalResult.textContent = `Общий выигрыш: ${totalWin}`;

            try {
                const userRef = window.dbRef(window.database, 'users/' + currentUser);
                const snapshot = await window.dbGet(userRef);
                const userData = snapshot.val() || { balance: 0 };
                const newBalance = userData.balance + totalWin;
                await window.dbUpdate(userRef, { balance: newBalance, lastSpinTime: new Date().getTime() });
                await updateUserInfo();
            } catch (error) {
                console.error("Ошибка обновления баланса:", error);
                alert("Ошибка при обновлении баланса!");
            }

            currentMainAngle = finalAngle;
            mainSpinBtn.disabled = true;
            mainSpinBtn.classList.add("disabled");
            document.getElementById("bonusSpinBtn").disabled = true;
            document.getElementById("bonusSpinBtn").classList.add("disabled");
            await checkSpinCooldown();
        }, "main");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    if (await checkLogin() && bonusCanvas && mainCanvas && bonusCtx && mainCtx) {
        drawWheel(bonusCanvas, bonusCtx, bonusSegments, currentBonusAngle, "bonus");
        drawWheel(mainCanvas, mainCtx, mainSegments, currentMainAngle, "main");
        await checkSpinCooldown();
    } else {
        console.log("DOM elements not found or login failed");
    }
});
