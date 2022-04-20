#!/bin/bash	

TEMP_FILE=$1
if [ ! -d "$TEMP_FILE/BDPluginLibrary" ] 
then
	echo "Downloading BDPluginLibrary..."
  git clone git@github.com:rauenzi/BDPluginLibrary.git $TEMP_FILE/BDPluginLibrary
  npm i -prefix $TEMP_FILE/BDPluginLibrary
fi