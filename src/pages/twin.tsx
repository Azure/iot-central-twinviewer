import './twin.css';

import React from 'react';
import axios from 'axios';

import { AuthContext } from '../context/authContext';
import { DeviceContext } from '../context/deviceContext';
import { usePromise } from '../hooks/usePromise';

import { FontIcon } from '@fluentui/react/lib/Icon';
import { Panel, PanelType, IPanelProps } from '@fluentui/react/lib/Panel';
import { IRenderFunction } from '@fluentui/react/lib/Utilities';
import { PrimaryButton } from '@fluentui/react';
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator';
import { TeachingBubble } from '@fluentui/react/lib/TeachingBubble';
import { IButtonProps } from '@fluentui/react/lib/Button';
import { DirectionalHint } from '@fluentui/react/lib/Callout';

import Monaco from '../components/monaco';
import DeviceForm from '../components/deviceForm';
import ClipLoader from "react-spinners/ClipLoader";

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
    const updateResult = await client.updateTwin(payload);
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
    await client.sendTelemetry(payload);
    return payload; // just return something
  }
  catch (err) {
    console.log(err);
  }
}

function App() {

  // provide access to authentication and authorization results
  const authContext = React.useContext<any>(AuthContext);
  const deviceContext = React.useContext<any>(DeviceContext);

  // the desired twin payload received when the device is connected
  const [connected, setConnected] = React.useState<any>(deviceContext.connected);
  const [desired, setDesired] = React.useState<any>({});
  const [deviceTwinClient, setDeviceTwinClient] = React.useState<any>(null);

  const [helpPanel, showHelpPanel] = React.useState<boolean>(false);
  const [teaching, showTeaching] = React.useState<boolean>(true);

  // the reported twin as typed in by the user
  const [reportedTwin, setReportedTwin] = React.useState<any>({});

  // the reported telemetry as typed in by the user
  const [reportedTelemetry, setReportedTelemetry] = React.useState<any>({});

  // // use url params to provide the deviceId and application Id (mandatory)
  const urlParams = new URLSearchParams(window.location.search);
  const headerUx = urlParams && urlParams.get('header') && urlParams.get('header') === "false" ? false : true;
  const cloudUx = urlParams && urlParams.get('cloud') && urlParams.get('cloud') === "false" ? false : true;

  // all the async data loading methods
  //const [progressFetchDeviceClient, deviceTwinClient, , fetchDeviceTwinClient] = usePromise({ promiseFn: () => deviceContext.connectDevice() });

  const [progressFetchCentralTwin, centralTwin, , fetchCentralTwin] = usePromise({ promiseFn: () => getCentralTwin(deviceContext.deviceId, deviceContext.appId, authContext) });
  const [progressFetchCloudTwin, cloudTwin, , fetchCloudTwin] = usePromise({ promiseFn: () => getCloudTwin(deviceContext.deviceId, deviceContext.appId, authContext) });
  const [progressFetchDeviceTwin, deviceTwin, , fetchDeviceTwin] = usePromise({ promiseFn: () => getDeviceTwin(deviceTwinClient) });
  const [progressSendDeviceTwin, , , sendDeviceTwin] = usePromise({ promiseFn: () => writeDeviceTwin(deviceTwinClient, reportedTwin) });
  const [progressSendDeviceTelemetry, , , sendDeviceTelemetry] = usePromise({ promiseFn: () => writeDeviceTelemetry(deviceTwinClient, reportedTelemetry) });

  // first render cycle. do silent authentication
  React.useEffect(() => {
    authContext.signIn();
  }, [authContext]);

  React.useEffect(() => {
    setConnected(deviceContext.connected);
  }, [deviceContext.connected])

  React.useEffect(() => {
    setDeviceTwinClient(deviceContext.client);
  }, [deviceContext.client])

  React.useEffect(() => {
    setDesired(deviceContext.twinDesired);
  }, [deviceContext.twinDesired])

  React.useEffect(() => {
    if (deviceTwinClient) {
      fetchDeviceTwin();
      fetchCentralTwin();
      fetchCloudTwin();
    }
  }, [deviceTwinClient])

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

  const primaryButtonProps: IButtonProps = {
    children: 'OK',
    onClick: () => showTeaching(false)

  };

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
        onRenderNavigationContent={onRenderNavigationContent}>
        <DeviceForm />
      </Panel>

      {!headerUx ? null : <>
        <div className="header">
          <div className='help'>
            <button id='help' onClick={() => showHelpPanel(true)}><FontIcon iconName='Unknown' />Help</button>
          </div>
          <div>{connected ? 'DEVICE CONNECTED' : 'DEVICE NOT CONNECTED'}</div>
        </div>

        {!teaching ? null :
          <TeachingBubble target="#help" primaryButtonProps={primaryButtonProps} headline="Setup Twin Viewer" calloutProps={{ directionalHint: DirectionalHint.bottomCenter }}>
            Use Help to setup the application and device for the twin you would like to debug.
        </TeachingBubble>
        }
      </>
      }

      <div className='layout'>

        <div className="column">
          <div className="option">
            <h5>Platform: Azure IoT Central</h5>
            <h2>Central Twin</h2>
            <label>View the device's twin using the IoT Central Public REST API</label>
            <PrimaryButton className="btn-inline" disabled={!deviceTwinClient} onClick={() => { fetchCentralTwin() }}>Get Central Twin</PrimaryButton>
          </div>
          {centralTwin && deviceContext.connected ? <Monaco data={centralTwin.twin} size='full' /> : progressFetchCentralTwin ? <ProgressIndicator label="Fetching" /> : null}
        </div>

        {!cloudUx ? null :
          <div className="column">
            <div className="option">
              <h5>Platform: Azure IoT Hub</h5>
              <h2>Cloud Twin</h2>
              <label>View the device's twin in the Cloud/IoT Hub using the Service SDK</label>
              <PrimaryButton className="btn-inline" disabled={!deviceTwinClient} onClick={() => { fetchCloudTwin() }}>Get Cloud Twin</PrimaryButton>
            </div>
            {cloudTwin && deviceContext.connected ? <Monaco data={cloudTwin} size='full' /> : progressFetchCloudTwin ? <ProgressIndicator label="Fetching" /> : null}
          </div>
        }

        <div className="column">
          <div className="option">
            <h5>Platform: Device</h5>
            <h2>Device Twin</h2>
            <label>A simulated version of the device using the Device SDK</label>
            <div className="btn-bar">
              <PrimaryButton className="btn-inline" disabled={!deviceTwinClient} onClick={() => { fetchDeviceTwin() }}>
                <span>Get Device Twin</span>
                <span>{progressFetchDeviceTwin ? <ClipLoader size={8} /> : null}</span>
              </PrimaryButton>
            </div>
          </div>
          {deviceTwinClient ?
            <>
              {deviceTwin && !progressFetchDeviceTwin ? <Monaco data={deviceTwin} size='medium' /> : progressFetchDeviceTwin ? 'Fetching' : 'Click to view the latest version of the Cloud\'s full Twin from the device'}
              <h4>Incoming Desired Twin</h4>
              {desired ? <Monaco data={desired} size='small' /> : "Waiting... Send a desired property to this device from your cloud based application i.e. IoT Central"}
            </>
            : ""}
        </div>

        <div className="column">
          <div className="option">
            <h5>Platform: Device</h5>
            <h2>Report a Device Twin</h2>
            <label>Send a reported device twin to the hub using the Device SDK</label>
            <PrimaryButton className="btn-inline" disabled={!deviceTwinClient} onClick={() => { sendDeviceTwin() }}>
              <span>Send Reported Device Twin</span>
              <span>{progressSendDeviceTwin ? <ClipLoader size={8} /> : null}</span>
            </PrimaryButton>
          </div>
          {deviceTwinClient ? <Monaco data={reportedTwin} onChange={setReportedTwin} size='full' /> : ""}
        </div>

        <div className="column">
          <div className="option">
            <h5>Platform: Device</h5>
            <h2>Report Telemetry</h2>
            <label>Send telemetry to the hub using the Device SDK</label>
            <PrimaryButton className="btn-inline" disabled={!deviceTwinClient} onClick={() => { sendDeviceTelemetry() }}>
              <span>Send Telemetry</span>
              <span>{progressSendDeviceTelemetry ? <ClipLoader size={8} /> : null}</span>
            </PrimaryButton>
          </div>
          {deviceTwinClient ? <Monaco data={reportedTelemetry} onChange={setReportedTelemetry} size='full' /> : ""}
        </div>
      </div>
    </div >
}

export default App;
