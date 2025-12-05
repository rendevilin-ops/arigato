/* ページ切り替え */
function showStep(n) {
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    document.getElementById("step" + n).classList.add("active");
}

/* データ保持 */
const selected = { date: null, service: null, time: null, pax: null };

/* Step1 — 日付 */
function setToday() {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    document.getElementById("resDate").value = `${yyyy}-${mm}-${dd}`;
}
setToday();

document.getElementById("prevDate").onclick = () => changeDate(-1);
document.getElementById("nextDate").onclick = () => changeDate(1);

function changeDate(d) {
    const input = document.getElementById("resDate");
    const c = new Date(input.value);
    c.setDate(c.getDate() + d);
    input.value = c.toISOString().split("T")[0];
}

/* Step1 — Service & Time */
document.querySelectorAll(".service-btn").forEach(btn => {
    btn.onclick = () => {
        selected.service = btn.dataset.service;
        document.querySelectorAll(".service-btn").forEach(b => b.style.background = "");
        btn.style.background = "#ccc";
        updateTimeButtons();
    };
});

function updateTimeButtons() {
    const box = document.getElementById("timeButtons");
    box.innerHTML = "";
    selected.time = null;

    if (!selected.service) return;

    const lunch = ["12:00", "12:30", "13:00", "13:30"];
    const dinner = ["20:00", "20:30", "21:00"];
    const times = selected.service === "lunch" ? lunch : dinner;

    times.forEach(t => {
        const b = document.createElement("button");
        b.textContent = t;
        b.style.margin = "5px";
        b.onclick = () => {
            selected.time = t;
            document.querySelectorAll("#timeButtons button").forEach(bb => bb.style.background = "");
            b.style.background = "#ccc";
        };
        box.appendChild(b);
    });
}

/* Next → Step2 */
document.getElementById("toStep2").onclick = () => {
    selected.date = document.getElementById("resDate").value;
    selected.pax = document.getElementById("resPax").value;

    if (!selected.date || !selected.service || !selected.time) {
        alert("Veuillez compléter la date, le service et l'heure.");
        return;
    }

    document.getElementById("summary1").innerHTML =
        `📅 ${selected.date}<br>🕒 ${selected.time} (${selected.service})<br>👥 ${selected.pax} pers.`;

    showStep(2);
};

/* Step2 → Step3 */
document.getElementById("back1").onclick = () => showStep(1);

document.getElementById("toStep3").onclick = () => {
    const last = document.getElementById("lastName").value.trim();
    const first = document.getElementById("firstName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!last || !first || !email || !phone) {
        alert("Merci de remplir toutes les informations.");
        return;
    }

    document.getElementById("summary2").innerHTML =
        `👤 ${last} ${first}<br>📧 ${email}<br>📞 ${phone}`;

    showStep(3);
};

/* Step3 → Step4 */
document.getElementById("back2").onclick = () => showStep(2);

document.getElementById("toS
