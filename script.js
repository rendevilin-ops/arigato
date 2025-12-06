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

/* Step4 — API送信 */
document.getElementById("back3").onclick = () => showStep(3);

document.getElementById("sendReservation").onclick = async () => {

    const btn = document.getElementById("sendReservation");
    btn.disabled = true;
    btn.innerText = "Envoi…";

    document.getElementById("loadingOverlay").style.display = "flex";

    // ★★★ 日付を100%安定フォーマットに成型する（最重要）★★★
    let fixedDate = selected.date;

    // 念のため「YYYY-MM-DD」以外の形なら強制変換
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fixedDate)) {
        const d = new Date(selected.date);
        fixedDate = d.toISOString().split("T")[0];   // yyyy-mm-dd のみ取り出し
    }

    // ★ arrivalTime も安全のため String に強制
    const fixedTime = String(selected.time);

    // ★ payload 作成
    const payload = {
        date: fixedDate,                    // ← 安定した yyyy-mm-dd の文字列
        service: selected.service,
        arrivalTime: fixedTime,             // ← "12:00" のような文字列
        lastName: document.getElementById("lastName").value.trim(),
        firstName: document.getElementById("firstName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        pax: Number(selected.pax),
        kidsCount: Number(selected.kids),
        celebration: Boolean(selected.celebration),
        vegCount: Number(selected.veg || 0),
        comment: selected.comment?.trim() || "",
        optin: document.getElementById("optin").checked
    };

    console.log("PAYLOAD_SENT", payload); // ← デバッグ用

    const apiUrl =
        "https://script.google.com/macros/s/AKfycbxbEd0aMwJhEv0vfndo5diSulj64o2GgdKGdNGPRdH4YA1wPX5tIArinqAyReNjwDdGcA/exec";

    const formData = new FormData();
    formData.append("json", JSON.stringify(payload));

    try {
        const res = await fetch(apiUrl, {
            method: "POST",
            body: formData
        });

        const json = await res.json();

        document.getElementById("loadingOverlay").style.display = "none";

        if (json.status === "ok") {
            document.getElementById("finalMessage").innerText =
                "Votre réservation a été envoyée. Merci beaucoup ! 🙏";
        } else {
            document.getElementById("finalMessage").innerText =
                "Erreur : " + json.message;
        }

        showStep(5);

    } catch (err) {
        document.getElementById("loadingOverlay").style.display = "none";

        document.getElementById("finalMessage").innerText =
            "Erreur réseau. Veuillez réessayer.";
        showStep(5);
    }
};













