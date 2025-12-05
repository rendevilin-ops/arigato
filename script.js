/* ページ切り替え */
function showStep(n) {
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    document.getElementById("step" + n).classList.add("active");
}

/* データ保持 */
const selected = { date: null, service: null, time: null, pax: null };

/* ===== API URL ===== */
const apiUrl =
    "https://script.google.com/macros/s/AKfycbzZVkNb6IH05nD0EGHg6sxBPJT-7-q45COlm67tNt395hlvVKDD8v7DjwpovDo0e1JwHA/exec";

/* ========== Step1 初期化 ========== */
function setToday() {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    document.getElementById("resDate").value = `${yyyy}-${mm}-${dd}`;
}
setToday();

/* 日付変更ボタン */
document.getElementById("prevDate").onclick = () => { changeDate(-1); };
document.getElementById("nextDate").onclick = () => { changeDate(1); };

function changeDate(d) {
    const input = document.getElementById("resDate");
    const c = new Date(input.value);
    c.setDate(c.getDate() + d);
    input.value = c.toISOString().split("T")[0];
}

/* ========== Step1 — Service 選択 ========== */
document.querySelectorAll(".service-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        selected.service = btn.dataset.service;

        document.querySelectorAll(".service-btn").forEach(b => b.style.background = "");
        btn.style.background = "#ccc";

        updateTimeButtons();
    });
});

/* 時間ボタン生成 */
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

/* ========== Step1 → Step2 ========== */
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

/* ========= Step2 → Step3 ========== */
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

/* ========= Step3 → Step4 ========== */
document.getElementById("back2").onclick = () => showStep(2);

document.getElementById("toStep4").onclick = () => {
    selected.kids = document.getElementById("kids").value;
    selected.veg = document.getElementById("vegCount").value;
    selected.celebration = document.getElementById("celebration").checked;
    selected.comment = document.getElementById("comment").value.trim();

    const html = `
    <strong>📅 Date :</strong> ${selected.date}<br>
    <strong>🕒 Heure :</strong> ${selected.time} (${selected.service})<br>
    <strong>👥 Nombre :</strong> ${selected.pax}<br><br>

    <strong>👤 Client :</strong><br>
    ${document.getElementById("lastName").value} ${document.getElementById("firstName").value}<br>
    📧 ${document.getElementById("email").value}<br>
    📞 ${document.getElementById("phone").value}<br><br>

    <strong>Remarques :</strong><br>
    Enfants : ${selected.kids}<br>
    Végétariens : ${selected.veg}<br>
    Occasion spéciale : ${selected.celebration ? "Oui" : "Non"}<br>
    Commentaire : ${selected.comment || "—"}
  `;

    document.getElementById("summaryAll").innerHTML = html;
    showStep(4);
};

/* ========= Step4 — 送信(JSON) ========== */
document.getElementById("back3").onclick = () => showStep(3);

document.getElementById("sendReservation").onclick = async () => {

    const btn = document.getElementById("sendReservation");
    btn.disabled = true;
    btn.textContent = "Envoi…";

    document.getElementById("loadingOverlay").style.display = "flex";

    const payload = {
        date: selected.date,
        service: selected.service,
        arrivalTime: selected.time,
        lastName: document.getElementById("lastName").value,
        firstName: document.getElementById("firstName").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        pax: selected.pax,
        kidsCount: selected.kids,
        celebration: selected.celebration,
        vegCount: selected.veg,
        comment: selected.comment,
        optin: document.getElementById("optin").checked
    };

    try {
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        document.getElementById("loadingOverlay").style.display = "none";
        document.getElementById("finalMessage").innerText = JSON.stringify(json);

        showStep(5);

    } catch (err) {
        document.getElementById("loadingOverlay").style.display = "none";
        document.getElementById("finalMessage").innerText = "Erreur réseau";
        showStep(5);
    }
};
