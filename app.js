const riskForm = document.querySelector("#riskForm");
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

const value = (name) => new FormData(riskForm).get(name);

// effect 为经过证据稳定性收缩后的 log(OR) 贡献；弱证据只做轻微修正。
const EVIDENCE = {
  actual_location: {
    mainland: [0.04, "本人在中国大陆", "弱证据"],
    taiwan: [-0.04, "本人在台湾", "弱证据"],
    us_ca: [-0.04, "本人在美国或加拿大", "弱证据"],
    other_supported: [-0.04, "本人在其他支持地区", "弱证据"],
    other: [0.04, "本人在其他地区", "弱证据"],
  },
  account_age: {
    under_7d: [0.12, "账号使用 7 天以内", "探索性"],
    under_1m: [0.08, "账号使用不足 1 个月", "探索性"],
    "1_6m": [0.63, "账号使用 1–6 个月", "较强证据"],
    "6_12m": [-0.18, "账号使用 6–12 个月", "探索性"],
    over_1y: [-0.12, "账号使用超过 1 年", "探索性"],
  },
  unproxied: {
    never: [-0.08, "确认没有发生代理失效", "弱证据"],
    possible: [0.78, "可能发生过代理失效", "较强证据"],
    repeated: [0.12, "明确发生过多次代理失效", "结果不稳定"],
    unknown: [0.18, "不确定代理是否失效过", "探索性"],
    not_applicable: [-0.05, "不需要代理", "弱证据"],
  },
  node_region: {
    singapore: [0.36, "主要使用新加坡节点", "探索性"],
    us_ca: [-0.05, "主要使用美国或加拿大节点", "弱证据"],
    japan: [-0.03, "主要使用日本节点", "弱证据"],
    taiwan: [-0.05, "主要使用台湾节点", "弱证据"],
    other: [0.03, "使用其他或多个地区节点", "弱证据"],
    not_applicable: [-0.04, "不使用代理节点", "弱证据"],
  },
  node_type: {
    residential: [0.02, "家宽或住宅 IP", "弱证据"],
    datacenter: [-0.27, "机房或数据中心 IP", "中等证据"],
    organization: [0.49, "公司、学校或机构网络", "小样本"],
    unknown: [0.12, "不清楚节点类型", "探索性"],
    not_applicable: [-0.04, "不使用代理节点", "弱证据"],
  },
  node_sharing: {
    private: [-0.2, "私人独享节点", "探索性"],
    small: [-0.04, "少量固定用户共享", "弱证据"],
    large: [0.08, "大量用户共享节点", "弱证据"],
    unknown: [0.06, "不清楚节点共享情况", "弱证据"],
    not_applicable: [-0.04, "不使用代理节点", "弱证据"],
  },
  timezone_match: {
    actual: [0.02, "时区与本人所在地一致", "未见稳定关联"],
    proxy: [-0.02, "时区与代理出口一致", "未见稳定关联"],
    both: [-0.03, "所在地与代理出口时区相同", "未见稳定关联"],
    neither: [0.04, "时区与两边都不一致", "未见稳定关联"],
    unknown: [0.03, "不清楚设备时区", "未见稳定关联"],
  },
  google_region: {
    us_ca: [-0.49, "Google 地区为美国或加拿大", "小样本"],
    taiwan: [-0.03, "Google 地区为台湾", "弱证据"],
    other: [0.03, "Google 地区为其他地区", "弱证据"],
    unknown: [0.05, "不清楚 Google 地区", "弱证据"],
    not_google: [0.02, "不使用 Google 登录", "弱证据"],
  },
  fingerprint_browser: {
    never: [-0.21, "从未使用指纹浏览器", "探索性"],
    fixed: [0.03, "使用固定的指纹浏览器环境", "弱证据"],
    changed: [0.08, "指纹浏览器环境有变化", "弱证据"],
    unknown: [0.05, "不确定是否使用过指纹浏览器", "弱证据"],
  },
  payment_method: {
    own: [-0.35, "本人支付", "接近显著"],
    app_store: [-0.04, "通过应用商店付款", "弱证据"],
    third_party: [0.08, "第三方代充或成品号", "未见稳定关联"],
    shared: [0.06, "他人代付或共享付款方式", "未见稳定关联"],
    free: [0.03, "免费套餐", "未见稳定关联"],
  },
  access_mode: {
    web: [0.02, "主要使用浏览器网页", "未见稳定关联"],
    desktop: [0.02, "主要使用电脑端软件", "未见稳定关联"],
    mobile: [-0.02, "主要使用移动端 App", "未见稳定关联"],
    code: [-0.02, "主要使用 Claude Code 或终端", "未见稳定关联"],
    ide: [0.02, "主要使用 IDE 或编辑器", "未见稳定关联"],
    mixed: [0.04, "多个入口混用", "未见稳定关联"],
  },
};

