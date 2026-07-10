#!/usr/bin/env python3
"""Build privacy-preserving aggregate similarity statistics from Feishu."""

from __future__ import annotations

import json
import os
import subprocess
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


BASE_TOKEN = os.environ["FEISHU_BASE_TOKEN"]
TABLE_ID = os.environ["FEISHU_SHORT_TABLE_ID"]
OUT = Path(__file__).resolve().parents[1] / "audience_profile_stats.js"


def fetch_rows() -> list[list]:
    rows = []
    for offset in range(0, 2000, 200):
        output = subprocess.check_output(
            [
                "feishu-cli",
                "bitable",
                "record",
                "list",
                "--base-token",
                BASE_TOKEN,
                "--table-id",
                TABLE_ID,
                "--limit",
                "200",
                "--offset",
                str(offset),
                "--as",
                "bot",
            ],
            text=True,
        )
        page = json.loads(output)["data"]
        rows.extend(page)
        if len(page) < 200:
            break
    return rows


def text(value) -> str:
    if isinstance(value, list):
        return "｜".join(map(str, value))
    return str(value or "")


def outcome(row: list) -> int | None:
    status = text(row[37])
    if "正常使用" in status:
        return 0
    if any(key in status for key in ("当前账号被封", "使用受限", "曾被封或受限")):
        return 1
    return None


def map_profile(row: list) -> dict[str, str | None]:
    location = text(row[28])
    if "中国大陆" in location:
        location = "mainland"
    elif "台湾" in location:
        location = "taiwan"
    elif "美国或加拿大" in location:
        location = "us_ca"
    elif location:
        location = "other_supported"
    else:
        location = None

    age = text(row[17])
    age_map = {
        "7 天以内": "under_7d",
        "1 个月以内": "under_1m",
        "1–6 个月": "1_6m",
        "6–12 个月": "6_12m",
        "1–3 年": "over_1y",
        "3 年以上": "over_1y",
    }

    unproxied = text(row[3])
    if unproxied == "从未":
        unproxied = "never"
    elif unproxied in ("可能发生过", "明确发生过一次"):
        unproxied = "possible"
    elif unproxied == "明确发生过多次":
        unproxied = "repeated"
    elif unproxied == "不确定":
        unproxied = "unknown"
    else:
        unproxied = None

    node_type = text(row[13])
    node_map = {
        "家宽或住宅 IP": "residential",
        "机房或数据中心 IP": "datacenter",
        "公司、学校或机构网络": "organization",
        "不知道": "unknown",
    }

    payment = text(row[31])
    if "本人银行卡" in payment:
        payment = "own"
    elif "Apple App Store" in payment:
        payment = "app_store"
    elif "第三方" in payment or "成品号" in payment or "代充" in payment:
        payment = "third_party"
    elif "他人代付" in payment or "共享付款" in payment:
        payment = "shared"
    elif "免费套餐" in payment:
        payment = "free"
    else:
        payment = None

    return {
        "actual_location": location,
        "account_age": age_map.get(age),
        "unproxied": unproxied,
        "node_type": node_map.get(node_type),
        "payment_method": payment,
    }


def aggregate(rows: list[dict], keys: list[str], minimum: int = 10) -> dict:
    groups: dict[tuple, list[int]] = defaultdict(list)
    for row in rows:
        values = tuple(row["profile"].get(key) for key in keys)
        if None not in values:
            groups[values].append(row["outcome"])
    return {
        "|".join(values): {
            "n": len(outcomes),
            "events": sum(outcomes),
            "rate": round(sum(outcomes) / len(outcomes), 4),
        }
        for values, outcomes in groups.items()
        if len(outcomes) >= minimum
    }


def low_event_profiles(source_rows: list[list], clear_rows: list[dict]) -> list[dict]:
    specs = [
        (17, "账号年龄"),
        (13, "网络类型"),
        (12, "节点共享"),
        (31, "付款方式"),
    ]
    output = []
    clear_source = [row for row in source_rows if outcome(row) is not None]
    for index, dimension in specs:
        groups: dict[str, list[int]] = defaultdict(list)
        for row in clear_source:
            label = text(row[index])
            if label:
                groups[label].append(outcome(row))
        eligible = [
            (label, values) for label, values in groups.items() if len(values) >= 10
        ]
        if not eligible:
            continue
        label, values = min(eligible, key=lambda item: sum(item[1]) / len(item[1]))
        output.append(
            {
                "dimension": dimension,
                "label": label,
                "n": len(values),
                "rate": round(sum(values) / len(values), 4),
            }
        )
    return output


def main() -> None:
    source_rows = fetch_rows()
    rows = [
        {"outcome": outcome(row), "profile": map_profile(row)}
        for row in source_rows
        if outcome(row) is not None
    ]
    specs = [
        ["actual_location", "account_age", "unproxied", "node_type"],
        ["account_age", "unproxied", "node_type"],
        ["account_age", "unproxied", "payment_method"],
        ["account_age", "unproxied"],
        ["account_age"],
    ]
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "responses": len(source_rows),
        "eligible": len(rows),
        "events": sum(row["outcome"] for row in rows),
        "overall_rate": round(sum(row["outcome"] for row in rows) / len(rows), 4),
        "groups": [{"keys": keys, "values": aggregate(rows, keys)} for keys in specs],
        "low_event_profiles": low_event_profiles(source_rows, rows),
    }
    OUT.write_text(
        "window.SIMILARITY_DATA = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(
        f"wrote {OUT.name}: {payload['responses']} responses, "
        f"{payload['eligible']} eligible, {len(payload['groups'])} group levels"
    )


if __name__ == "__main__":
    main()
