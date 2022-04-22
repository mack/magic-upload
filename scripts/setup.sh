#!/bin/bash	

TEMP_FILE=$1

if [ ! -d "$TEMP_FILE/BDPluginLibrary" ] 
then
	echo "Downloading BDPluginLibrary..."
    git clone https://github.com/rauenzi/BDPluginLibrary.git $TEMP_FILE/BDPluginLibrary
    npm install -prefix $TEMP_FILE/BDPluginLibrary
    npm install -prefix $TEMP_FILE/BDPluginLibrary esbuild
fi

if [ ! -d "$TEMP_FILE/entr" ] 
then
    echo "Downloading entr..."
    git clone https://github.com/eradman/entr.git $TEMP_FILE/entr
    cd $TEMP_FILE/entr
    sh configure
    make DESTDIR="." PREFIX="" install
fi