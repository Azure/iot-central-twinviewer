# Twin Viewer
An application to to view and interact with the Device Twin from IoT Central, IoT Hub and the device

## Code AAD configuration updates
After cloning this repo, you will need to update part of the configuration to use the AAD application that you set up to authenticate and authorize to use Central APIs. You do not need access to MS Graph or ARM to use this tool. To get help setting up an AAD application to use IoT Central resources visit [this](https://github.com/iot-for-all/iotc-aad-setup) repo.

In the src/shared/authContext.js file, find the block of code near the top of the file that has the following object and update the guid in the configuration to use the values of your AAD application

Example
```
const AAD = {
    clientId: '532607b1-ce64-4fd3-b48f-5d7d803e0774',
    tenantId: 'c26906ba-01b0-48ec-afd2-ad8a55b1b0fb',
    redirect: 'http://localhost:4002'
}
```
Once this step is completed, build the app and run. This is a one time update and you will only need to redo this if you change or create a new AAD application.

## Install 
From a command line
```
npm ci
```

## Build
From a command line
```
npm run build
```

## Run
From a command line

```
node server.js
````

## Usage
After running the app, visit the following site in a browser
```
http://localhost:4002
````

### __Instructions__
The concept of the tool is pretty simple. With the correct context provided on the URL, the tool will ask you to sign in using the same account you use to access your IoT Central application (as given by the app id). If you are already signed in, you will be silently auth'd.

Once auth'd you will be presented with a UX with the following possible actions. The order you execute the actions is irrelevant but options will be disabled unless the correct context is provided. For example, to see the Device Twin you need the Scope ID and the SaS key of the device. This should be provided on the URL *or* by getting the Central Twin first (which will in the background get the same scope/sas key information for the device). By turning the header on, you will see all this information (see below)

This a summary of the UX features

| Action                    | Description                                                
|---------------------------|------------------------------------------------------------
| Get Central Twin          | Use the Azure IoT Central API to get the device properties 
| Get Cloud Twin            | Use the Azure IoT Service SDK to get the Twin from the Cloud
| Connect/Re-Connect        | Start a browser based device using the same device credentials as the real device
| Get Device Twin           | Use the Azire IoT Device SDK to get the LKV of the Twin on the Cloud
| Send Reported Device Twin | (For convenience) Send a reported twin value to the cloud as if it was coming from the device
| Send Telemetry            | (For convenience) Send a telemetry value to the cloud as if it was coming from the device

 <br />

### __Incoming Desired Twin feature__
When you connect the device using the option in the tool, you will be able to receive desired twin requests. The incoming payloads will appear in a section called "Incoming Desired Twin". Use a cloud based tool of your choice i.e. IoT Central to send desired twin values to the device and observe the changes in the tool.

 <br />

### __URL Options__
You will need to provide parameters on the URL so that the tool has the correct context. Use the standard URL pattern to delimit parameters i.e.

```
http://localhost:4002?deviceId=<myDeviceId>&appId=<myAppId>
```

| Parameter | Description                                     | Mandatory | Type   | Default
|-----------|-------------------------------------------------|-----------|--------|-------
| appId     | The ID of the IoT Central application           |     Y     | string | n/a
| deviceId  | The ID of the device in IoT Central             |     Y     | string | n/a
| scopeId   | The Scop ID of the IoT Central application      |     N     | string | n/a
| sasKey    | A URL encoded string for the device's SaS Key   |     N     | string | n/a
| header    | Show the header bar (UX)                        |     N     | bool   | true
| cloud     | Show the Cloud Twin option (UX)                 |     N     | bool   | true
