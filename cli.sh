#!/bin/bash

export NODE_PATH="$(dirname $(realpath $0))/node_modules:$(pwd)/node_modules"

node "$(dirname $(realpath $0))/index.js" "$@"
