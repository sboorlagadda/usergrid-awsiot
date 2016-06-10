var awsIot = require('aws-iot-device-sdk');

//{
//	"host": "A2CEJILSC50G3L.iot.us-east-1.amazonaws.com",
//	"port": 8883,
//	"clientId": "device74",
//	"thingName": "device74",
//	"caCert": "root-CA.crt",
//	"clientCert": "73e9a89558-certificate.pem.crt",
//	"privateKey": "73e9a89558-private.pem.key"
//}
var device = awsIot.device({
   keyPath: "certs/private/73e9a89558-private.pem.key",
  certPath: "certs/cert/73e9a89558-certificate.pem.crt",
    caPath: "certs/ca/root-CA.crt",
  clientId: "device74", //AP serial#
    region: "us-east-1" 
});

var requestId = 'REQ123';
var deviceDetails = JSON.stringify({ serialnumber: '123456789'});

device
  .on('connect', function() {
    console.log('connect');
    //First subscribe to teh response topic on which the response is returned
    deviceRegistrationResponseTopic = 'deviceregistration/response/'+requestId
    device.subscribe(deviceRegistrationResponseTopic);
    console.log('subscribed to ' + deviceRegistrationResponseTopic)
    //Now publish the device registration request payload to the request topic
    deviceRegistrationRequestTopic = 'deviceregistration/request/'+requestId
    device.publish(deviceRegistrationRequestTopic, deviceDetails)
  });

device
  .on('message', function(topic, payload) {
    console.log('DeviceRegistrationResponse: ', topic, payload.toString());
    //Forward the received response to device
    device.end();
  });
