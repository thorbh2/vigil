"""Seed VIGIL with real on-chain data on studionet."""
from pathlib import Path

from gltest_cli.config.general import get_general_config
from gltest_cli.config.user import load_user_config
from gltest import get_contract_factory, get_default_account

ROOT = Path(__file__).resolve().parents[1]
ADDR = "0x23C699011524BB6e0D6228580D344B28665641d3"
GEN = 10 ** 18
URL = "https://example.com"
RECIP = "0x431ACf85256AFcb3A8c66aff96b923366D5DdaC2"

cfg = load_user_config(str(ROOT / "gltest.config.yaml"))
get_general_config().user_config = cfg
c = get_contract_factory(contract_file_path=str(ROOT / "contracts" / "vigil.py")).build_contract(
    ADDR, account=get_default_account())

WATCHES = [
    ("Reference-domain monitor",
     "The page states that the domain is for use in illustrative examples in documents",
     3 * GEN),  # fires (true)
    ("Flash-sale alert payout",
     "The page is currently showing a live flash sale with discounted prices",
     2 * GEN),  # stays armed (false)
]


def main():
    if c.get_watch_count().call() == 0:
        for (name, cond, amount) in WATCHES:
            c.create_watch(args=[name, URL, cond, RECIP]).transact(value=amount)
            print("created:", name)
    for wid in (0, 1):
        w = c.get_watch(args=[wid]).call()
        if int(w["status"]) == 0:
            print("checking", wid, "(AI)...")
            try:
                c.check(args=[wid]).transact()
            except Exception as e:
                print("check", wid, "->", e)
    for wid in (0, 1):
        w = c.get_watch(args=[wid]).call()
        print(wid, ["ARMED", "FIRED", "DISARMED"][int(w["status"])], "checks=", w["checks"], "|", (w["last_result"] or "")[:64])


if __name__ == "__main__":
    main()
