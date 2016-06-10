#####Request-Response Usecase:

Demonstrate a round-trip request-response flow from device -> AP -> Cloud -> AP -> Device for device registration. A Lambda function is invoked using AWS IoT Rule, which is responsible for creating the device in Usergrid and publishes the response to AP.

Notes:

1. AWS Lambda can use the AP device certificate, private key while publishing the response, but a different certificate is used to help debugging. AWS Cloudwatch can log events (connect, publish, etc) at certificate level. So to separate AP logs from Lambda logs a different certificate is used.
1. Lambda can use either `aws-sdk-js` or `aws-iot-device-sdk`.
1. Lambda uses requestId as the clientId while connecting and publishing the response

#####Flow:

1. Device invokes the magic interface on AP and submits device profile
1. AP generates a random request Id `REQ123` and returns to Device
1. AP subscribes to topic `deviceregistration/response/REQ123`, expecting a response on this topic
1. AP publishes device profile to 'deviceregistration/request/REQ123'
1. AWS IoT Rule (lambda) is created for a wild-card topic 'deviceregistration/request/+', so a single device registration lambda function is invoked for any device registration requests coming from AP.
1. `Deviceregistration` lambda function:
		* Extracts 'OrgId' from device attributes
		* Retrieves 'AppId' from serial number to tenant mapping
		* Invokes HTTP POST `/orgs/{orgid}/apps/{appid}/devices` with deviceprofile json
		* Publishes the HTTP Response on to `/deviceregistration/response/REQ123` topic
1. AP unsubscribes to the response topic `deviceregistration/response/REQ123`

![ALt text](blob/requestresponse.png?raw=true "Request-Response Flow")

#### How to build & run AP?
1. On the Dev VM (ubuntu vagrant box), clone this repo.
1. Change directory to $CLONE_DIR/requestresponse/ap
1. Create an AWS device, certificate & basic policy
1. Copy the certificates and keys to `app/certs`
1. Build the AP container

	```bash
		$docker build -t doc2run/ap:latest .
	```

1. Run device as a container on the docker-host (same ec2 where uesrgrid containers are created).

	```bash
		docker run --rm --it -name ap -v <<absolute_path_to_clone_dir>>/requestresponse/ap/app:/app doc2run/ap:latest
	```

1. You should have a shell to the device container and working directory set to /app
1. Run the device app

	```bash
		node index.js
	```
1. AP should subscribe to response topic and publish a sample device profile JSON
1. If AWS IoT rule, Lambda function are created, AP should receive a response.

#### AWS Rule & Lambda creation

1. Follow the standard Lambda creation flow and upload the zip found in $CLONE_DIR/requestresponse/lambda/deviceregistration.zip
1. Create AWS IoT rule named 'deviceregistration-lambda', with topic filter 'deviceregistration/request/+'
1. Add AWS Lambda action to invoke deviceregistration function