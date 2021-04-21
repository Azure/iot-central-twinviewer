# Twin Viewer
An application to to view and interact with the Device Twin from IoT Central, IoT Hub and the device

## AAD configuration updates
After cloning this repo, you will need to update part of the configuration to use the AAD application that you set up to authenticate and authorize to use Central APIs. You will also need to access to MS Graph but **not** ARM resources/scopes to use this tool. To get help setting up an AAD application to use IoT Central resources visit [this](https://github.com/iot-for-all/iotc-aad-setup) repo.

In the [config.tsx](/src/config.tsx) file, find the block of code near the top of the file that has the following object and update the guid in the configuration to use the values of your AAD application

Example
```
export const Config = {
    AADLoginServer: 'https://login.microsoftonline.com',
    AADClientID: '532607b1-ce64-4fd3-b48f-5d7d803e0774',
    AADDirectoryID: 'c26906ba-01b0-48ec-afd2-ad8a55b1b0fb',
    AADRedirectURI: 'http://localhost:4002',
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
When launched, the tool will ask you to sign in using the same account you use to access your IoT Central application (as given by the app id). If you are already signed in, you will be silently auth'd. Once auth'd you will be prompted you will be asked to setup the device. Following the instructions in the tool

This a summary of the UX features

| Action                    | Description                                                
|---------------------------|------------------------------------------------------------
| Help                      | Use the help panel to set up the device identity (overrides the URL)
| Get Central Twin          | Use the Azure IoT Central API to get the device twin properties 
| Get Cloud Twin            | Use the Azure IoT Service SDK to get the device twin from the Cloud
| Get Device Twin           | Use the Azure IoT Device SDK to get the LKV of the Twin on the Cloud
| Send Reported Device Twin | (For convenience) Send a reported twin value to the cloud as if it was coming from the device
| Send Telemetry            | (For convenience) Send a telemetry value to the cloud as if it was coming from the device


### __Incoming Desired Twin feature__
When you connect the device, you will be able to receive desired twin requests. The incoming payloads will appear in a section called "Incoming Desired Twin". Use a cloud based tool of your choice i.e. IoT Central to send desired twin values to the device and observe the changes in the tool.

### __Setting up the device__
You can use the Help panel inside the tool to set up the application and device identity. You can also provide parameters on the URL so that the tool will start with the correct application and device context. Use the standard URL query string pattern to delimit parameters i.e.

```
http://localhost:4002?deviceId=<myDeviceId>&appId=<myAppId>
```

| Parameter | Description                                     | Mandatory | Type   | Default
|-----------|-------------------------------------------------|-----------|--------|-------
| appId     | The ID of the IoT Central application           |     Y     | string | n/a
| deviceId  | The ID of the device in IoT Central             |     Y     | string | n/a
| scopeId   | The Scop ID of the IoT Central application      |     N     | string | n/a
| sasKey    | A URI encoded string for the device's SaS Key   |     N     | string | n/a
| header    | Show the header bar (UX)                        |     N     | bool   | true
| cloud     | Show the Cloud Twin option (UX)                 |     N     | bool   | true
