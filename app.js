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

const WEIGHTS = {
  actual_location: {
    mainland: [2, "本人在中国大陆"],
    taiwan: [-2, "本人在台湾"],
    us_ca: [-2, "本人在美国或加拿大"],
    other_supported: [-2, "本人在其他支持地区"],
    other: [2, "本人在其他地区"],
  },
  account_age: {
    under_7d: [5, "账号使用 7 天以内"],
    under_1m: [3, "账号使用不足 1 个月"],
    "1_6m": [8, "账号使用 1–6 个月"],
    "6_12m": [-3, "账号使用 6–12 个月"],
    over_1y: [-5, "账号使用超过 1 年"],
  },
  unproxied: {
    never: [-5, "确认没有发生代理失效"],
    possible: [12, "可能发生过代理失效"],
    repeated: [4, "明确发生过多次代理失效"],
    unknown: [6, "不确定代理是否失效过"],
    not_applicable: [-4, "不需要代理"],
  },
  node_region: {
    singapore: [8, "主要使用新加坡节点"],
    us_ca: [-2, "主要使用美国或加拿大节点"],
    japan: [-1, "主要使用日本节点"],
    taiwan: [-2, "主要使用台湾节点"],
    other: [1, "使用其他或多个地区节点"],
    not_applicable: [-2, "不使用代理节点"],
  },
  node_type: {
    residential: [1, "家宽或住宅 IP"],
    datacenter: [-4, "机房或数据中心 IP"],
    organization: [8, "公司、学校或机构网络"],
    unknown: [4, "不清楚节点类型"],
    not_applicable: [-2, "不使用代理节点"],
  },
  node_sharing: {
    private: [-4, "私人独享节点"],
    small: [-1, "少量固定用户共享"],
    large: [3, "大量用户共享节点"],
    unknown: [2, "不清楚节点共享情况"],
    not_applicable: [-2, "不使用代理节点"],
  },
  timezone_match: {
    actual: [1, "时区与本人所在地一致"],
    proxy: [-1, "时区与代理出口一致"],
    both: [-2, "所在地与代理出口时区相同"],
    neither: [3, "时区与两边都不一致"],
    unknown: [2, "不清楚设备时区"],
  },
  google_region: {
    us_ca: [-8, "Google 地区为美国或加拿大"],
    taiwan: [-1, "Google 地区为台湾"],
    other: [1, "Google 地区为其他地区"],
    unknown: [2, "不清楚 Google 地区"],
    not_google: [1, "不使用 Google 登录"],
  },
  fingerprint_browser: {
    never: [-4, "从未使用指纹浏览器"],
    fixed: [1, "使用固定的指纹浏览器环境"],
    changed: [4, "指纹浏览器环境有变化"],
    unknown: [2, "不确定是否使用过指纹浏览器"],
  },
  payment_method: {
    own: [-4, "本人支付"],
    app_store: [-1, "通过应用商店付款"],
    third_party: [3, "第三方代充或成品号"],
    shared: [2, "他人代付或共享付款方式"],
    free: [1, "免费套餐"],
  },
  access_mode: {
    web: [1, "主要使用浏览器网页"],
    desktop: [1, "主要使用电脑端软件"],
    mobile: [-1, "主要使用移动端 App"],
    code: [-1, "主要使用 Claude Code 或终端"],
    ide: [1, "主要使用 IDE 或编辑器"],
    mixed: [2, "多个入口混用"],
  },
};

const REQUIRED = Object.keys(WEIGHTS);
const RAW_MIN = -41;
const RAW_MAX = 55;

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
  const contributions = Object.entries(answers).map(([name, answer]) => {
    const [amount, title] = WEIGHTS[name][answer];
    return { amount, title };
  });
  const raw = contributions.reduce((sum, item) => sum + item.amount, 0);
  const score = Math.round(((raw - RAW_MIN) / (RAW_MAX - RAW_MIN)) * 100);
  const factors = contributions
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .map(({ amount, title }) => {
      const sign = amount > 0 ? `+${amount}` : `${amount}`;
      const tone = amount > 0 ? "risk-up" : "risk-down";
      return `<strong><em class="${tone}">${sign}</em>${title}</strong>`;
    });
  const advice = [];
  if (answers.unproxied === "possible" || answers.unproxied === "unknown") {
    advice.push("先确认代理断线后的行为，避免连接状态不明时继续访问。");
  }
  if (
    answers.payment_method === "third_party" ||
    answers.payment_method === "shared"
  ) {
    advice.push(
      "保存付款来源和账单信息。目前支付证据较弱，不必只因传言更换账号。",
    );
  }
  if (!advice.length)
    advice.push("没有需要立刻调整的项目，继续按实际情况使用即可。");
  advice.push("这是问卷证据分，不等于真实封号概率。");

  const label =
    score >= 71
      ? "风险方向较集中"
      : score >= 56
        ? "有几项值得留意"
        : score <= 35
          ? "较低风险方向较多"
          : "风险与保护方向接近";
  const meaning =
    score >= 71
      ? "几项权重较高的风险方向同时出现。先看下面的具体项目，再决定哪些地方值得调整。"
      : score >= 56
        ? "有少数风险方向值得检查，但这个分数不能预测账号一定会不会异常。"
        : score <= 35
          ? "你的回答更接近调查中风险较低的几类账号，但这不是安全保证。"
          : "风险升高和降低方向大致相抵，目前看不出明显倾向。";
  return { score, raw, label, meaning, factors, advice };
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
  document.querySelector("#factorList").innerHTML = risk.factors
    .map((item) => `<li>${item}</li>`)
    .join("");
  document.querySelector("#adviceList").innerHTML = risk.advice
    .map((item) => `<li>${item}</li>`)
    .join("");
  resultSection.hidden = false;
  participation.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

renderStep();
