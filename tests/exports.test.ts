import type {
  BinaryWriter,
} from "@bufbuild/protobuf/wire";
import {
  describe, expect, it,
} from "vitest";

import * as types from "../src/index.js";

interface MessageFns {
  encode(message: unknown): BinaryWriter
  decode(input: Uint8Array): unknown
  fromJSON(object: unknown): unknown
  toJSON(message: unknown): unknown
  fromPartial(object: unknown): unknown
}

const isMessage = (value: unknown): value is MessageFns => typeof value === "object" && value !== null && "encode" in value && "decode" in value;

const collect = (namespace: object, path: string, out: [string, MessageFns][]) => {
  for (const [key, value] of Object.entries(namespace)) {
    if (isMessage(value)) {
      out.push([`${path}.${key}`, value]);
    }
    else if (typeof value === "object" && value !== null) {
      collect(value, `${path}.${key}`, out);
    }
  }
  return out;
};

const messages = collect(types, "types", []);

describe("package exports", () => {
  it("exposes only the published root namespaces", () => {
    expect(Object.keys(types).sort()).toEqual(["cosmos", "cosmos_proto", "gno", "google", "ibc", "tendermint", "tm"]);
  });

  it("exports the gno message codecs", () => {
    expect(messages.map(([path]) => path)).toEqual(expect.arrayContaining(["types.gno.gno.auth.auth.MsgCreateSession", "types.gno.gno.bank.bank.MsgSend", "types.gno.gno.vm.vm.MsgCall", "types.gno.gno.vm.vm.MsgEnablePackage", "types.gno.tm2.bft.types.Block", "types.gno.tm2.tx.tx.Tx", "types.ibc.lightclients.gno.v1.gno.ClientState", "types.tm.multisig.PubKeyMultisig"]));
  });

  it.each(messages)("%s round-trips its default value", (_, codec) => {
    const empty = codec.fromPartial({
    });

    expect(codec.decode(codec.encode(empty).finish())).toEqual(empty);
    expect(codec.fromJSON(codec.toJSON(empty))).toEqual(empty);
  });
});
