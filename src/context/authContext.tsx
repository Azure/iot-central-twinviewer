import { Config } from '../config';
import * as msal from '@azure/msal-browser';
import * as React from 'react';

function getAccessTokenForScope(msalInstance: any, scope: any, account: any) {
    const tokenRequest: any = {
        scopes: Array.isArray(scope) ? scope : [scope],
        forceRefresh: false,
        redirectUri: Config.AADRedirectURI
    };

    if (account) { tokenRequest.account = account };

    return new Promise((resolve, reject) => {
        msalInstance.acquireTokenSilent(tokenRequest)
            .then((res: any) => {
                resolve(res)
            })
            .catch((err: any) => {
                if (err.name === 'BrowserAuthError') {
                    msalInstance.acquireTokenPopup(tokenRequest)
                        .then((res: any) => {
                            resolve(res)
                        })
                        .catch((err: any) => {
                            reject(err);
                        })
                } else {
                    reject(err);
                }
            });
    });
}

export const Scopes = {
    Graph: 'User.Read',
    Central: 'https://apps.azureiotcentral.com/user_impersonation'
}

export const MsalConfig = {
    auth: {
        clientId: Config.AADClientID,
        authority: Config.AADLoginServer + '/' + Config.AADDirectoryID,
        redirectUri: Config.AADRedirectURI
    },
    cache: {
        cacheLocation: 'localStorage'
    }
}

export const AuthContext = React.createContext({});

export class AuthProvider extends React.PureComponent {

    private msalInstance: any = null;

    constructor(props: any) {
        super(props);
        this.msalInstance = new msal.PublicClientApplication(MsalConfig);
    }

    signIn = () => {
        if (this.state.authenticated) { return; }

        let loginAccount: any = {};
        this.msalInstance.handleRedirectPromise()
            .then((res: any) => {
                loginAccount = res ? res.data.value[0] : this.msalInstance.getAllAccounts()[0];
                return getAccessTokenForScope(this.msalInstance, Scopes.Graph, loginAccount);
            })
            .then((res: any) => {
                loginAccount = res;
                return getAccessTokenForScope(this.msalInstance, Scopes.Central, loginAccount);
            })
            .then(() => {
                this.setState({ loginAccount, authenticated: true })
            })
            .catch(() => {
                console.log('Silent auth failed. User must sign in');
            });
    }

    signOut = () => {
        this.msalInstance.logout();
    }

    getAccessToken = async () => {
        const res: any = await getAccessTokenForScope(this.msalInstance, Scopes.Central, this.state.loginAccount);
        return res.accessToken;
    }

    state = {
        authenticated: false,
        loginAccount: {},
        signIn: this.signIn,
        signOut: this.signOut,
        getAccessToken: this.getAccessToken
    }

    render() {
        return (
            <AuthContext.Provider value={this.state}>
                { this.props.children}
            </AuthContext.Provider>
        )
    }
}