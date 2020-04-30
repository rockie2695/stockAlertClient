import React, { useState, useEffect } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import Cookies from 'universal-cookie';
import './App.css';

const App = () => {
  const cookies = new Cookies();
  const clientId = "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com"
  //this clientId is wrong please create in https://developers.google.com/identity/sign-in/web/sign-in

  const [login, setLogin] = useState(null)

  const responseGoogle = (response) => {
    console.log(response)
    if (response.hasOwnProperty('tokenId')) {
      //this.setState({ login: { id: response.tokenId, username: response.w3.ig, photo: response.w3.Paa, email: response.w3.U3 } })
      //cookies.set('id', response.tokenId, { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host });
      //this.getAccountInfo(response.w3.U3)
    }
  }

  return (
    <Toolbar style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
      <Typography variant="h6" style={{ flexGrow: 1 }}>
        stockAlertClient
      </Typography>
      <GoogleLogin
        clientId={clientId}
        buttonText="Login"
        onSuccess={responseGoogle}
        onFailure={responseGoogle}
        cookiePolicy={'single_host_origin'}
        isSignedIn={false}
      />
    </Toolbar>
  );
}

export default App;
