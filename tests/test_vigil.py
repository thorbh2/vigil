"""Tests for VIGIL (direct runner). AI check() validated live on studionet."""
from pathlib import Path

CONTRACT = str(Path(__file__).resolve().parents[1] / "contracts" / "vigil.py")
GEN = 10 ** 18
W_ARMED = 0; W_FIRED = 1; W_DISARMED = 2
BOB = "0x" + "22" * 20


def _create(v, vm, who, name="Refund on outage", url="https://example.com",
            cond="The status page shows an outage", recipient=BOB, amount=3):
    vm.sender = who
    vm.value = amount * GEN
    wid = v.create_watch(name, url, cond, recipient)
    vm.value = 0
    return wid


def test_create_watch(deploy, direct_vm, direct_alice):
    v = deploy(CONTRACT)
    wid = _create(v, direct_vm, direct_alice)
    assert wid == 0
    w = v.get_watch(0)
    assert w["status"] == W_ARMED
    assert int(w["amount"]) == 3 * GEN
    assert w["checks"] == 0


def test_create_requires_escrow(deploy, direct_vm, direct_alice):
    v = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with direct_vm.expect_revert("escrow GEN"):
        v.create_watch("n", "https://x.com", "c", BOB)


def test_create_requires_name(deploy, direct_vm, direct_alice):
    v = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.value = GEN
    with direct_vm.expect_revert("a name is required"):
        v.create_watch("", "https://x.com", "c", BOB)
    direct_vm.value = 0


def test_create_requires_condition(deploy, direct_vm, direct_alice):
    v = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.value = GEN
    with direct_vm.expect_revert("a condition is required"):
        v.create_watch("n", "https://x.com", "", BOB)
    direct_vm.value = 0


def test_disarm(deploy, direct_vm, direct_alice):
    v = deploy(CONTRACT)
    _create(v, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    v.disarm(0)
    assert v.get_watch(0)["status"] == W_DISARMED


def test_only_owner_disarms(deploy, direct_vm, direct_alice, direct_bob):
    v = deploy(CONTRACT)
    _create(v, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("only the owner can disarm"):
        v.disarm(0)


def test_check_bad_id(deploy, direct_vm, direct_alice):
    v = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("no such watch"):
        v.check(0)


def test_multiple(deploy, direct_vm, direct_alice):
    v = deploy(CONTRACT)
    _create(v, direct_vm, direct_alice, name="Watch A")
    _create(v, direct_vm, direct_alice, name="Watch B")
    assert v.get_watch_count() == 2
    assert v.get_watch(1)["name"] == "Watch B"
