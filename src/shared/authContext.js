import * as msal from '@azure/msal-browser';
import * as React from 'react';

const AAD = {
    clientId: '',
    tenantId: '',
    redirect: 'http://localhost:3000'
}

const Scopes = {
    Central: 'https://apps.azureiotcentral.com/user_impersonation',
}

export const AuthContext = React.createContext({});

export class AuthProvider extends React.PureComponent {

    msalInstance = null;

    constructor(props) {
        super(props);
        this.msalInstance = new msal.PublicClientApplication({
            auth: {
                clientId: AAD.clientId,
                authority: 'https://login.microsoftonline.com/' + AAD.tenantId,
                redirectUri: 'http://localhost:3000'
            },
            cache: {
                cacheLocation: 'localStorage'
            }
        });
    }

    signIn = () => {
        if (this.state.authenticated) { return; }

        let loginAccount = {};
        this.msalInstance.handleRedirectPromise()
            .then((res) => {
                loginAccount = res ? res.data.value[0] : this.msalInstance.getAllAccounts()[0];
                return getAccessTokenForScope(this.msalInstance, Scopes.Central, loginAccount, AAD.redirect);
            })
            .then(() => {
                this.setState({ loginAccount, authenticated: true })
            })
            .catch(() => {
                console.log('Silent auth failed. User must sign in');
            });
    }

    signOut = () => {
        this.msalInstance.logout({ account: this.state.loginAccount });
    }

    getAccessToken = async () => {
        const res = await getAccessTokenForScope(this.msalInstance, Scopes.Central, this.state.loginAccount);
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

function getAccessTokenForScope(msalInstance, scope, account, redirect) {
    const tokenRequest = {
        scopes: Array.isArray(scope) ? scope : [scope],
        forceRefresh: false,
        redirectUri: redirect
    };

    if (account) { tokenRequest.account = account };

    return new Promise((resolve, reject) => {
        msalInstance.acquireTokenSilent(tokenRequest)
            .then((res) => {
                resolve(res)
            })
            .catch((err) => {
                if (err.name === 'BrowserAuthError') {
                    msalInstance.acquireTokenPopup(tokenRequest)
                        .then((res) => {
                            resolve(res)
                        })
                        .catch((err) => {
                            reject(err);
                        })

                } else {
                    reject(err);
                }
            });
    });
}