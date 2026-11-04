
/* =========================================
   1. APPLICATION DATA
========================================= */

// All values start at zero.
// Data is saved in browser localStorage.

let transactions = JSON.parse(
    localStorage.getItem("expenseFlowTransactions") || "[]"
);

let monthlyBudget = Number(
    localStorage.getItem("expenseFlowBudget") || 0
);

const categoryColors = {
    Food: "#8738f5",
    Shopping: "#ff7048",
    Travel: "#20b981",
    Bills: "#4bafff",
    Entertainment: "#f3bd4f",
    Health: "#f16b9a",
    Salary: "#20b981",
    Other: "#aaa9b8"
};

const categoryIcons = {
    Food: "🍔",
    Shopping: "🛍️",
    Travel: "🚕",
    Bills: "🧾",
    Entertainment: "🎮",
    Health: "💊",
    Salary: "💰",
    Other: "📦"
};

/* =========================================
   2. INITIALIZE APPLICATION
========================================= */

const today = new Date();

document.getElementById("currentDate").textContent =
    today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

document.getElementById("transactionDate").value =
    today.toISOString().split("T")[0];

function saveData() {
    localStorage.setItem(
        "expenseFlowTransactions",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "expenseFlowBudget",
        String(monthlyBudget)
    );
}

/* =========================================
   3. CURRENCY FORMATTER
========================================= */

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

/* =========================================
   4. CALCULATE TOTALS
========================================= */

function calculateTotals() {

    const income = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const expense = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    const balance = income - expense;

    document.getElementById("balance").textContent =
        formatCurrency(balance);

    document.getElementById("income").textContent =
        formatCurrency(income);

    document.getElementById("expense").textContent =
        formatCurrency(expense);

    document.getElementById("donutTotal").textContent =
        formatCurrency(expense);

    updateBudget(expense);
}

/* =========================================
   5. RENDER TRANSACTIONS
========================================= */

