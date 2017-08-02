#!/bin/bash

export NODE_PATH="$(dirname $(realpath $0))/node_modules:$(pwd):$(pwd)/node_modules"

node "$1" "$@"
