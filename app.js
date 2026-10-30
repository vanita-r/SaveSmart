const STORAGE_KEY = "savespace-v1";

const starterGoals = [
  { id: crypto.randomUUID(), name: "Emergency fund", target: 1000, saved: 0, category: "Emergency", description: "Build your financial safety net." },
  { id: crypto.randomUUID(), name: "Computer + workstation", target: 1800, saved: 0, category: "Technology", description: "A new computer, monitor, keyboard and mouse." },
  { id: crypto.randomUUID(), name: "Domestic trip", target: 1000, saved: 0, category: "Travel", description: "A getaway and a change of scenery." },
  { id: crypto.randomUUID(), name: "International trip", target: 3500, saved: 0, category: "Travel", description: "Save for a bigger adventure." },
  { id: crypto.randomUUID(), name: "New phone", target: 1000, saved: 0, category: "Personal", description: "Pending phone-plan and family logistics." },
  { id: crypto.randomUUID(), name: "Moving out", target: 8000, saved: 0, category: "Moving", description: "Your future apartment and moving costs." }
];

const defaultState = { goals: starterGoals, transactions: [], celebrated: {} };
let state = loadState();

const $ = (selector) => document.querySelector(selector);
const money = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount) || 0);
const safeText = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.goals) && Array.isArray(saved.transactions)) return saved;
  } catch (error) {
    console.warn("Could not load saved SaveSpace data:", error);
  }
  return structuredClone(defaultState);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function totalSaved() {
  return state.goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);
}

function render() {
  renderSummary();
  renderGoals();
  renderActivity();
  renderGoalOptions();
}

function renderSummary() {
  const total = totalSaved();
  const remaining = state.goals.reduce((sum, goal) => sum + Math.max(0, Number(goal.target) - Number(goal.saved)), 0);
  $("#total-saved").textContent = money(total);
  $("#active-goals").textContent = state.goals.filter(goal => goal.saved < goal.target).length;
  $("#remaining-total").textContent = money(remaining);
  $("#total-saved-caption").textContent = `${state.goals.filter(goal => goal.saved >= goal.target).length} goal(s) completed`;
}

function categoryIcon(category) {
  return ({ Emergency: "♡", Technology: "⌘", Travel: "✈", Moving: "⌂", Personal: "✦", Other: "◎" })[category] || "◎";
}

function renderGoals() {
  const grid = $("#goal-grid");
  $("#empty-goals").classList.toggle("hidden", state.goals.length > 0);
  grid.classList.toggle("hidden", state.goals.length === 0);
  grid.innerHTML = state.goals.map(goal => {
    const target = Math.max(1, Number(goal.target));
    const saved = Math.max(0, Number(goal.saved));
    const percent = Math.min(100, Math.round((saved / target) * 100));
    const remaining = Math.max(0, target - saved);
    return `
      <article class="goal-card">
        <div class="goal-card-top">
          <div class="goal-symbol">${categoryIcon(goal.category)}</div>
          <button class="goal-menu" data-edit="${goal.id}" aria-label="Edit ${safeText(goal.name)}">···</button>
        </div>
        <div class="goal-name">${safeText(goal.name)}</div>
        <div class="goal-description">${safeText(goal.description || goal.category)}</div>
        <div class="goal-amount-row">
          <span class="goal-current">${money(saved)}</span>
          <span class="goal-target">of ${money(target)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
        <div class="goal-bottom"><span>${money(remaining)} to go</span><span class="goal-percent">${percent}%</span></div>
        <div class="goal-actions">
          <button data-add="${goal.id}">＋ Add money</button>
          <button data-edit="${goal.id}">Edit goal</button>
        </div>
      </article>`;
  }).join("");

  grid.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", () => openTransactionModal(button.dataset.add)));
  grid.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openGoalModal(button.dataset.edit)));
}

