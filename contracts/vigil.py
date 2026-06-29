# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
VIGIL - Web-to-Chain Automation (IFTTT for GenLayer)
====================================================
An owner arms a standing watch: a public URL, a plain-English condition, and an
on-chain action to fire when that condition becomes true - here, releasing
escrowed GEN to a chosen recipient. Anyone can poke a watch to check it: the
contract reads the URL and a validator set agrees (Equivalence Principle)
whether the condition holds. The first time it does, the watch fires and the
funds are sent. Until then the watch stays armed and records its last reading.
The owner can disarm an un-fired watch and reclaim the funds.

Status:  ARMED(0) -> FIRED(1) | DISARMED(2)
"""

from genlayer import *
from dataclasses import dataclass
import json
import typing


W_ARMED = 0
W_FIRED = 1
W_DISARMED = 2


@allow_storage
@dataclass
class Watch:
    owner: Address
    recipient: Address
    name: str
    url: str
    condition: str
    amount: u256
    status: u8
    checks: u256
    last_result: str


class Vigil(gl.Contract):
    watches: DynArray[Watch]

    def __init__(self) -> None:
        pass

    @gl.public.write.payable
    def create_watch(self, name: str, url: str, condition: str, recipient: str) -> int:
        if len(name.strip()) == 0:
            raise gl.vm.UserError("a name is required")
        if len(url.strip()) == 0:
            raise gl.vm.UserError("a URL to watch is required")
        if len(condition.strip()) == 0:
            raise gl.vm.UserError("a condition is required")
        amount = gl.message.value
        if amount == u256(0):
            raise gl.vm.UserError("escrow GEN for the action to fire")
        w = self.watches.append_new_get()
        w.owner = gl.message.sender_address
        w.recipient = Address(recipient)
        w.name = name
        w.url = url
        w.condition = condition
        w.amount = amount
        w.status = u8(W_ARMED)
        w.checks = u256(0)
        w.last_result = ""
        return len(self.watches) - 1

    @gl.public.write
    def check(self, watch_id: int) -> None:
        """Poke the watch: read the URL and let validators agree whether the
        condition holds. If it does, the watch fires and pays the recipient."""
        w = self._get(watch_id)
        if w.status != W_ARMED:
            raise gl.vm.UserError("watch is not armed")

        url = w.url
        condition = w.condition

        def leader_fn() -> str:
            page = ""
            try:
                page = gl.nondet.web.get(url).body.decode("utf-8")[:6000]
            except Exception:
                page = "(page unreachable)"
            prompt = (
                f"Trigger condition to watch for: {condition}\n\n"
                f"Current page content:\n{page}\n\n"
                "Judge strictly on what the page shows right now. Is the trigger "
                "condition TRUE? Reply with ONLY JSON: {\"fire\": true} if the "
                "condition holds, {\"fire\": false} if it does not, plus a short "
                "\"reason\"."
            )
            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            return self._decision_of(leader_res.calldata)[0] == self._decision_of(leader_fn())[0]

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        fire, reason = self._decision_of(result)
        w.checks = w.checks + u256(1)
        w.last_result = reason[:300]
        if fire:
            w.status = u8(W_FIRED)
            self._pay(w.recipient, w.amount)

    @gl.public.write
    def disarm(self, watch_id: int) -> None:
        w = self._get(watch_id)
        if w.status != W_ARMED:
            raise gl.vm.UserError("only an armed watch can be disarmed")
        if gl.message.sender_address != w.owner:
            raise gl.vm.UserError("only the owner can disarm")
        w.status = u8(W_DISARMED)
        self._pay(w.owner, w.amount)

    # ------------------------------------------------------------------ views
    @gl.public.view
    def get_watch_count(self) -> int:
        return len(self.watches)

    @gl.public.view
    def get_watch(self, watch_id: int) -> dict:
        w = self._get(watch_id)
        return {
            "owner": w.owner.as_hex,
            "recipient": w.recipient.as_hex,
            "name": w.name,
            "url": w.url,
            "condition": w.condition,
            "amount": str(w.amount),
            "status": int(w.status),
            "checks": int(w.checks),
            "last_result": w.last_result,
        }

    # -------------------------------------------------------------- internals
    def _get(self, watch_id: int) -> Watch:
        if watch_id < 0 or watch_id >= len(self.watches):
            raise gl.vm.UserError("no such watch")
        return self.watches[watch_id]

    def _decision_of(self, result: typing.Any) -> tuple:
        data = result
        if isinstance(data, str):
            data = self._extract_json(data)
        if not isinstance(data, dict):
            return (False, "")
        raw = data.get("fire", None)
        reason = str(data.get("reason", ""))
        if isinstance(raw, bool):
            return (raw, reason)
        if isinstance(raw, str):
            return (raw.strip().lower() == "true", reason)
        return (False, reason)

    def _extract_json(self, text: str) -> typing.Any:
        try:
            return json.loads(text)
        except (ValueError, TypeError):
            pass
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except (ValueError, TypeError):
                return None
        return None

    def _pay(self, recipient: Address, amount: u256) -> None:
        if amount == u256(0):
            return
        _Payee(recipient).emit_transfer(value=amount)


@gl.evm.contract_interface
class _Payee:
    class View:
        pass

    class Write:
        pass