const REQUIRED = Object.keys(EVIDENCE);
const INDEX_TEMPERATURE = 0.6;

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

function factorMarkup({ effect, title, tier }) {
  const direction = effect > 0.06 ? "↑" : effect < -0.06 ? "↓" : "≈";
  const tone =
    effect > 0.06 ? "risk-up" : effect < -0.06 ? "risk-down" : "risk-flat";
  return `<strong><em class="${tone}">${direction}</em>${title}<small>${tier}</small></strong>`;
}

function computeRisk(answers) {
  const contributions = Object.entries(answers).map(([name, answer]) => {
    const [effect, title, tier] = EVIDENCE[name][answer];
    return { effect, title, tier };
  });
  const latent = contributions.reduce((sum, item) => sum + item.effect, 0);
  const score = Math.round(100 / (1 + Math.exp(-latent * INDEX_TEMPERATURE)));
  const ranked = [...contributions].sort(
    (a, b) => Math.abs(b.effect) - Math.abs(a.effect),
  );
  const meaningful = contributions.filter(
    (item) => Math.abs(item.effect) >= 0.2,
  ).length;
  const evidenceLevel =
    meaningful >= 3 ? "中等" : meaningful >= 1 ? "有限" : "探索性";
  const advice = [];
  if (answers.unproxied === "possible" || answers.unproxied === "unknown") {
    advice.push("先确认代理断线后的行为，避免连接状态不明时继续访问。");
  }
  if (
    answers.payment_method === "third_party" ||
    answers.payment_method === "shared"
  ) {
    advice.push(
      "保存付款来源和账单信息。支付方式目前只有探索性证据，不必仅因传言换号。",
    );
  }
  if (!advice.length)
    advice.push("没有需要立刻调整的项目，继续按实际情况使用即可。");
  advice.push(
    "中文、Claude Code 和高用量目前没有稳定风险差异，不必为迎合传言改变习惯。",
  );

  const label =
    score >= 66
      ? "风险方向较集中"
      : score >= 55
        ? "有几项值得留意"
        : score <= 39
          ? "较低风险方向较多"
          : "风险与保护方向接近";
  const meaning =
    score >= 66
      ? "几项证据权重较高的风险方向同时出现。先看具体项目，再决定是否需要调整。"
      : score >= 55
        ? "有少数风险方向值得检查，但指数不能预测账号一定会不会异常。"
        : score <= 39
          ? "你的回答更接近样本中风险较低的几类账号，但这不是安全保证。"
          : "风险升高和降低方向大致相抵，目前看不出明显倾向。";
  return {
    score,
    label,
    meaning,
    evidenceLevel,
    primaryFactors: ranked.slice(0, 4).map(factorMarkup),
    secondaryFactors: ranked.slice(4).map(factorMarkup),
    advice,
  };
}

riskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const answers = Object.fromEntries(
    REQUIRED.map((name) => [name, value(name)]),
  );
  const missing = REQUIRED.filter((name) => !answers[name]);
  formError.hidden = missing.length === 0;
  if (missing.length) {
    document.querySelector(`[name="${missing[0]}"]`).focus();
    return;
  }
  const risk = computeRisk(answers);
  document.querySelector("#riskLabel").textContent = risk.label;
  document.querySelector("#riskScore").textContent = risk.score;
  document.querySelector("#riskMeaning").textContent = risk.meaning;
  document.querySelector("#evidenceLevel").textContent = risk.evidenceLevel;
  document.querySelector("#factorList").innerHTML = risk.primaryFactors
    .map((item) => `<li>${item}</li>`)
    .join("");
  document.querySelector("#secondaryFactorList").innerHTML =
    risk.secondaryFactors.map((item) => `<li>${item}</li>`).join("");
  document.querySelector("#adviceList").innerHTML = risk.advice
    .map((item) => `<li>${item}</li>`)
    .join("");
  resultSection.hidden = false;
  participation.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

renderStep();
