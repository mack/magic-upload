PLUGIN_NAME=MagicUpload
TEMP_DIR=.tmp
RELEASE_DIR=release

# Download BDPluginLibrary and install dependencies
.PHONY: setup-tools
setup-tools:
	sh scripts/setup.sh ${TEMP_DIR}

# Use BDPluginLibrary to build plugin and store in `./release`
.PHONY: build
build: setup-tools
	${TEMP_DIR}/BDPluginLibrary/node_modules/.bin/esbuild index.jsx --bundle --minify --outfile=bundled.js --platform=node --external:electron
	cp config.bgplugin.json ${TEMP_DIR}/BDPluginLibrary/config.json
	mkdir -p ${TEMP_DIR}/${PLUGIN_NAME}
	cp config.json ${TEMP_DIR}/${PLUGIN_NAME}
	mv bundled.js ${TEMP_DIR}/${PLUGIN_NAME}
	npm run build_plugin ${PLUGIN_NAME} --prefix ${TEMP_DIR}/BDPluginLibrary
	rm -rf ${TEMP_DIR}/${PLUGIN_NAME}
	sed -i.bak '/^ \* @.*undefined$\/d' ${RELEASE_DIR}/${PLUGIN_NAME}.plugin.js
	rm ${RELEASE_DIR}/${PLUGIN_NAME}.plugin.js.bak

# Copy the plugin to BetterDiscord plugins folder
.PHONY: install
install: build
	sh scripts/install.sh

.PHONY: watch
watch: setup-tools
	ls index.jsx config.json | ${TEMP_DIR}/entr/bin/entr -s "make install"