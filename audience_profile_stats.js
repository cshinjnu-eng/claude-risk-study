window.SIMILARITY_DATA = {
  updated_at: "2026-07-10T13:03:26.193019+00:00",
  responses: 289,
  eligible: 287,
  events: 177,
  overall_rate: 0.6167,
  groups: [
    {
      keys: ["actual_location", "account_age", "unproxied", "node_type"],
      values: {
        "mainland|1_6m|never|residential": { n: 15, events: 12, rate: 0.8 },
        "mainland|1_6m|possible|unknown": { n: 17, events: 14, rate: 0.8235 },
        "mainland|1_6m|possible|datacenter": {
          n: 19,
          events: 12,
          rate: 0.6316,
        },
        "mainland|1_6m|never|datacenter": { n: 12, events: 5, rate: 0.4167 },
      },
    },
    {
      keys: ["account_age", "unproxied", "node_type"],
      values: {
        "1_6m|never|residential": { n: 16, events: 13, rate: 0.8125 },
        "1_6m|possible|unknown": { n: 17, events: 14, rate: 0.8235 },
        "1_6m|possible|residential": { n: 10, events: 7, rate: 0.7 },
        "1_6m|possible|datacenter": { n: 26, events: 17, rate: 0.6538 },
        "1_6m|never|datacenter": { n: 14, events: 6, rate: 0.4286 },
        "1_6m|never|unknown": { n: 10, events: 8, rate: 0.8 },
      },
    },
    {
      keys: ["account_age", "unproxied", "payment_method"],
      values: {
        "1_6m|never|free": { n: 23, events: 17, rate: 0.7391 },
        "1_6m|possible|app_store": { n: 25, events: 15, rate: 0.6 },
        "1_6m|possible|third_party": { n: 13, events: 9, rate: 0.6923 },
        "1_6m|possible|free": { n: 19, events: 14, rate: 0.7368 },
        "1_6m|never|third_party": { n: 10, events: 8, rate: 0.8 },
        "1_6m|never|app_store": { n: 16, events: 10, rate: 0.625 },
      },
    },
    {
      keys: ["account_age", "unproxied"],
      values: {
        "1_6m|never": { n: 63, events: 46, rate: 0.7302 },
        "over_1y|never": { n: 18, events: 9, rate: 0.5 },
        "6_12m|possible": { n: 10, events: 5, rate: 0.5 },
        "under_1m|possible": { n: 15, events: 9, rate: 0.6 },
        "1_6m|possible": { n: 69, events: 50, rate: 0.7246 },
        "1_6m|repeated": { n: 24, events: 9, rate: 0.375 },
        "under_1m|never": { n: 18, events: 9, rate: 0.5 },
        "6_12m|never": { n: 13, events: 7, rate: 0.5385 },
        "over_1y|possible": { n: 12, events: 7, rate: 0.5833 },
      },
    },
    {
      keys: ["account_age"],
      values: {
        "1_6m": { n: 164, events: 110, rate: 0.6707 },
        over_1y: { n: 42, events: 21, rate: 0.5 },
        "6_12m": { n: 33, events: 16, rate: 0.4848 },
        under_1m: { n: 38, events: 21, rate: 0.5526 },
      },
    },
    {
      keys: ["unproxied", "node_type"],
      values: {
        "not_applicable|not_applicable": { n: 13, events: 6, rate: 0.4615 },
        "never|residential": { n: 30, events: 22, rate: 0.7333 },
        "possible|residential": { n: 14, events: 8, rate: 0.5714 },
        "possible|unknown": { n: 28, events: 21, rate: 0.75 },
        "repeated|datacenter": { n: 16, events: 3, rate: 0.1875 },
        "never|unknown": { n: 21, events: 16, rate: 0.7619 },
        "possible|datacenter": { n: 40, events: 25, rate: 0.625 },
        "never|datacenter": { n: 37, events: 16, rate: 0.4324 },
        "repeated|residential": { n: 10, events: 3, rate: 0.3 },
      },
    },
    {
      keys: ["unproxied"],
      values: {
        never: { n: 118, events: 77, rate: 0.6525 },
        possible: { n: 107, events: 72, rate: 0.6729 },
        repeated: { n: 43, events: 17, rate: 0.3953 },
        not_applicable: { n: 13, events: 6, rate: 0.4615 },
      },
    },
    {
      keys: ["node_type"],
      values: {
        organization: { n: 15, events: 14, rate: 0.9333 },
        not_applicable: { n: 13, events: 6, rate: 0.4615 },
        unknown: { n: 61, events: 45, rate: 0.7377 },
        residential: { n: 55, events: 33, rate: 0.6 },
        datacenter: { n: 93, events: 44, rate: 0.4731 },
      },
    },
    {
      keys: ["payment_method"],
      values: {
        free: { n: 82, events: 56, rate: 0.6829 },
        shared: { n: 16, events: 11, rate: 0.6875 },
        third_party: { n: 41, events: 27, rate: 0.6585 },
        app_store: { n: 85, events: 43, rate: 0.5059 },
        own: { n: 23, events: 10, rate: 0.4348 },
      },
    },
    {
      keys: ["actual_location"],
      values: {
        other_supported: { n: 20, events: 10, rate: 0.5 },
        mainland: { n: 247, events: 152, rate: 0.6154 },
        us_ca: { n: 13, events: 11, rate: 0.8462 },
      },
    },
  ],
  match_coverage: { 4: 63, 3: 62, 2: 127, 1: 35 },
  low_event_profiles: [
    { dimension: "账号年龄", label: "6–12 个月", n: 33, rate: 0.4848 },
    { dimension: "网络类型", label: "机房或数据中心 IP", n: 93, rate: 0.4731 },
    {
      dimension: "节点共享",
      label: "固定少数人共用（约 2–10 人）",
      n: 19,
      rate: 0.3158,
    },
    {
      dimension: "付款方式",
      label: "本人银行卡或本人长期使用的支付账号",
      n: 23,
      rate: 0.4348,
    },
  ],
};
