import {
  readFileSync,
} from "node:fs";

import type {
  BinaryWriter,
} from "@bufbuild/protobuf/wire";
import {
  describe, expect, it,
} from "vitest";

import {
  gno, tm,
} from "../src/index.js";

interface Codec<T> {
  encode(message: T): BinaryWriter
  decode(input: Uint8Array): T
  fromJSON(object: unknown): T
}

interface Fixture {
  name: string
  typeUrl: string
  amino: string
  json: Record<string, unknown>
}

// Encoded by gno's own amino codec, see tests/fixtures/generate/main.go
const fixtures: Fixture[] = JSON.parse(readFileSync(new URL("./fixtures/amino.json", import.meta.url), "utf8")).fixtures;

const fixture = (name: string) => {
  const found = fixtures.find(f => f.name === name);
  if (!found) {
    throw new Error(`missing fixture ${name}`);
  }
  return {
    ...found,
    bytes: Uint8Array.from(Buffer.from(found.amino, "base64")),
  };
};

const {
  vm,
} = gno.gno.vm;
const {
  bank,
} = gno.gno.bank;
const {
  auth,
} = gno.gno.auth;
const {
  tx,
} = gno.tm2.tx;

const codecs: Record<string, Codec<unknown>> = {
  MsgCall: vm.MsgCall,
  MsgAddPackage: vm.MsgAddPackage,
  MsgRun: vm.MsgRun,
  MsgEnablePackage: vm.MsgEnablePackage,
  "MsgEnablePackage (negative height)": vm.MsgEnablePackage,
  MsgRejectPackage: vm.MsgRejectPackage,
  MsgSend: bank.MsgSend,
  MsgCreateSession: auth.MsgCreateSession,
  MsgRevokeSession: auth.MsgRevokeSession,
  MsgRevokeAllSessions: auth.MsgRevokeAllSessions,
  Tx: tx.Tx,
  PubKeyMultisig: tm.multisig.PubKeyMultisig,
};

// Amino wraps secp256k1 keys as an Any holding PubKeySecp256k1 { bytes key = 1 }
const pubKeyBase64 = (value: Uint8Array) => Buffer.from(tx.PubKeySecp256k1.decode(value).key).toString("base64");

describe("amino wire compatibility", () => {
  it("has a codec for every fixture", () => {
    expect(fixtures.map(f => f.name).sort()).toEqual(Object.keys(codecs).sort());
  });

  describe.each(fixtures.map(f => f.name))("%s", (name) => {
    it("re-encodes gno's bytes exactly", () => {
      const {
        bytes,
      } = fixture(name);
      const codec = codecs[name];

      expect(codec.encode(codec.decode(bytes)).finish()).toEqual(bytes);
    });
  });

  describe.each(["MsgCall", "MsgAddPackage", "MsgRun", "MsgEnablePackage", "MsgEnablePackage (negative height)", "MsgRejectPackage", "MsgSend", "MsgRevokeAllSessions"])("%s", (name) => {
    it("decodes the same values as gno's amino JSON", () => {
      const {
        bytes, json,
      } = fixture(name);
      const codec = codecs[name];

      expect(codec.decode(bytes)).toEqual(codec.fromJSON(json));
    });
  });

  it("decodes sint64 fields with zigzag encoding", () => {
    expect(vm.MsgEnablePackage.decode(fixture("MsgEnablePackage").bytes).pkgHeight).toBe(25998n);
    expect(vm.MsgEnablePackage.decode(fixture("MsgEnablePackage (negative height)").bytes).pkgHeight).toBe(-42n);
  });

  it("decodes session messages with their Any-wrapped keys", () => {
    const {
      bytes, json,
    } = fixture("MsgCreateSession");
    const sessionKey = json.session_key as {
      "@type": string
      value: string
    };
    const msg = auth.MsgCreateSession.decode(bytes);

    expect(msg).toMatchObject({
      creator: json.creator,
      expiresAt: 1790000000n,
      allowPaths: json.allow_paths,
      spendLimit: json.spend_limit,
      spendPeriod: 86400n,
    });
    expect(msg.sessionKey?.typeUrl).toBe(sessionKey["@type"]);
    expect(pubKeyBase64(msg.sessionKey!.value)).toBe(sessionKey.value);

    const revoke = auth.MsgRevokeSession.decode(fixture("MsgRevokeSession").bytes);
    expect(revoke.sessionKey).toEqual(msg.sessionKey);
  });

  it("decodes a transaction with messages, fee and session signatures", () => {
    const {
      bytes, json,
    } = fixture("Tx");
    const signatures = json.signatures as {
      session_addr?: string
    }[];
    const decoded = tx.Tx.decode(bytes);

    expect(decoded.messages.map(m => m.typeUrl)).toEqual(["/vm.m_call", "/bank.MsgSend"]);
    expect(vm.MsgCall.decode(decoded.messages[0].value)).toEqual(vm.MsgCall.decode(fixture("MsgCall").bytes));
    expect(bank.MsgSend.decode(decoded.messages[1].value)).toEqual(bank.MsgSend.decode(fixture("MsgSend").bytes));
    expect(decoded.fee).toEqual({
      gasWanted: 2000000n,
      gasFee: "1000000ugnot",
    });
    // gno's amino writes a zero SessionAddr (master-key signature) as the zero address instead of omitting it
    expect(decoded.signatures.map(s => s.sessionAddr)).toEqual(["g1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqluuxe", signatures[1].session_addr]);
    expect(decoded.signatures[1].signature).toEqual(Uint8Array.from([1, 2, 3]));
    expect(decoded.memo).toBe("gno-types fixture");
  });

  it("decodes a multisig public key", () => {
    const {
      bytes, json,
    } = fixture("PubKeyMultisig");
    const pubkeys = json.pubkeys as {
      "@type": string
      value: string
    }[];
    const decoded = tm.multisig.PubKeyMultisig.decode(bytes);

    expect(decoded.k).toBe(2n);
    expect(decoded.pubKeys.map(k => k.typeUrl)).toEqual(pubkeys.map(k => k["@type"]));
    expect(decoded.pubKeys.map(k => pubKeyBase64(k.value))).toEqual(pubkeys.map(k => k.value));
  });

  it("decodes a /vm.m_enable_pkg stored on gnoland-1", () => {
    const bytes = Buffer.from("CihnMXlhYWE2cmNwNGV3NXlqemRqNHltczU5Nnd4MmR0cmozYTg2NzA0Eitnbm8ubGFuZC9yL21vdWwveC9kYWlseS9jbGlmZnZlc3RpbmdkZW1vL3YwGkBlNDhkMWNmNjU4Yzg4MjgyNDc2ZDgyYTFlYmIxYjAxMGM1YTBiMGM4YzY3MDc4OTU0YTZmZDdjNGU4NmJmY2YyIJyWAw==", "base64");

    expect(vm.MsgEnablePackage.decode(bytes)).toEqual({
      approver: "g1yaaa6rcp4ew5yjzdj4yms596wx2dtrj3a86704",
      pkgPath: "gno.land/r/moul/x/daily/cliffvestingdemo/v0",
      pkgHash: "e48d1cf658c88282476d82a1ebb1b010c5a0b0c8c67078954a6fd7c4e86bfcf2",
      pkgHeight: 25998n,
    });
  });
});