function renderActivity() {
  const list = $("#activity-list");
  const transactions = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  $("#empty-activity").classList.toggle("hidden", transactions.length > 0);
  list.innerHTML = transactions.map(transaction => {
    const goal = state.goals.find(item => item.id === transaction.goalId);
    const isWithdrawal = transaction.type === "withdrawal";
    const date = new Date(transaction.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `<div class="activity-item">
      <div class="activity-bubble ${isWithdrawal ? "withdrawal" : ""}">${isWithdrawal ? "↙" : "↗"}</div>
      <div class="activity-info"><strong>${safeText(goal?.name || "Deleted goal")}</strong><span>${safeText(transaction.note || (isWithdrawal ? "Withdrawal" : "Deposit"))} · ${date}</span></div>
      <div class="activity-amount ${isWithdrawal ? "withdrawal" : ""}">${isWithdrawal ? "−" : "+"}${money(transaction.amount)}</div>
    </div>`;
  }).join("");
}

function renderGoalOptions() {
  const options = state.goals.map(goal => `<option value="${goal.id}">${safeText(goal.name)}</option>`).join("");
  $("#transaction-goal").innerHTML = options;
  $("#planner-goal").innerHTML = options || `<option value="">Create a goal first</option>`;
}

function showToast(title, message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${safeText(title)}</strong><span>${safeText(message)}</span>`;
  $("#toast-region").appendChild(toast);
  window.setTimeout(() => toast.remove(), 4600);
}

function checkMilestones(goal, previousSaved) {
  const milestones = [
    { amount: 100, title: "First milestone!", message: "You saved your first $100. That's a great start!" },
    { amount: 250, title: "You're building momentum!", message: "Your consistency is paying off. Keep going!" },
    { amount: 500, title: "Halfway to your starter emergency fund!", message: "You've reached $500. You're halfway to that $1,000 cushion!" },
    { amount: 1000, title: "Starter emergency fund complete!", message: "You reached $1,000. Celebrate this important financial milestone!" }
  ];

  // Dollar milestones are tied to the emergency fund to avoid confusing alerts on every goal.
  if (goal.category === "Emergency" || goal.name.toLowerCase().includes("emergency")) {
    milestones.forEach(milestone => {
      const key = `${goal.id}-${milestone.amount}`;
      if (previousSaved < milestone.amount && goal.saved >= milestone.amount && !state.celebrated[key]) {
        state.celebrated[key] = true;
        showToast(milestone.title, milestone.message);
      }
    });
  }

  // Every goal also gets percentage-based celebrations.
  [25, 50, 75, 100].forEach(percent => {
    const threshold = goal.target * percent / 100;
    const key = `${goal.id}-${percent}pct`;
    if (previousSaved < threshold && goal.saved >= threshold && !state.celebrated[key]) {
      state.celebrated[key] = true;
      showToast(percent === 100 ? "Goal completed! 🎉" : `${percent}% of the way there!`, `${goal.name}: ${money(goal.saved)} saved toward ${money(goal.target)}.`);
    }
  });
  persist();
}

function openTransactionModal(goalId) {
  if (!state.goals.length) {
    showToast("Create a goal first", "Add a savings goal before recording a transaction.");
    return;
  }
  $("#transaction-form").reset();
  if (goalId) $("#transaction-goal").value = goalId;
  $("#transaction-modal").showModal();
}

function openGoalModal(goalId) {
  $("#goal-form").reset();
  const goal = state.goals.find(item => item.id === goalId);
  $("#goal-id").value = goal?.id || "";
  $("#goal-modal-title").textContent = goal ? "Edit your goal" : "Create a goal";
  if (goal) {
    $("#goal-name").value = goal.name;
    $("#goal-target").value = goal.target;
    $("#goal-category").value = goal.category;
    $("#goal-description").value = goal.description || "";
  }
  $("#goal-modal").showModal();
}

$("#transaction-form").addEventListener("submit", event => {
  event.preventDefault();
  const goal = state.goals.find(item => item.id === $("#transaction-goal").value);
  const amount = Number($("#transaction-amount").value);
  const type = $("#transaction-type").value;
  if (!goal || !Number.isFinite(amount) || amount <= 0) return;

  const previousSaved = Number(goal.saved);
  if (type === "withdrawal" && amount > previousSaved) {
    showToast("Not enough saved", "A withdrawal can't be larger than this goal's current balance.");
    return;
  }

  goal.saved = Math.max(0, previousSaved + (type === "deposit" ? amount : -amount));
  state.transactions.push({
    id: crypto.randomUUID(), goalId: goal.id, amount, type,
    note: $("#transaction-note").value.trim(),
    date: new Date().toISOString()
  });
  persist();
  render();
  $("#transaction-modal").close();
  if (type === "deposit") checkMilestones(goal, previousSaved);
  showToast(type === "deposit" ? "Savings updated" : "Withdrawal recorded", `${money(amount)} ${type === "deposit" ? "added to" : "withdrawn from"} ${goal.name}.`);
});

$("#goal-form").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#goal-id").value;
  const name = $("#goal-name").value.trim();
  const target = Number($("#goal-target").value);
  if (!name || !Number.isFinite(target) || target <= 0) return;

  const existing = state.goals.find(goal => goal.id === id);
  if (existing) {
    existing.name = name;
    existing.target = target;
    existing.category = $("#goal-category").value;
    existing.description = $("#goal-description").value.trim();
  } else {
    state.goals.push({
      id: crypto.randomUUID(), name, target, saved: 0,
      category: $("#goal-category").value,
      description: $("#goal-description").value.trim()
    });
  }
  persist();
  render();
  $("#goal-modal").close();
  showToast(existing ? "Goal updated" : "New goal created", `${name} is ready for your next step.`);
});

function calculatePlan() {
  const goal = state.goals.find(item => item.id === $("#planner-goal").value);
  const monthly = Number($("#monthly-amount").value);
  const starting = Number($("#starting-amount").value);
  const result = $("#planner-result");
  if (!goal) {
    result.textContent = "Create a savings goal to use the planner.";
    result.classList.remove("hidden");
    return;
  }
  if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(starting) || starting < 0) {
    result.textContent = "Enter a monthly contribution greater than $0 and a starting amount of $0 or more.";
    result.classList.remove("hidden");
    return;
  }
  const remaining = Math.max(0, Number(goal.target) - starting);
  if (remaining === 0) {
    result.innerHTML = `<strong>You're already there! 🎉</strong>Your starting amount meets or exceeds your ${safeText(goal.name)} target.`;
  } else {
    const months = Math.ceil(remaining / monthly);
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    const dateLabel = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    result.innerHTML = `<strong>${months} month${months === 1 ? "" : "s"}</strong>At ${money(monthly)} per month, you could reach your ${safeText(goal.name)} goal around <b>${dateLabel}</b>. That's ${money(remaining)} left to save.`;
  }
  result.classList.remove("hidden");
}

$("#calculate-plan").addEventListener("click", calculatePlan);
$("#planner-goal").addEventListener("change", () => {
  const goal = state.goals.find(item => item.id === $("#planner-goal").value);
  if (goal) $("#starting-amount").value = goal.saved;
});
$("#quick-add-btn").addEventListener("click", () => openTransactionModal());
$("#new-goal-btn").addEventListener("click", () => openGoalModal());
$("#empty-add-goal").addEventListener("click", () => openGoalModal());
$("#ai-info-btn").addEventListener("click", () => $("#info-modal").showModal());

$("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
render();
