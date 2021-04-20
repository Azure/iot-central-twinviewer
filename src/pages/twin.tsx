import React from 'react';
import axios from 'axios';
import './twin.css';
import { AuthContext } from '../context/authContext';
import { Json } from '../components/json'
import { usePromise } from '../hooks/usePromise';
import { AzDpsClient } from '../lib/AzDpsClient.js'
import { AzIoTHubClient } from '../lib/AzIoTHubClient.js'
import ClipLoader from "react-spinners/ClipLoader";
import { FontIcon } from '@fluentui/react/lib/Icon';
import { Panel, PanelType, IPanelProps } from '@fluentui/react/lib/Panel';
import { IRenderFunction } from '@fluentui/react/lib/Utilities';
import { PrimaryButton } from '@fluentui/react';
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator';

import Monaco from '../components/monaco';

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

async function getCentralTwin(deviceId: any, appId: any, authContext: any) {
  try {
    const at = await authContext.getAccessToken();
    const properties = await axios(`https://${appId}.azureiotcentral.com/api/preview/devices/${deviceId}/properties`, { headers: { "Authorization": "Bearer " + at } });
    const credentials = await axios(`https://${appId}.azureiotcentral.com/api/preview/devices/${deviceId}/credentials`, { headers: { "Authorization": "Bearer " + at } });
    return { twin: properties.data, credentials: credentials.data };
  } catch (err) {
    throw err
  }
}

async function getCloudTwin(deviceId: any, appId: any, authContext: any) {
  let hubs: any = {};
  try {
    const at = await authContext.getAccessToken();
    hubs = await axios.post(`https://${appId}.azureiotcentral.com/system/iothubs/generateSasTokens`, {}, { headers: { "Authorization": "Bearer " + at } });
  } catch {
    throw new Error('Device not found');
  }

  for (const key in hubs.data) {
    try {
      const res = await axios.get('/api/twin/' + deviceId, { headers: { "Authorization": hubs.data[key].iothubTenantSasToken.sasToken } })
      return res.data;
    } catch {
      // an error means the twin is not found or cannot be fetched. Just move to the next hub
    }
  }
  throw new Error('Device not found');
}

async function getDeviceTwin(client: any) {
  try {
    const twin = await client.getTwin();
    return { reported: twin.reported, desired: twin.desired }
  } catch (err) {
    console.log(err);
  }
}

async function writeDeviceTwin(client: any, payload: any) {
  try {
    const updateResult = await client.updateTwin(JSON.stringify(payload));
    if (updateResult === 204) {
      const twin = await client.getTwin()
      return { reported: twin.reported, desired: twin.desired }
    }
  }
  catch (err) {
    console.log(err);
  }
}

async function writeDeviceTelemetry(client: any, payload: any) {
  try {
    await client.sendTelemetry(JSON.stringify(payload));
    return payload; // just return something
  }
  catch (err) {
    console.log(err);
  }
}

