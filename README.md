## Apache Usergrid + AWS IoT

Integrating Usergrid with AWS IoT to provide a multi-tenant BaaS (for consumption) with AWS IoT(for ingestion)

In a typical IoT deployment, sensors (devices) connected to cloud through an access-point(AP). 
A standard solution is to build a mqtt-bridge, where a mqtt broker running on AP bridges to cloud mqtt broker providing a pub/sub paradigm to its connected devices.

An alternative approach is to abstract the cloud interface and leave the device<->AP interface independent of cloud interface. This project aims at presenting this approach, by wrapping Usergrid collection/entities HTTP APIs inside MQTT pub/sub.

Usergrid provides collections & entities as storage space. Collections are used to denote group of entities.
Eg: Users is a collection & User is an entity in users collections
Similarly devices are entities in a device collection and each device can have telemetry data.

Collection|URI
---|---
Users|/orgs/{orgid}/apps/{appid}/users
Sensors|/orgs/{orgid}/apps/{appid}/sensors
Devices(User Mobiles)|/orgs/{orgid}/apps/{appid}/users/{userid}/devices/
Telemetry(Temperature)|/orgs/{orgid}/apps/{appid}/sensors/{sensorid}/temperatures/

Entities|URI
---|---
User|/orgs/{orgid}/apps/{appid}/users/{userid}
Sensor|/orgs/{orgid}/apps/{appid}/sensors/{sensorid}
Devices(User Mobiles)|/orgs/{orgid}/apps/{appid}/users/{userid}/devices/{deviceId}
Telemetry(Temperature)|/orgs/{orgid}/apps/{appid}/sensors/{sensorid}/temperatures/{timestamp}

At the ingestion end, sensors need three basic flows:

1. Classic [request-response](#request-response paradigm) round-trip. Eg: Device registration
1. Sensors publish [telemetry](#telemetry) data, a fire-and-forget way. Eg: Telemetry
1. Sensors interested in [events](#events), device-device or cloud-device notifications. Eg: OTA Update, Restart etc

At the consumption end, Usergrid provides several query capabilities and user management APIs to allow tenants to build a web or mobile application and allowing tenants to completely control data-access through roles, permissions at application level. (Refer [Usergrid documentation](http://usergrid.apache.org/docs/security-and-auth/using-permissions.html) for more info on ACLs.)

###Scenarios

#####Scene 1:
A tenant have several type of sensors (thermostat, humidity) connecting to cloud through a set of APs. A device certificate is generated for each tenant, and all his APs connect using one device certificate routing all data coming through these set of APs into one organization in usergrid.
Tenant is free to create several apps to either segregate data per sensor type.

#### Mappings
Actor|Usergrid|AWS IoT
:---:|:---:|:---:
AP| Organization(Tenant)| Device Resource 
AP|Org(Tenant)|Device certificate
Sensor|Sensor entity under <br>sensors collection| - 

#####Scene 2:
A particular vendor operates AP(s) allowing multiple tenent`s sensors talk to cloud. In this case AP is mapped to Org(Vendor) and tenants are mapped to apps under org. 

#### Mappings
Actor|Usergrid|AWS IoT
:---:|:---:|:---:
AP Operator(vendor)| Organization| - 
Tenant|App| - 
AP| - |Device resource
 - |Org|Device certificate
Sensor|Sensor entity under <br>sensor collection of an <br>app storage| - 

#### Request-Response paradigm

Wrapping usergrid HTTP requests inside IoT Publish/Subscribe using AWS Rule (Lambda).
Eg: Device should be able to register to cloud under Usergrid`s org storage space.

#### How does it work?

For every request that AP exposes to the sensor, a base topic is used to correlate request and response. AP first subscribes to a topic to which the response will be sent. 
With the given base topic, this response topic will be **sensorregistration/response/ID**, where **ID** is a unique identifier for the sensor request. 
AWS IoT rule is created to a topic **sensorregistration/request/+**, where + is a wildcard for a topic level. AP publishes sensor profile received from sensor to the request topic, 
which is **sensorregistration/request/ID**, ID is the same unique ID already used for the response topic. AWS IoT Rule matches this request topic since it is created with wildcard topic filter and invokes the target `Sensorregistration` function.
When the Lambda function completes the HTTP request on Usergrid it will publish the response on **/sensorregistration/response/ID**, where ID is extracted from the request topic. Lambda use unique ID(extracted from topic) as its client ID while connecting and publishing to AWS IoT mqtt broker. As only one AP has subscribed to the response topic, it receives the response and is forward it to the respective sensor. AP unsubscribes to the response topic to avoid to session limitations.

An example sensor registration request-response implementation can be found [here](requestresponse)

#### Telemetry
-WIP-

#### Events
-WIP-

### Deploying Usergrid on AWS EC2
Deploy usergrid as docker containers on a single EC2 and link usergrid backend to cassandra & elasticsearch.

To make it easier, the required dev environment is available as vagrant file. 
So launch ubuntu VM on your laptop/mac and get started using vagrant & virtual box.

#### Create Docker Host on AWS
1. [Setup Dev Environment](#launch-dev-environment) and ssh into it.
1. Launch a docker host on AWS.

	  ```bash
	    $ docker-machine create --driver amazonec2 --amazonec2-access-key AKI******* --amazonec2-secret-key 8T93C******* --amazonec2-instance-type "m3.medium" --amazonec2-region "us-west-2" aws-sandbox
	  ```
1. Point docker-machine to the aws docker host.

	  ```bash
	    $ docker-machine env usergrid-sandbox
	  ```
1. Update docker-client to reference aws docker host for the current terminal.

	  ```bash
	   $ eval $(docker-machine env usergrid-sandbox)
	  ```

#### Deploy usergrid containers
1. Run these commands to run cassandra, elasticsearch, usergrid backend and portal as containers.
   A default organization 'IoT' is created with admin user and password as `passw0rd`

	```bash
	    $ docker run --detach --name cassandra --volume $(pwd)/cassandra-data:/var/lib/cassandra yep1/usergrid-cassandra
	    $ docker run --detach --name elasticsearch --volume $(pwd)/elasticsearch-data:/data yep1/usergrid-elasticsearch
	    $ docker run --detach --name usergrid --env ADMIN_PASS=passw0rd --env ORG_NAME=IoT --env APP_NAME=app --link elasticsearch:elasticsearch --link cassandra:cassandra -p 8080:8080 yep1/usergrid
	    $ docker run --detach --name portal --env USERGRID_HOST=<<Public IP Address of the EC2>>:8080 -p 80:80 yep1/usergrid-portal
	```

1. Visit AWS console and update EC2 security group to allow in-bound 80 & 8080 (and it can be open to public)
1. Visit http://<<elastic_ec2_ip_address>>/
1. Login using username `admin` & password `passw0rd`

##### Launch Dev Environment
1. Install virtual box & vagrant and refer to the respective installation pages.
1. Clone this repo on to your laptop or mac.
1. Change directory to *{some location}*
1. Execute `vagrant up`
1. Dev environment is started as a virtual box VM on your laptop/mac.
1. To ssh into the dev env execute `vagrant ssh`