#! /bin/bash

ROLE="arn:aws:iam::XXXXXXX:role/lambda_basic_execution"
HANDLER="index.handler"

MEMORY=128
TIMEOUT=10

#rm -rf node_modules/
#npm install

FUNCTION=`deviceregistration`
PACKAGE="$FUNCTION.zip"
FILEPATH="fileb://`pwd`/${PACKAGE}"

rm -rf ${PACKAGE}
#zip -r ${PACKAGE} *.js node_modules @ --exclude=*aws-sdk*
zip -r ${PACKAGE} *.js node_modules awsCerts @

#aws lambda delete-function --function-name "$FUNCTION"

# aws lambda create-function \
#        --function-name "$FUNCTION" \
#        --zip-file "${FILEPATH}" \
#        --role "$ROLE" \
#        --handler "${HANDLER}" \
# 		--region us-east-1 \
#        --runtime nodejs \
#		--timeout 10

 aws lambda update-function-code    --function-name "$FUNCTION"    --zip-file "${FILEPATH}"