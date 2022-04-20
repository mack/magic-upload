PLUGIN_NAME="MagicUpload"
TEMP_FILE=".tmp"

# Download BDPluginLibrary and install dependencies
.PHONY: setup-tools
setup-tools:
	sh scripts/setup.sh ${TEMP_FILE}

# Use BDPluginLibrary to build plugin and store in `./release`
.PHONY: build
build: setup-tools
	cp config.bgplugin.json ${TEMP_FILE}/BDPluginLibrary/config.json
	mkdir -p ${TEMP_FILE}/${PLUGIN_NAME}
	cp index.js config.json ${TEMP_FILE}/${PLUGIN_NAME}
	npm run build_plugin ${PLUGIN_NAME} --prefix ${TEMP_FILE}/BDPluginLibrary
	rm -rf ${TEMP_FILE}/${PLUGIN_NAME}

# Copy the plugin to BetterDiscord plugins folder
.PHONY: install
install:
	sh scripts/install.sh
	