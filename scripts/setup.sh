#!/bin/bash	

TEMP_FILE=$1
BUILD_DIR=$2

npm install
if [ ! -d "$TEMP_FILE/entr" ] 
then
    echo "Downloading entr..."
    git clone https://github.com/eradman/entr.git $TEMP_FILE/entr
    cd $TEMP_FILE/entr
    sh configure
    make DESTDIR="." PREFIX="" install
fi

mkdir -p ${BUILD_DIR}