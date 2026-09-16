//go:build ignore

// Command generate writes tests/fixtures/amino.json: gno messages encoded by gno's
// own amino codec, which the wire compatibility tests decode and re-encode.
//
// It imports gno, so it has to run from inside a gno checkout:
//
//	cp -r tests/fixtures/generate <gno>/misc/gno-types-fixtures
//	(cd <gno> && go run ./misc/gno-types-fixtures/main.go "$(git rev-parse HEAD)") > tests/fixtures/amino.json
//	rm -r <gno>/misc/gno-types-fixtures
package main

import (
	"encoding/json"
	"os"

	"github.com/gnolang/gno/gno.land/pkg/sdk/vm"
	"github.com/gnolang/gno/tm2/pkg/amino"
	"github.com/gnolang/gno/tm2/pkg/crypto"
	"github.com/gnolang/gno/tm2/pkg/crypto/multisig"
	"github.com/gnolang/gno/tm2/pkg/crypto/secp256k1"
	"github.com/gnolang/gno/tm2/pkg/sdk/auth"
	"github.com/gnolang/gno/tm2/pkg/sdk/bank"
	"github.com/gnolang/gno/tm2/pkg/std"
)

type fixture struct {
	Name    string          `json:"name"`
	TypeURL string          `json:"typeUrl"`
	Amino   []byte          `json:"amino"` // base64
	JSON    json.RawMessage `json:"json"`
}

func main() {
	addr := func(seed string) crypto.Address { return crypto.AddressFromPreimage([]byte(seed)) }
	key := func(seed string) crypto.PubKey { return secp256k1.GenPrivKeySecp256k1([]byte(seed)).PubKey() }

	pkg := &std.MemPackage{
		Name: "hello",
		Path: "gno.land/r/demo/hello",
		Files: []*std.MemFile{
			{Name: "gnomod.toml", Body: "module = \"gno.land/r/demo/hello\"\ngno = \"0.9\"\n"},
			{Name: "hello.gno", Body: "package hello\n\nfunc Render(_ string) string { return \"hello\" }\n"},
		},
	}
	call := vm.MsgCall{
		Caller:     addr("caller"),
		Send:       std.MustParseCoins("1000ugnot"),
		MaxDeposit: std.MustParseCoins("5000ugnot"),
		PkgPath:    "gno.land/r/demo/hello",
		Func:       "Render",
		Args:       []string{"", "path/to"},
	}
	send := bank.MsgSend{
		FromAddress: addr("from"),
		ToAddress:   addr("to"),
		Amount:      std.MustParseCoins("42ugnot"),
	}

	named := []struct {
		name string
		msg  any
	}{
		{"MsgCall", call},
		{"MsgAddPackage", vm.MsgAddPackage{Creator: addr("creator"), Package: pkg, Send: std.MustParseCoins("1ugnot"), MaxDeposit: std.MustParseCoins("100ugnot")}},
		{"MsgRun", vm.MsgRun{Caller: addr("caller"), Send: std.MustParseCoins("7ugnot"), Package: &std.MemPackage{Name: "main", Path: "gno.land/e/g1caller/run", Files: []*std.MemFile{{Name: "main.gno", Body: "package main\n\nfunc main() { println(\"run\") }\n"}}}}},
		{"MsgEnablePackage", vm.MsgEnablePackage{Approver: addr("approver"), PkgPath: "gno.land/r/demo/hello", PkgHash: "e48d1cf658c88282476d82a1ebb1b010c5a0b0c8c67078954a6fd7c4e86bfcf2", PkgHeight: 25998}},
		// sint64 fields are zigzag encoded; a negative value catches a plain varint reading.
		{"MsgEnablePackage (negative height)", vm.MsgEnablePackage{Approver: addr("approver"), PkgPath: "gno.land/r/demo/hello", PkgHeight: -42}},
		{"MsgRejectPackage", vm.MsgRejectPackage{Sender: addr("sender"), PkgPath: "gno.land/r/demo/rejected"}},
		{"MsgSend", send},
		{"MsgCreateSession", auth.MsgCreateSession{Creator: addr("creator"), SessionKey: key("session"), ExpiresAt: 1790000000, AllowPaths: []string{"vm/exec:gno.land/r/demo/hello"}, SpendLimit: std.MustParseCoins("1000000ugnot"), SpendPeriod: 86400}},
		{"MsgRevokeSession", auth.MsgRevokeSession{Creator: addr("creator"), SessionKey: key("session")}},
		{"MsgRevokeAllSessions", auth.MsgRevokeAllSessions{Creator: addr("creator")}},
		{"Tx", std.Tx{
			Msgs: []std.Msg{call, send},
			Fee:  std.NewFee(2000000, std.MustParseCoin("1000000ugnot")),
			Signatures: []std.Signature{
				{PubKey: key("signer"), Signature: make([]byte, 64)},
				{PubKey: key("session"), Signature: []byte{1, 2, 3}, SessionAddr: addr("session")},
			},
			Memo: "gno-types fixture",
		}},
		{"PubKeyMultisig", multisig.NewPubKeyMultisigThreshold(2, []crypto.PubKey{key("a"), key("b"), key("c")})},
	}

	out := struct {
		Gno      string    `json:"gno"`
		Fixtures []fixture `json:"fixtures"`
	}{}
	if len(os.Args) > 1 {
		out.Gno = os.Args[1]
	}
	for _, n := range named {
		out.Fixtures = append(out.Fixtures, fixture{
			Name:    n.name,
			TypeURL: amino.GetTypeURL(n.msg),
			Amino:   amino.MustMarshal(n.msg),
			JSON:    amino.MustMarshalJSON(n.msg),
		})
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(out); err != nil {
		panic(err)
	}
}
