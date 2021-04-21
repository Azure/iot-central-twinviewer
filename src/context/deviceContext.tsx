import { AzDpsClient } from '../lib/AzDpsClient.js'
import { AzIoTHubClient } from '../lib/AzIoTHubClient.js'

import * as React from 'react';
import axios from 'axios';

// this creates a real device client in the browser
async function connectBrowserDevice(deviceId: any, scopeId: any, sasKey: any, setDesired: any) {
    const dpsClient = new AzDpsClient(scopeId, deviceId, sasKey);
    const result = await dpsClient.registerDevice();
    if (result.status === 'assigned') {
        const host = result.registrationState.assignedHub;

        const client = new AzIoTHubClient(host, deviceId, sasKey);
        client.setDirectMehodCallback((method: any, payload: any, rid: any) => {
            // not exposed in the UX    
        });

        client.setDesiredPropertyCallback((desired: any) => {
            setDesired(JSON.parse(desired || ''));
        });

        client.disconnectCallback = ((err: any) => {
            console.log(err)
            console.log('Disconnected');
        });

        await client.connect();
        return client;
    } else {
        return { 'error': 'NOTASSIGNED: ' + result.status };
    }
}

async function getCentralDeviceCreds(deviceId: any, appId: any, authContext: any) {
    try {
        const at = await authContext.getAccessToken();
        const credentials = await axios(`https://${appId}.azureiotcentral.com/api/preview/devices/${deviceId}/credentials`, { headers: { "Authorization": "Bearer " + at } });
        return credentials.data;
    } catch (err) {
        throw err
    }
}

export interface DeviceContextState {
    connected: boolean,
    client: any,
    appId: string,
    deviceId: string,
    scopeId: string,
    sasKey: string,
    twinDesired: any,
    setDevice: any,
    connectDevice: any
    disconnectDevice: any
}

export const DeviceContext = React.createContext({});

export class DeviceProvider extends React.PureComponent {

    constructor(props: any) {
        super(props);

        const urlParams = new URLSearchParams(window.location.search);
        this.state.appId = urlParams && urlParams.get('appId') ? urlParams.get('appId') || '' : '';
        this.state.deviceId = urlParams && urlParams.get('deviceId') ? urlParams.get('deviceId') || '' : '';
        this.state.scopeId = urlParams && urlParams.get('scopeId') ? urlParams.get('scopeId') || '' : '';
        this.state.sasKey = urlParams && urlParams.get('sasKey') ? decodeURI(urlParams.get('sasKey') || '') : '';
    }

    async connectDevice() {
        const res: any = await connectBrowserDevice(this.state.deviceId, this.state.scopeId, this.state.sasKey, this.setDesired.bind(this))
        this.setState({ client: res, connected: res ? true : false });
    }

    async disconnectDevice() {
        this.setState({
            connected: false,
            client: null,
            appId: '',
            deviceId: '',
            scopeId: '',
            sasKey: '',
            twinDesired: {}
        })
    }

    async setDevice({ appId, deviceId, scopeId, sasKey }: { appId: string, deviceId: string, scopeId: string, sasKey: string }, authContext: any) {
        if (scopeId === '' || sasKey === '') {
            const creds: any = await getCentralDeviceCreds(deviceId, appId, authContext);
            scopeId = creds.idScope
            sasKey = creds.symmetricKey.primaryKey
        }
        const client: any = await connectBrowserDevice(deviceId, scopeId, sasKey, this.setDesired.bind(this))
        this.setState({ client, appId, deviceId, scopeId, sasKey, connected: client ? true : false });
    }

    setDesired(data: any) {
        this.setState({ twinDesired: data });
    }

    state: DeviceContextState = {
        connected: false,
        client: null,
        appId: '',
        deviceId: '',
        scopeId: '',
        sasKey: '',
        twinDesired: {},
        setDevice: this.setDevice.bind(this),
        connectDevice: this.connectDevice.bind(this),
        disconnectDevice: this.disconnectDevice.bind(this)
    }

    render() {
        return (
            <DeviceContext.Provider value={this.state}>
                { this.props.children}
            </DeviceContext.Provider>
        )
    }
}