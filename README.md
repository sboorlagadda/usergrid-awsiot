## Apache Usergrid + AWS IoT

Integrating Usergrid with AWS IoT to provide a multi-tenant BaaS (for consumption) with AWS IoT(for ingestion)

In a typical IoT deployment, sensors (devices) connected to cloud through an access-point(AP). 
A standard solution is to build a mqtt-bridge, where a mqtt broker running on AP bridges to cloud mqtt broker providing a pub/sub paradigm to its connected devices.

An alternative approach is to abstract the cloud interface and leave the device<->AP interface independent of cloud interface. This project aims at presenting this approach.

Usergrid provides collections & entities as logical entities.
Senors are entities in a device collection and each sensor can have telemetry data.

At the consumption end, Usergrid provides several query capabilities and user managment to allow tenants to build a web or mobile application and allowing tenants to completely control data-access through roles, permissions. (Refer [Usergrid documentation](http://usergrid.apache.org/docs/security-and-auth/using-permissions.html) for more info on ACLs.)

###Scene

1. AP abstract cloud and behaves as a gateway between device & cloud
1. AP and Devices communicate using a magical interface that is exposed by AP and is out-of-scope of this project.
1. APs belong to a particular tenant is mapped to Usergrid`s Organization using a device certificate. So in AWS, things are just Access Points.
1. Each AP is a device in AWS IoT and can share a single device certificate that is mapped to orgId. This is easier to manage AP<->Tenant mapping. Rotating device certificate can be inefficient as all APs have to be updated if using a single certificate, but can be enhanced to use unique certificate to each AP and map several certificates to OrgId.
1. Multiple device data/request flows through AP and to Cloud.
1. Devices can be mapped to applications under an Usergrid`s Org. Allowing a tenant to seggregate a particular sensor data to one application. Eg: If a smart-home has several sensors (thermostat, humidity), thermostat data can be stored under one app or vice-versa.

A completely different deployment scenario is possible, if a particular vendor operates AP allowing multiple tenent`s devices talk to AP. In this case AP is mapped to Org(Vendor) and device is mapped to tenant(1 app per tenant under org). 

#### Mappings
Actor|Usergrid|AWS IoT
:---:|:---:|:---:
AP Operator| Organization| - 
Tenant|App| - 
AP| - |Device resource
 - |Org|Device certificate
Device|Device entity under <br>devices collection of an <br>app storage| - 

#### Potential flows:

1. Classic request-response round-trip
1. Devices publishes telemetry data, a fire-and-forget way
1. Devices are interested in events, device-device or cloud-device notifications

#### Request-Response paradigm

Wrapping usergrid HTTP requests inside IoT Publish/Subscribe using AWS Rule (Lambda).
Eg: Device should be able to register to cloud under Usergrid`s app(tenant) storage space.

#### How does it work?

For every request that AP exposes to the device, a base topic is used to correlate request and response. AP first subscribes to a topic to which the response will be sent. 
With the given base topic, this response topic will be **deviceregistration/response/ID**, where **ID** is a unique identifier for the device request. 
AWS IoT rule is created to a topic **deviceregistration/request/+**, where + is a wildcard for a topic level. AP publishes device profile received from device to the request topic, 
which is **deviceregistration/request/ID**, ID is the same unique ID already used for the response topic. 
AWS IoT Rule matches this request topic since it is created with wildcard topic filter and invokes the target `Deviceregistration` function.
When the Lambda function completes the HTTP request on Usergrid it will publish the response on **/deviceregistration/response/ID**, where ID is extracted from the request topic. Lambda use unique ID as its client ID while connecting and publishing to AWS IoT mqtt broker.
As only one AP has subscribed to the response topic, it receives the response and is forward it to the respective device. AP unsubscribes to the response topic, as it is unique and to avoid to session limitations.

An example device registration request-response implementation can be found [here](requestresponse/README.md)

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