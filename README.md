# Claude 使用风险自测

面向中文 Claude 用户的独立调查工具。页面根据 2026-06-24 之后收集的问卷，显示样本中的风险方向、较低风险方向和当前没有证据的常见说法。

## 重要口径

- 分数是以 50 为中性点的“证据加权指数”，不是个人封号概率。
- 日期调整 OR 会按多重校正、样本量和稳定性收缩；弱证据只做轻微修正。
- 结果来自自愿填写样本，只能说明相关性。
- 连坐、申诉和主观封号原因等事后变量不进入评分。
- 完整题目和计分依据见 [`SCORING_SPEC.md`](SCORING_SPEC.md)。

## 本地运行

```bash
HOST=127.0.0.1 PORT=8780 python3 server.py
```

打开 `http://127.0.0.1:8780`。快速测试只在浏览器中计算，不上传答案。结果页提供飞书完整问卷二维码。

## 数据文件

仓库不包含原始问卷、账号资料或服务器凭据。

## 主要文件

- `index.html`：风险自测与研究发现
- `app.js`：逐题交互、证据指数、相似人群和结果解释
- `audience_profile_stats.js`：飞书短版问卷生成的匿名聚合相似人群统计
- `scripts/build_similarity_data.py`：刷新相似人群统计的生成脚本
- `server.py`：静态文件与提交接口
- `promo-poster.png`：宣传海报
- `posters/study-20260710.html`：四页小红书宣传图文源文件
- `posters/01-cover.png` 至 `posters/04-method-and-qr.png`：四页宣传图成品
- `assets/risk-checker-qr.png`：指向风险自测网站的二维码
- `assets/findings/`：可单独发布的研究图文
