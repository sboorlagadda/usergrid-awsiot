var awsIot = require('aws-iot-device-sdk');
var config = require("./config");

var requestId = 'REQ123';

var mqtt_config = {
    "privateKey": config.lambdaPrivateKey,
    "clientCert": config.lambdaCertificate,
    "caCert": config.rootCA,
    "host": config.host,
    "port": 8883,
    "clientId": requestId, 
    "region":"us-east-1",
    "debug":true
};

exports.handler = function (event, context) {
    try {
        var mqttClient = awsIot.device(mqtt_config);

        mqttClient.on('close', function() {
            console.log('disconnected', arguments);
        });

        mqttClient.on('error', function() {
            console.log('error', arguments);
        });

        mqttClient.on('reconnect', function() {
            console.log('reconnecting', arguments);
        });

        mqttClient.on('message', function(topic, payload) {
            console.log('message', topic, payload.toString());
        });

        mqttClient.on('timeout', function(thingName, clientToken) {
            console.log('received timeout');
        });

        // Load the message passed into the Lambda function into a JSON object 
        var eventText = JSON.stringify(event, null, 2);
        
        // Log a message to the console, you can view this text in the Monitoring tab in the Lambda console or in the CloudWatch Logs console
        console.log("Received event:", eventText);

        //publish deviceDetails to Usergrid /orgs/{orgid}/apps/{appid}/devices
        //Retreive orgid from the device attribute
        //Retrieve appid from serialnumber<->appid mapping. Dynamo? 
        var response = JSON.stringify({deviceId:"dev123"})
        var deviceRegistrationResponseTopic = "deviceregistration/response/"+requestId;
        
        mqttClient.on("connect",function(){
            console.log("Connected to AWS IoT");  
            mqttClient.publish(deviceRegistrationResponseTopic, response);
            console.log("Published response to " + deviceRegistrationResponseTopic);
            //mqttClient.end();
        });
    } catch (e) {
        console.log("EXCEPTION in handler:  " + e);
        context.fail("Exception: " + e);
    }
};