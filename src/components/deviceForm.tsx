import './deviceForm.css';
import React from 'react';

import { AuthContext } from '../context/authContext';
import { DeviceContext } from '../context/deviceContext';
import { TextField } from '@fluentui/react/lib/TextField';
import { PrimaryButton, DefaultButton } from '@fluentui/react';
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator';
import { FontIcon } from '@fluentui/react/lib/Icon';
import { Link } from '@fluentui/react';
import { usePromise } from '../hooks/usePromise';

function DeviceForm() {
    const authContext = React.useContext<any>(AuthContext);
    const deviceContext = React.useContext<any>(DeviceContext);

    // set up the simulated device initialization call
    const [connectProgress, , , connectDevice] = usePromise({ promiseFn: () => deviceContext.setDevice(form, authContext) });

    // display the logged in user
    const [user, setUser] = React.useState<any>(authContext.loginAccount?.idTokenClaims?.preferred_username || '')

    // set up the form to capture the fields input
    const [form, setForm] = React.useState<any>({
        appId: deviceContext.appId,
        deviceId: deviceContext.deviceId,
        scopeId: deviceContext.scopeId,
        sasKey: deviceContext.sasKey,
    })
    
    // once connected, show the connect state
    const [connected, setConnected] = React.useState<boolean>(deviceContext.connected);

    // handler to update the form fields (onChange)
    const updateField = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    // set up the form from device context (if changed)
    React.useEffect(() => {
        setForm({
            appId: deviceContext.appId,
            deviceId: deviceContext.deviceId,
            scopeId: deviceContext.scopeId,
            sasKey: deviceContext.sasKey,
        })
    }, [deviceContext])

    // set up the logged in user's display name (if changed)
    React.useEffect(() => {
        setUser(authContext.loginAccount?.idTokenClaims?.preferred_username || '')
    }, [authContext])

    // set up the connected state (if changed)
    React.useEffect(() => {
        setConnected(deviceContext.connected);
    }, [deviceContext.connected])

    // render the UX
    return <div className='device-form'>
        <h3>Setup the user</h3>
        <p>Ensure the following user has been added to the IoT Central application before setting up the device.</p>
        <TextField value={user} label='Signed-in user' readOnly={true} />
        <p>If this is not the correct user, <Link onClick={() => authContext.signOut()} underline={true}>sign-out</Link> and sign back in with a different account.</p>
        <br />
        <h3>Setup the device to debug</h3>
        {!connectProgress && connected ?
            <>
                <p>Currently connected to device <b>{form.deviceId}</b></p>
                <DefaultButton onClick={() => { deviceContext.disconnectDevice() }}>Disconnect the device</DefaultButton>
            </> :
            <>
                <p>Please provide details for the device you would like to connect to and debug.</p>
                <TextField disabled={false} autoComplete='off' label='Application ID' required={true} name='appId' value={form.appId} onChange={updateField} />
                <TextField disabled={false} autoComplete='off' label='Device ID' required={true} name='deviceId' value={form.deviceId} onChange={updateField} />
                <TextField disabled={false} autoComplete='off' label='Scope ID' required={false} name='scopeId' value={form.scopeId} onChange={updateField} placeholder='Can be left blank' />
                <TextField disabled={false} autoComplete='off' label='SaS Key' required={false} name='sasKey' value={form.sasKey} onChange={updateField} placeholder='Can be left blank' />
                <br />
                <PrimaryButton onClick={() => { connectDevice() }}>Connect device</PrimaryButton>
                <br /><br />
                <div className='device-form-simulation'><FontIcon iconName='Warning' /><span>Simulated devices are not supported.</span></div>
                <br />
                {connectProgress ? <ProgressIndicator label='Connecting' /> : null}
            </>
        }
    </div>
}

export default DeviceForm