function renderTransactions() {

    const list = document.getElementById("transactionList");

    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <h3>No transactions yet</h3>
                <p>Your transactions will appear here when you add them.</p>
            </div>
        `;

        return;
    }

    const sorted = [...transactions].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    list.innerHTML = sorted.map(item => {

        const isIncome = item.type === "income";

        const date = new Date(item.date + "T00:00:00")
            .toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        return `
            <div class="transaction">

                <div class="transaction-left">

                    <div class="transaction-icon">
                        ${categoryIcons[item.category] || "📦"}
                    </div>

                    <div class="transaction-details">
                        <h4>${escapeHTML(item.title)}</h4>
                        <p>${escapeHTML(item.category)} · ${date}</p>
                    </div>

                </div>

                <div class="transaction-right">

                    <div class="transaction-amount ${isIncome ? "positive" : "negative"}">
                        ${isIncome ? "+" : "-"}${formatCurrency(item.amount)}
                    </div>

                    <div class="transaction-status">
                        ${isIncome ? "Income" : "Expense"}
                    </div>

                </div>

                <button
                    onclick="deleteTransaction('${item.id}')"
                    aria-label="Delete transaction"
                    title="Delete transaction"
                    style="background:transparent;color:#aaa9b8;padding:8px;font-size:15px">
                    ×
                </button>

            </div>
        `;

    }).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

/* =========================================
   6. ADD TRANSACTION
========================================= */

function openModal(type = "expense") {

    document.getElementById("transactionType").value = type;

    document.getElementById("modalOverlay")
        .classList.add("show");
}

function closeModal() {

    document.getElementById("modalOverlay")
        .classList.remove("show");
}

document.getElementById("modalOverlay")
    .addEventListener("click", function(event) {

        if (event.target === this) {
            closeModal();
        }

    });

document.getElementById("transactionForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const type = document.getElementById("transactionType").value;

        const title = document.getElementById("transactionTitle")
            .value.trim();

        const amount = Number(
            document.getElementById("transactionAmount").value
        );

        const category = document.getElementById("transactionCategory").value;

        const date = document.getElementById("transactionDate").value;

        if (!title || !date || !Number.isFinite(amount) || amount <= 0) {
            alert("Please enter valid transaction details.");
            return;
        }

        const transaction = {
            id: crypto.randomUUID(),
            type,
            title,
            amount,
            category,
            date
        };

        transactions.push(transaction);

        saveData();
        updateDashboard();

        this.reset();

        document.getElementById("transactionDate").value =
            today.toISOString().split("T")[0];

        closeModal();

    });

/* =========================================
   7. DELETE TRANSACTION
========================================= */

function deleteTransaction(id) {

    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    transactions = transactions.filter(
        item => item.id !== id
    );

    saveData();
    updateDashboard();
}

/* =========================================
   8. CATEGORY BREAKDOWN
========================================= */

function updateCategories() {

    const expenses = transactions.filter(
        item => item.type === "expense"
    );

    const total = expenses.reduce(
        (sum, item) => sum + item.amount, 0
    );

    const categories = {};

    expenses.forEach(item => {

        categories[item.category] =
            (categories[item.category] || 0) + item.amount;

    });

    const colors = [
        "#8738f5",
        "#ff7048",
        "#20b981",
        "#4bafff",
        "#f3bd4f",
        "#f16b9a",
        "#aaa9b8"
    ];

    const entries = Object.entries(categories)
        .sort((a, b) => b[1] - a[1]);

    let currentAngle = 0;

    const gradients = [];

    entries.forEach(([category, amount], index) => {

        const percentage = total > 0 ? amount / total * 100 : 0;

        const nextAngle = currentAngle + percentage * 3.6;

        gradients.push(
            `${colors[index % colors.length]} ${currentAngle}deg ${nextAngle}deg`
        );

        currentAngle = nextAngle;

    });

    document.getElementById("donutChart").style.background =
        total > 0
            ? `conic-gradient(${gradients.join(",")})`
            : "#e5e5ee";

    const categoryList = document.getElementById("categoryList");

    if (entries.length === 0) {

        categoryList.innerHTML = `
            <div class="category-item">
                <span class="category-name">
                    <span class="category-color" style="background:#8738f5"></span>
                    No data
                </span>
                <span>0%</span>
            </div>
        `;

        return;
    }

    categoryList.innerHTML = entries.map(
        ([category, amount], index) => {

            const percentage = Math.round(amount / total * 100);

            return `
                <div class="category-item">
                    <span class="category-name">
                        <span class="category-color"
                              style="background:${colors[index % colors.length]}"></span>
                        ${escapeHTML(category)}
                    </span>
                    <span>${percentage}%</span>
                </div>
            `;

        }
    ).join("");
}

/* =========================================
   9. SPENDING CHART
========================================= */

function updateChart() {

    const period = document.getElementById("chartPeriod").value;

    const bars = document.querySelectorAll("#chartBars rect");

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const grouped = Array.from({ length: 5 }, () => ({
        income: 0,
        expense: 0
    }));

    transactions.forEach(item => {

        const date = new Date(item.date + "T00:00:00");

        if (
            date.getMonth() !== currentMonth ||
            date.getFullYear() !== currentYear
        ) {
            return;
        }

        let index;

        if (period === "week") {
            index = Math.min(4, Math.floor((date.getDate() - 1) / 7));
        } else {
            index = Math.min(4, Math.floor((date.getDate() - 1) / 7));
        }

        grouped[index][item.type] += item.amount;

    });

    const maxValue = Math.max(
        1000,
        ...grouped.flatMap(item => [item.income, item.expense])
    );

    bars.forEach((bar, index) => {

        const group = grouped[Math.floor(index / 2)];

        const value = index % 2 === 0
            ? group.income
            : group.expense;

        const height = (value / maxValue) * 120;

        bar.setAttribute("y", 155 - height);
        bar.setAttribute("height", height);

    });
}

document.getElementById("chartPeriod")
    .addEventListener("change", updateChart);

/* =========================================
   10. BUDGET MANAGEMENT
========================================= */

function setBudget() {

    const value = prompt(
        "Enter your monthly budget in ₹:",
        monthlyBudget || ""
    );

    if (value === null) return;

    const budget = Number(value);

    if (!Number.isFinite(budget) || budget < 0) {
        alert("Please enter a valid budget.");
        return;
    }

    monthlyBudget = budget;

    saveData();

    const expense = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    updateBudget(expense);
}

function updateBudget(expense) {

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyExpense = transactions
        .filter(item => {
            const date = new Date(item.date + "T00:00:00");

            return item.type === "expense" &&
                   date.getMonth() === currentMonth &&
                   date.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + item.amount, 0);

    document.getElementById("budgetText").textContent =
        `${formatCurrency(monthlyExpense)} / ${formatCurrency(monthlyBudget)}`;

    const percentage = monthlyBudget > 0
        ? Math.min(100, monthlyExpense / monthlyBudget * 100)
        : 0;

    document.getElementById("budgetProgress").style.width =
        percentage + "%";

    document.getElementById("budgetProgress").style.background =
        percentage >= 90 ? "#ef5350" : "#8738f5";
}

/* =========================================
   11. EXPORT TRANSACTIONS AS CSV
========================================= */

function exportCSV() {

    if (transactions.length === 0) {
        alert("There are no transactions to export.");
        return;
    }

    const headers = [
        "Type",
        "Title",
        "Amount",
        "Category",
        "Date"
    ];

    const rows = transactions.map(item => [
        item.type,
        item.title,
        item.amount,
        item.category,
        item.date
    ]);

    const csv = [
        headers,
        ...rows
    ].map(row =>
        row.map(value =>
            `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
    ).join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "expenseflow-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
}

/* =========================================
   12. NAVIGATION INTERACTIONS
========================================= */

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", function() {

        const page = this.dataset.page;

        document.querySelectorAll("[data-page]").forEach(item => {
            item.classList.remove("active");
        });

        document.querySelectorAll(`[data-page="${page}"]`)
            .forEach(item => item.classList.add("active"));

        const sections = {
            dashboard: document.querySelector(".balance-grid"),
            transactions: document.querySelector(".transactions-panel"),
            analytics: document.querySelector(".content-grid"),
            budgets: document.querySelector(".bottom-grid"),
            settings: document.querySelector(".header")
        };

        if (sections[page]) {
            sections[page].scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

    });

});

/* =========================================
   13. REFRESH DASHBOARD
========================================= */

function updateDashboard() {

    calculateTotals();
    renderTransactions();
    updateCategories();
    updateChart();

}

// Initial application render
updateDashboard();
