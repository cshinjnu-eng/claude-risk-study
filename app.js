const API_ENDPOINT = window.RISK_STUDY_API || "/api/submissions";
const riskForm = document.querySelector("#riskForm");
const researchForm = document.querySelector("#researchForm");
const resultSection = document.querySelector("#result");
const participation = document.querySelector("#participation");
const riskSteps = [...riskForm.querySelectorAll(":scope > fieldset")];
const prevStep = document.querySelector("#prevStep");
const nextStep = document.querySelector("#nextStep");
const submitRisk = riskForm.querySelector(".submit-risk");
const stepCount = document.querySelector("#stepCount");
const stepBar = document.querySelector("#stepBar");
const formError = document.querySelector("#formError");
let currentStep = 0;
let latestAssessment = null;

const value = (form, name) => new FormData(form).get(name);
const values = (form, name) => new FormData(form).getAll(name);

function renderStep() {
  riskSteps.forEach((step, index) => {
    step.hidden = index !== currentStep;
  });
  prevStep.hidden = currentStep === 0;
  nextStep.hidden = currentStep === riskSteps.length - 1;
  submitRisk.hidden = currentStep !== riskSteps.length - 1;
  stepCount.textContent = `问题 ${currentStep + 1} / ${riskSteps.length}`;
  stepBar.style.width = `${((currentStep + 1) / riskSteps.length) * 100}%`;
  formError.hidden = true;
}

function currentStepAnswered() {
  return Boolean(riskSteps[currentStep].querySelector("input:checked"));
}

nextStep.addEventListener("click", () => {
  if (!currentStepAnswered()) {
    formError.hidden = false;
    riskSteps[currentStep].querySelector("input").focus();
    return;
  }
  currentStep += 1;
  renderStep();
  riskSteps[currentStep].querySelector("input").focus();
});

prevStep.addEventListener("click", () => {
  currentStep = Math.max(0, currentStep - 1);
  renderStep();
  riskSteps[currentStep].querySelector("input").focus();
});

function computeRisk(answers) {
  let points = 0;
  const factors = [];
  const advice = [];

  const add = (amount, title, detail) => {
    points += amount;
    const sign = amount > 0 ? `+${amount}` : `${amount}`;
    const tone = amount > 0 ? "risk-up" : "risk-down";
    factors.push(
      `<strong><em class="${tone}">${sign}</em>${title}</strong>${detail}`,
    );
  };

  if (
    answers.actual_location === "mainland" &&
    answers.proxy_use !== "never" &&
    answers.unproxied === "possible"
  ) {
    add(
      3,
      "代理可能失效过",
      "调查中，这类账号的每日异常风险比约为 2.18。你的所在地和使用方式也符合这道题原本对应的场景。",
    );
    advice.push("检查代理断线后的行为，避免连接状态不明时继续访问。");
  } else if (answers.unproxied === "possible") {
    factors.push(
      "<strong><em>0</em>代理可能失效过</strong>你的使用场景和主要样本人群不同，暂不把这项算进分数。",
    );
  } else if (answers.unproxied === "unknown") {
    factors.push(
      "<strong><em>0</em>连接状态不确定</strong>目前无法判断是否发生过代理失效。",
    );
  }

  if (answers.account_age === "1_6m") {
    add(2, "账号使用 1–6 个月", "样本中的每日异常风险比约为 1.87。");
  }

  if (answers.node_region === "singapore") {
    add(
      2,
      "主要使用新加坡节点",
      "这组账号在预设分析中风险较高；全变量扫描后的证据较弱，因此只作为次级信号。",
    );
  }

  if (answers.node_type === "organization") {
    add(
      2,
      "公司、学校或机构网络",
      "样本中的风险方向较高，但该组只有 10 个账号，结果不够稳定。",
    );
  } else if (answers.node_type === "datacenter") {
    add(
      -1,
      "机房或数据中心 IP",
      "样本中呈较低风险方向。这是观察结果，不代表机房 IP 本身更安全。",
    );
  }

  if (answers.google_region === "us_ca") {
    add(
      -2,
      "Google 地区为美国或加拿大",
      "样本中呈较低风险方向，但有效样本很少，只能谨慎参考。",
    );
  }

  if (answers.fingerprint_browser === "never") {
    add(
      -1,
      "从未使用指纹浏览器",
      "预设分析中呈较低风险方向；全变量扫描没有重复出这一结果。",
    );
  }

  if (answers.node_sharing === "private") {
    add(
      -1,
      "私人独享节点",
      "预设分析中呈较低风险方向，但节点共享问题整体没有通过严格校正。",
    );
  }

  if (answers.payment_method === "own") {
    add(
      -1,
      "本人支付",
      "本人银行卡或长期使用的支付账号呈较低风险方向，校正后接近显著。",
    );
  } else {
    factors.push(
      "<strong><em>0</em>付款方式</strong>当前数据还不能证明代充、商店内购或免费套餐会改变每日异常风险。",
    );
  }

  factors.push(
    "<strong><em>0</em>时区与使用入口</strong>这两项目前没有稳定关联，不参与评分。",
  );

  if (!advice.length) {
    advice.push(
      "没有命中需要优先处理的强风险信号。继续按实际情况使用，不必为了迎合传言反复调整环境。",
    );
  }
  advice.push("低分只表示当前问卷里的较低风险方向更多，不代表账号一定安全。");

  const score = points;
  const label =
    points >= 5
      ? "风险方向较集中"
      : points >= 2
        ? "有几项值得留意"
        : points <= -2
          ? "较低风险方向较多"
          : "风险与保护方向接近";
  const meaning =
    points >= 5
      ? "你的回答同时命中了几项风险升高方向。先看下面的具体项目，再决定哪些地方值得调整。"
      : points >= 2
        ? "有少数风险方向值得检查，但这个分数不能预测账号一定会不会异常。"
        : points <= -2
          ? "你的回答更接近调查中风险较低的几类账号。这不是安全保证。"
          : "风险升高和降低方向大致相抵，目前看不出明显倾向。";
  return { score, label, meaning, points, factors, advice };
}

riskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const required = [
    "actual_location",
    "account_age",
    "proxy_use",
    "unproxied",
    "node_region",
    "node_type",
    "node_sharing",
    "timezone_match",
    "google_region",
    "fingerprint_browser",
    "payment_method",
    "access_mode",
  ];
  const answers = Object.fromEntries(
    required.map((name) => [name, value(riskForm, name)]),
  );
  const missing = required.filter((name) => !answers[name]);
  formError.hidden = missing.length === 0;
  if (missing.length) {
    document.querySelector(`[name="${missing[0]}"]`).focus();
    return;
  }
  const risk = computeRisk(answers);
  latestAssessment = {
    answers,
    risk: { score: risk.score, label: risk.label, points: risk.points },
  };
  document.querySelector("#riskLabel").textContent = risk.label;
  document.querySelector("#riskScore").textContent =
    risk.score > 0 ? `+${risk.score}` : risk.score;
  document.querySelector("#riskMeaning").textContent = risk.meaning;
  document.querySelector("#factorList").innerHTML = risk.factors
    .map((x) => `<li>${x}</li>`)
    .join("");
  document.querySelector("#adviceList").innerHTML = risk.advice
    .map((x) => `<li>${x}</li>`)
    .join("");
  resultSection.hidden = false;
  participation.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll('[name="consent_mode"]').forEach((input) =>
  input.addEventListener("change", () => {
    researchForm.hidden =
      document.querySelector('[name="consent_mode"]:checked').value !==
      "research";
  }),
);

document
  .querySelector('[name="auth_method"]')
  .addEventListener("change", (event) => {
    const google = event.target.value === "google";
    document.querySelector("#googleFields").hidden = !google;
    document
      .querySelectorAll("#googleFields select")
      .forEach((select) => (select.required = google));
  });

function extendedPayload() {
  return {
    access_modes: values(researchForm, "access_modes"),
    auth_method: value(researchForm, "auth_method"),
    quota_usage: value(researchForm, "quota_usage"),
    google_phone_type: value(researchForm, "google_phone_type") || null,
    google_phone_region: value(researchForm, "google_phone_region") || null,
    google_legal_region: value(researchForm, "google_legal_region") || null,
    payment_method: latestAssessment.answers.payment_method,
    fingerprint_browser: latestAssessment.answers.fingerprint_browser,
    use_cases: values(researchForm, "use_cases"),
  };
}

researchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.querySelector("#submitStatus");
  if (!latestAssessment) return;
  if (!researchForm.reportValidity()) return;
  const button = document.querySelector("#sendResearch");
  button.disabled = true;
  status.textContent = "正在提交…";
  const payload = {
    consent: true,
    consent_version: "prototype-2026-07-05-v1",
    schema_version: "risk-checker-v3",
    assessment: latestAssessment.answers,
    derived_risk: latestAssessment.risk,
    extended: extendedPayload(),
  };
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "提交失败");
    status.textContent = `提交成功。匿名编号：${data.submission_id}`;
    button.textContent = "已提交";
  } catch (error) {
    status.textContent = `未能提交：${error.message}。你的评估结果不受影响。`;
    button.disabled = false;
  }
});

renderStep();
