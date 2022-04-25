SHELL := /bin/bash
PLUGIN_NAME=MagicUpload
TEMP_DIR=.tmp
BUILD_DIR=build
BD_HEADERS=bdheaders.js
SOURCE=index.js
TARGET=MagicUpload.plugin.js

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# # ${TEMP_DIR}/BDPluginLibrary/node_modules/.bin/esbuild ${SOURCE} --bundle --minify --outfile=bundled.js --platform=node --external:electron
.PHONY: build
build: setup ## Build a minified bundled version of the plugin.
	npm run bundle
	cat ${BD_HEADERS} ${BUILD_DIR}/bundled.js > ${BUILD_DIR}/${TARGET}
	rm ${BUILD_DIR}/bundled.js

.PHONY: install
install: build ## Copy release to BetterDiscord plugin directory.
	sh scripts/install.sh ${BUILD_DIR}

.PHONY: setup
setup: ## Install tools used to build and hot reload plugin.
	sh scripts/setup.sh ${TEMP_DIR} ${BUILD_DIR}

.PHONY: watch
watch: setup ## Automatically build and install plugin on save.
	ls ${SOURCE} | ${TEMP_DIR}/entr/bin/entr -s 'printf "\033c"; make install'