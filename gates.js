const GRID_WIDTH = 6;
const GRID_HEIGHT = 5;
const SYMBOLS = ["💎", "👑", "🍇", "🕒", "⚡", "⭐"];
const SCATTER = "🌟";
let grid = [];
let multiplier = 1;
let totalWin = 0;
let bonusSpins = 0;
const SPIN_COST = 10;

function checkLogin() {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
        alert("Войдите в аккаунт!");
        window.location.href = "../index.html";
        return false;
    }
    return true;
}

async function getUserData() {
    const currentUser = localStorage.getItem("currentUser");
    const userRef = window.dbRef(window.database, 'users/' + currentUser);
    const snapshot = await window.dbGet(userRef);
    return snapshot.val() || { balance: 0 };
}

async function updateUserBalance(newBalance) {
    const currentUser = localStorage.getItem("currentUser");
    const userRef = window.dbRef(window.database, 'users/' + currentUser);
    await window.dbUpdate(userRef, { balance: newBalance });
    document.getElementById("info-panel").querySelector("p:nth-child(3)").textContent = `Баланс: ${newBalance}`;
}

function initializeGrid() {
    const slotGrid = document.getElementById("slotGrid");
    slotGrid.innerHTML = "";
    grid = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
        const rowArray = [];
        for (let col = 0; col < GRID_WIDTH; col++) {
            const cell = document.createElement("div");
            cell.classList.add("slot-cell");
            const symbol = Math.random() < 0.1 ? SCATTER : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            cell.textContent = symbol;
            slotGrid.appendChild(cell);
            rowArray.push(symbol);
        }
        grid.push(rowArray);
    }
}

function findClusters() {
    const clusters = [];
    const visited = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(false));
    function dfs(row, col, symbol, cluster) {
        if (row < 0 || row >= GRID_HEIGHT || col < 0 || col >= GRID_WIDTH || visited[row][col] || grid[row][col] !== symbol) return;
        visited[row][col] = true;
        cluster.push({ row, col });
        dfs(row + 1, col, symbol, cluster);
        dfs(row - 1, col, symbol, cluster);
        dfs(row, col + 1, symbol, cluster);
        dfs(row, col - 1, symbol, cluster);
    }
    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            if (visited[row][col]) continue;
            const symbol = grid[row][col];
            if (symbol === SCATTER) continue;
            const cluster = [];
            dfs(row, col, symbol, cluster);
            if (cluster.length >= 6) clusters.push(cluster);
        }
    }
    return clusters;
}

function removeClusters(clusters) {
    for (const cluster of clusters) {
        for (const cell of cluster) {
            const gridCell = document.getElementById("slotGrid").children[cell.row * GRID_WIDTH + cell.col];
            gridCell.classList.add("destroyed");
            grid[cell.row][col] = "";
        }
    }
    setTimeout(dropSymbols, 500);
}

function dropSymbols() {
    for (let col = 0; col < GRID_WIDTH; col++) {
        let emptyRow = GRID_HEIGHT - 1;
        for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
            if (grid[row][col] !== "") {
                grid[emptyRow][col] = grid[row][col];
                emptyRow--;
            }
        }
        for (let row = emptyRow; row >= 0; row--) {
            grid[row][col] = Math.random() < 0.1 ? SCATTER : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        }
    }
    updateGrid();
}

function updateGrid() {
    const slotGrid = document.getElementById("slotGrid");
    slotGrid.innerHTML = "";
    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            const cell = document.createElement("div");
            cell.classList.add("slot-cell");
            cell.textContent = grid[row][col] || "";
            slotGrid.appendChild(cell);
        }
    }
}

function addMultiplier() {
    const rareMultiplier = Math.random();
    if (rareMultiplier < 0.01) {
        multiplier *= Math.floor(Math.random() * (1000 - 2 + 1)) + 2; // 2x to 1000x, rare
    } else if (Math.random() < 0.3) {
        multiplier *= Math.floor(Math.random() * (10 - 2 + 1)) + 2; // 2x to 10x
    }
    document.getElementById("multiplierText").textContent = `Множитель: ${multiplier}x`;
}

function triggerBonusSpins() {
    bonusSpins = 15;
    document.getElementById("bonusInfo").style.display = "block";
    document.getElementById("bonusSpinsCount").textContent = bonusSpins;
    alert("Бонусные спины активированы! 15 спинов.");
}

async function spinSlot() {
    if (!checkLogin()) return;
    const userData = await getUserData();
    if (userData.balance < SPIN_COST) {
        alert("Недостаточно валюты!");
        return;
    }

    multiplier = 1;
    totalWin = 0;
    document.getElementById("multiplierText").textContent = `Множитель: ${multiplier}x`;
    document.getElementById("winText").textContent = `Выигрыш: ${totalWin}`;

    if (bonusSpins > 0) {
        bonusSpins--;
        document.getElementById("bonusSpinsCount").textContent = bonusSpins;
        if (bonusSpins === 0) document.getElementById("bonusInfo").style.display = "none";
    } else {
        initializeGrid();
    }

    let hasClusters = true;
    let scatterCount = 0;

    while (hasClusters) {
        const clusters = findClusters();
        if (clusters.length === 0) {
            hasClusters = false;
            continue;
        }
        removeClusters(clusters);
        addMultiplier();
        await new Promise(resolve => setTimeout(resolve, 200));
        scatterCount = grid.flat().filter(symbol => symbol === SCATTER).length;
        if (scatterCount >= 4 && bonusSpins === 0) triggerBonusSpins();
        let roundWin = 0;
        for (const cluster of clusters) roundWin += cluster.length * SPIN_COST;
        totalWin += roundWin * multiplier;
        document.getElementById("winText").textContent = `Выигрыш: ${totalWin}`;
    }
    userData.balance -= SPIN_COST;
    userData.balance += totalWin;
    await updateUserBalance(userData.balance);
}