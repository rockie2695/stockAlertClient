import React, { useState, useEffect } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import Cookies from 'universal-cookie';
import webSocket from 'socket.io-client'
import './App.css';

var host = 'https://rockie-stockAlertServer.herokuapp.com'

const App = () => {
  const cookies = new Cookies();
  const clientId = "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com"

  const [login, setLogin] = useState({})
  const [ws, setWs] = useState(null)
  const connectWebSocket = () => {
    //開啟
    setWs(webSocket(host))
  }

  useEffect(() => {
    if (Object.keys(login).length !== 0) {
      console.log('do test')
      //test()
    }
    if (ws) {
      //連線成功在 console 中打印訊息
      console.log('success connect!')
      //設定監聽
      //initWebSocket()
    }
  }, [ws, login]);

  const initWebSocket = () => {
    // Server 通知完後再傳送 disConnection 通知關閉連線
    ws.on('disConnection', () => {
      ws.close()
    })
  }

  const responseGoogle = (response) => {
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
      console.log(login.email)
      fetch(host + '/select/stockNotify', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'rockie2695@gmail.com'//login.email
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
    if (typeof cookies.get('id') !== 'undefined' && cookies.get('id') !== '') {
      fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + cookies.get('id'), {
        method: 'get',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then((result) => {
          if (result.hasOwnProperty('aud') && result.hasOwnProperty('azp') && result.aud === clientId && result.azp === clientId) {
            let newLoginObj = { id: cookies.get('id'), username: result.name, photo: result.picture, email: result.email }
            setLogin(prevState => {
              return { ...prevState, ...newLoginObj }
            });
            cookies.set('id', cookies.get('id'), { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host });
            connectWebSocket()
          } else if (result.hasOwnProperty('error_description')) {
            cookies.remove('id')
          }
          console.log(result)
        })
        .catch((err) => {
          console.log(err)
        })
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
        isSignedIn={true}
      />
    </Toolbar>
  );
}

export default App;
