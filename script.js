/* ページ切り替え */
function showStep(n) {
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    document.getElementById("step" + n).classList.add("active");
}

/* データ保持 */
const selected = { date: null, service: null, time: null, pax: null };

/* availability.json を読み込み */
async function updateServiceAvailability() {

    console.log("=== Availability Check Start ===");

    const date = document.getElementById("resDate").value;
    console.log("Selected date:", date);

    if (!date) return;


    /* Availability 取得先 */
    const url = "https://welcome-ray-31994.upstash.io/get/availability";

    let json;
    try {
        console.log("Fetching Upstash:", url);

        const res = await fetch(url, {
            headers: {
                "Authorization": "Bearer AXz6AAIncDI4ZDc5YjAxYTg3NTA0NjI0OTk2ZWNiOTRlNGI1NTE2OXAyMzE5OTQ"
            },
            cache: "no-store"
        });

        console.log("Fetch status:", res.status);

        const apiData = await res.json();
        console.log("Upstash raw:", apiData);

        // Upstash は { result: "JSONString" }
        json = JSON.parse(apiData.result);

        console.log("Parsed JSON:", json);

    } catch (e) {
        console.error("ERROR loading JSON from Upstash:", e);
        forceAvailable();
        return;
    }


    /* Safety check */
    if (!json || !json.availability) {
        console.error("JSON format unexpected. json.availability NOT found.");
        forceAvailable();
        return;
    }

    const list = json.availability;
    console.log("Availability list:", list);


    const lunch = list.find(a => a.Date === date && a.Service === "lunch");
    const dinner = list.find(a => a.Date === date && a.Service === "dinner");

    console.log("Matched lunch:", lunch);
    console.log("Matched dinner:", dinner);

    updateStatus("lunch", lunch);
    updateStatus("dinner", dinner);
}

function updateStatus(service, data) {
    console.log(`Updating UI for ${service}`, data);

    const statusEl = document.getElementById(`status-${service}`);
    const btn = document.querySelector(`button[data-service="${service}"]`);

    if (!statusEl || !btn) return;

    // グローバルに保存する（必ず毎回セットされる）
    if (service === "lunch") window.currentLunchData = data || { Availability: 7 };
    if (service === "dinner") window.currentDinnerData = data || { Availability: 7 };

    const seats = data ? Number(data.Availability) : 7;

    if (seats > 0) {
        statusEl.textContent = `Disponible (${seats} places)`;
        btn.disabled = false;
        btn.classList.remove("disabled");
    } else {
        statusEl.textContent = "Indisponible";
        btn.disabled = true;
        btn.classList.add("disabled");
    }

    // 現在選択中の service に対して人数制限を即反映
    if (selected.service === service) {
        updatePaxLimit(seats);
    }
}


function forceAvailable() {
    console.warn("Fallback: marking all available");

    ["lunch", "dinner"].forEach(service => {
        const statusEl = document.getElementById(`status-${service}`);
        const btn = document.querySelector(`button[data-service="${service}"]`);
        if (statusEl) statusEl.textContent = "Disponible (? places)";
        if (btn) {
            btn.disabled = false;
            btn.classList.remove("disabled");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateServiceAvailability();
});

document.getElementById("resDate").addEventListener("change", updateServiceAvailability);

/* Step1 — 日付 */
function setToday() {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;

    const dateInput = document.getElementById("resDate");

    dateInput.value = today;  // 初期値
    dateInput.min = today;    // ← 過去日をカレンダーで選べなくする
}
setToday();

document.getElementById("prevDate").onclick = () => changeDate(-1);
document.getElementById("nextDate").onclick = () => changeDate(1);

function changeDate(d) {
    const input = document.getElementById("resDate");
    const current = new Date(input.value);

    current.setDate(current.getDate() + d);

    const today = new Date();
    today.setHours(0,0,0,0);

    // 過去には戻らせない
    if (current < today) return;

    input.value = current.toISOString().split("T")[0];
    updateServiceAvailability();
}

/* 人数プルダウンの制限 */
function updatePaxLimit(seats) {
    const paxSelect = document.getElementById("resPax");

    // 一旦全部消して作り直す
    paxSelect.innerHTML = "";

    // seats が null や undefined の場合は 7 固定で作る
    const max = seats > 0 ? seats : 0;

    if (max === 0) {
        // 空席が 0 の場合は選択不可 (option にメッセージだけ表示)
        const opt = document.createElement("option");
        opt.textContent = "0 (complet)";
        opt.value = 0;
        paxSelect.appendChild(opt);
        paxSelect.disabled = true;
        return;
    }

    paxSelect.disabled = false;

    for (let i = 1; i <= max; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        paxSelect.appendChild(opt);
    }
}

/* Step1 — Service & Time */
document.querySelectorAll(".service-btn").forEach(btn => {
    btn.onclick = () => {
        selected.service = btn.dataset.service;
        document.querySelectorAll(".service-btn").forEach(b => b.style.background = "");
        btn.style.background = "#ccc";
        
        updateTimeButtons();
    
        // サービス選択後、Availability に応じて人数制限も更新
        const statusData = (btn.dataset.service === "lunch")
            ? currentLunchData
            : currentDinnerData;
    
        if (statusData) {
            updatePaxLimit(Number(statusData.Availability));
        }
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
        "https://n8n-sab.onrender.com/webhook/arigato-reservation";

    const formData = new FormData();
    formData.append("json", JSON.stringify(payload));

    try {
        const res = await fetch(apiUrl, {
            method: "POST",
            body: formData
        });

    const json = await res.json();
    
    document.getElementById("loadingOverlay").style.display = "none";
    
    // ★ n8n のデフォルト応答 "Workflow was started" をキャッチ
    if (json.message === "Workflow was started") {
        document.getElementById("finalMessage").innerText =
            "Votre réservation a bien été envoyée.\n" +
            "Nous traitons votre demande.\n" +
            "Merci de vérifier votre e-mail de confirmation.";
        showStep(5);
        return;
    }
    
    // ★ 普通の成功レスポンス
    if (json.status === "ok") {
        document.getElementById("finalMessage").innerText =
            "Votre réservation a été envoyée. Merci beaucoup ! 🙏";
    } else {
        document.getElementById("finalMessage").innerText =
            "Erreur : " + (json.message || "Une erreur est survenue.");
    }
    
    showStep(5);


        showStep(5);

    } catch (err) {
        document.getElementById("loadingOverlay").style.display = "none";

        document.getElementById("finalMessage").innerText =
            "Erreur réseau. Veuillez réessayer.";
        showStep(5);
    }
};










