function App() {

  // provide access to authentication and authorization results
  const authContext = React.useContext<any>(AuthContext);

  // the desired twin payload received when the device is connected
  const [desired, setDesired] = React.useState<any>({});

  const [helpPanel, showHelpPanel] = React.useState<boolean>(false);

  // the reported twin as typed in by the user
  const [reportedTwin, setReportedTwin] = React.useState<any>({});

  // the reported telemetry as typed in by the user
  const [reportedTelemetry, setReportedTelemetry] = React.useState<any>({});

  // use url params to provide the deviceId and application Id (mandatory)
  const urlParams = new URLSearchParams(window.location.search);
  const appId = urlParams && urlParams.get('appId') ? urlParams.get('appId') : '';
  const deviceId = urlParams && urlParams.get('deviceId') ? urlParams.get('deviceId') : '';
  const headerUx = urlParams && urlParams.get('header') && urlParams.get('header') === "false" ? false : true;
  const cloudUx = urlParams && urlParams.get('cloud') && urlParams.get('cloud') === "false" ? false : true;

  // all the async data loading methods
  const [progressFetchCentralTwin, centralTwin, , fetchCentralTwin] = usePromise({ promiseFn: () => getCentralTwin(deviceId, appId, authContext) });
  const [progressFetchCloudTwin, cloudTwin, , fetchCloudTwin] = usePromise({ promiseFn: () => getCloudTwin(deviceId, appId, authContext) });
  const [progressFetchDeviceClient, deviceTwinClient, , fetchDeviceTwinClient] = usePromise({ promiseFn: () => connectBrowserDevice(deviceId, scopeId, sasKey, setDesired) });
  const [progressFetchDeviceTwin, deviceTwin, , fetchDeviceTwin] = usePromise({ promiseFn: () => getDeviceTwin(deviceTwinClient) });
  const [progressSendDeviceTwin, , , sendDeviceTwin] = usePromise({ promiseFn: () => writeDeviceTwin(deviceTwinClient, reportedTwin) });
  const [progressSendDeviceTelemetry, , , sendDeviceTelemetry] = usePromise({ promiseFn: () => writeDeviceTelemetry(deviceTwinClient, reportedTelemetry) });

  // use the url to override (or shortcut) getting the scopeId and sasKey
  const scopeId = urlParams && urlParams.get('scopeId') ? urlParams.get('scopeId') : centralTwin ? centralTwin.credentials.idScope : '';
  const sasKey = urlParams && urlParams.get('sasKey') ? decodeURI(urlParams.get('sasKey') || '') : centralTwin ? centralTwin.credentials.symmetricKey.primaryKey : '';

  // first render cycle. do silent authentication
  React.useEffect(() => {
    authContext.signIn();
  }, [authContext]);

  const onRenderNavigationContent: IRenderFunction<IPanelProps> = React.useCallback(
    (props, defaultRender) => (
      <div className='help-panel-header'>
        <div className='help'>
          <button onClick={() => showHelpPanel(false)}><FontIcon iconName='Unknown' />Help</button>
        </div>
        {defaultRender!(props)}
      </div>
    ),
    [],
  );

  // main render
  return !authContext.authenticated ?
    <div className="page page-initial">
      <h2>Please wait</h2>
      <ProgressIndicator label="Waiting for authentication" />
    </div>
    :
    <div className="page">
      <Panel
        headerText=""
        hasCloseButton={false}
        isLightDismiss={true}
        type={PanelType.customNear}
        isOpen={helpPanel}
        customWidth={'320px'}
        onDismiss={() => { showHelpPanel(false) }}
        onRenderNavigationContent={onRenderNavigationContent}
      ></Panel>

      {!headerUx ? null :
        // <div className="header">Device ID: {deviceId === '' ? '(Need Device ID)' : deviceId} / Application ID: {appId === '' ? '(Need Application ID)' : appId} / Scope ID: {scopeId === '' ? '(Get From Central Twin call)' : scopeId} / Sas Key ID: {sasKey === '' ? '(Get From Central Twin call)' : sasKey}</div>
        <div className='help'>
          <button onClick={() => showHelpPanel(true)}><FontIcon iconName='Unknown' />Help</button>
        </div>
      }

      <div className='layout'>

        <div className="column">
          <div className="option">
            <h5>Platform: Azure IoT Central</h5>
            <h2>Central Twin</h2>
            <label>Get the Central version of Twin using the REST API</label>
            <PrimaryButton className="btn-inline" onClick={() => { fetchCentralTwin() }}>Get Central Twin</PrimaryButton>
          </div>
          {centralTwin ? <Monaco data={centralTwin.twin} /> : progressFetchCentralTwin ? <ProgressIndicator label="Fetching" /> : null}
        </div>

        {!cloudUx ? null :
          <div className="column">
            <div className="option">
              <h5>Platform: Azure IoT Hub</h5>
              <h2>Cloud Twin</h2>
              <label>Get the Cloud/Hub version of the Twin using the Service SDK</label>
              <PrimaryButton className="btn-inline" onClick={() => { fetchCloudTwin() }}>Get Cloud Twin</PrimaryButton>
            </div>
            {cloudTwin ? <Monaco data={cloudTwin} /> : progressFetchCloudTwin ? <ProgressIndicator label="Fetching" /> : null}
          </div>
        }

        <div className="column">
          <div className="option">
            <h5>Platform: Device</h5>
            <h2>Device Twin</h2>
            <label>Connect a simulated version of this device and see the Twin using the Device SDK</label>
            <div className="btn-bar">
              <PrimaryButton className="btn-inline" disabled={scopeId === '' || sasKey === ''} onClick={() => { fetchDeviceTwinClient() }}>
                <span>{deviceTwinClient ? "Re-Connect" : "Connect"}</span>
                <span>{progressFetchDeviceClient ? <ClipLoader size={8} /> : null}</span>
              </PrimaryButton>
              <PrimaryButton className="btn-inline" onClick={() => { fetchDeviceTwin() }}>
                <span>Get Device Twin</span>
                <span>{progressFetchDeviceTwin ? <ClipLoader size={8} /> : null}</span>
              </PrimaryButton>
            </div>
          </div>
          <div className="editor">
            {deviceTwinClient ?
              <>
                <div className='small-editor'>
                  {deviceTwin && !progressFetchDeviceTwin ? <Json json={deviceTwin} liveUpdate={true} className='small-editor' /> : progressFetchDeviceTwin ? 'Fetching' : 'Click to view the latest version of the Cloud\'s full Twin from the device'}
                </div>
                <h4>Incoming Desired Twin</h4>
                {desired ? <Json json={desired} liveUpdate={true} className='last-editor' /> : "Waiting... Send a desired property to this device from your cloud based application i.e. IoT Central"}
              </>
              : progressFetchDeviceClient ? "Connecting" : ""}
          </div>
        </div>

        <div className="column">
          <div className="option">
            <h5>Platform: Device</h5>
            <h2>Report a Device Twin</h2>
            <label>Send a reported device twin back to the hub using the Device SDK</label>
            <PrimaryButton className="btn-inline" disabled={!deviceTwinClient} onClick={() => { sendDeviceTwin() }}>
              <span>Send Reported Device Twin</span>
              <span>{progressSendDeviceTwin ? <ClipLoader size={8} /> : null}</span>
            </PrimaryButton>
          </div>
          <div className="editor">
            {deviceTwinClient ? <Json json={reportedTwin} onChange={setReportedTwin} liveUpdate={false} className='tall-editor' /> : ""}
          </div>
        </div>

        <div className="column">
          <div className="option">
            <h5>Platform: Device</h5>
            <h2>Report Telemetry</h2>
            <label>Send telemetry back to the hub using the Device SDK</label>
            <PrimaryButton className="btn-inline" disabled={!deviceTwinClient} onClick={() => { sendDeviceTelemetry() }}>
              <span>Send Telemetry</span>
              <span>{progressSendDeviceTelemetry ? <ClipLoader size={8} /> : null}</span>
            </PrimaryButton>
          </div>

          <div className="editor">
            {deviceTwinClient ? <Json json={reportedTelemetry} onChange={setReportedTelemetry} liveUpdate={false} className='tall-editor' /> : ""}
          </div>

        </div>
      </div>
    </div >
}

export default App;
