import React, { useState, useEffect } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import Cookies from 'universal-cookie';
import './App.css';

var host = 'https://stockAlertServer.herokuapp.com'

const App = () => {
  const cookies = new Cookies();
  const clientId = "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com"
  //this clientId is wrong please create in https://developers.google.com/identity/sign-in/web/sign-in

  const [login, setLogin] = useState({})

  useEffect(() => {
    test()
  }, []);

  const responseGoogle = (response) => {
    console.log(response)
    if (response.hasOwnProperty('tokenId')) {
      let newLoginObj = { id: response.tokenId, username: response.Qt.Ad, photo: response.Qt.gL, email: response.Qt.zu }
      setLogin(prevState => {
        return { ...prevState, ...newLoginObj }
      });
      cookies.set('id', response.tokenId, { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host });
      //this.getAccountInfo(response.w3.U3)

      //getstockNotify
      if (window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') {
        host = 'http://localhost:8080'
      }
      fetch(host + '/select/stockNotify', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'rockie2695@yahoo.com.hk'//login.email
        })
      })
        .then(res => res.json())
        .then((result) => {
          console.log(result)
        })
    }
  }
  const test = () => {
    console.log('test')
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
        isSignedIn={true}
      />
    </Toolbar>
  );
}

export default App;
