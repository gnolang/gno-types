#!/bin/bash

PROTO_PATH=./protos
OUT_DIR=./src

# Only the packages we publish are generated; ts-proto also emits every proto
# they import (gogoproto, cosmos, google, ...), so dependencies need no listing.
ROOTS="gno ibc tendermint tm"

FILES=$(for root in ${ROOTS}; do find protos/${root} -type f -name "*.proto"; done)

mkdir -p ${OUT_DIR}

echo "Generating TypeScript files from proto definitions..."
for x in ${FILES}; do
  protoc \
    --plugin="./node_modules/.bin/protoc-gen-ts_proto" \
    --ts_proto_out="${OUT_DIR}" \
    --proto_path="${PROTO_PATH}" \
    --ts_proto_opt="esModuleInterop=true,importSuffix=.js,forceLong=bigint,useOptionals=messages,useDate=false,snakeToCamel=true,emitDefaultValues=json-methods,exportCommonSymbols=false" \
    ${x}
done
echo "Generation complete."