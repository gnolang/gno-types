#!/bin/bash

PROTO_PATH=./protos
OUT_DIR=./src

FILES=$(find protos -type f -name "*.proto")

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