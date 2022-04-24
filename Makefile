SHELL := /bin/bash
PLUGIN_NAME=MagicUpload
TEMP_DIR=.tmp
RELEASE_DIR=release
SOURCE=index.js

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
# ${TEMP_DIR}/BDPluginLibrary/node_modules/.bin/esbuild ${SOURCE} --bundle --minify --outfile=bundled.js --platform=node --external:electron
.PHONY: build
build: setup-tools ## Build a minified bundled version of the plugin.
	cp index.js bundled.js
	cp config.bgplugin.json ${TEMP_DIR}/BDPluginLibrary/config.json
	mkdir -p ${TEMP_DIR}/${PLUGIN_NAME}
	cp config.json ${TEMP_DIR}/${PLUGIN_NAME}
	mv bundled.js ${TEMP_DIR}/${PLUGIN_NAME}
	npm run build_plugin ${PLUGIN_NAME} --prefix ${TEMP_DIR}/BDPluginLibrary
	rm -rf ${TEMP_DIR}/${PLUGIN_NAME}
	sed -i.bak '/^ \* @.*undefined$\/d' ${RELEASE_DIR}/${PLUGIN_NAME}.plugin.js
	rm ${RELEASE_DIR}/${PLUGIN_NAME}.plugin.js.bak

.PHONY: install
install: build ## Copy release to BetterDiscord plugin directory.
	sh scripts/install.sh

.PHONY: setup-tools
setup-tools: ## Install tools used to build and hot reload plugin.
	sh scripts/setup.sh ${TEMP_DIR}

.PHONY: watch
watch: setup-tools ## Automatically build and install plugin on save.
	ls ${SOURCE} config.json | ${TEMP_DIR}/entr/bin/entr -s 'printf "\033c"; make install'