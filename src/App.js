import React, { useState, useEffect } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import Cookies from 'universal-cookie';
import webSocket from 'socket.io-client'
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Card from '@material-ui/core/Card';
import './App.css';

var host = 'https://rockie-stockAlertServer.herokuapp.com'

const App = () => {
  const cookies = new Cookies();
  const clientId = "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com"

  const [login, setLogin] = useState({})
  const [ws, setWs] = useState(null)
  const [stockNotify, setStockNotify] = useState([])
  const connectWebSocket = () => {
    //開啟
    setWs(webSocket(host))
  }

  useEffect(() => {
    if (ws) {
      //連線成功在 console 中打印訊息
      console.log('success connect!')
      //設定監聽
      initWebSocket()
    }
  }, [ws]);

  useEffect(() => {
    if (Object.keys(login).length !== 0) {
      console.log('do test')
      test()
    }
  }, [login]);

  const initWebSocket = () => {
    // Server 通知完後再傳送 disConnection 通知關閉連線
    ws.on('disConnection', () => {
      ws.close()
    })
  }

  const fun_login = (response) => {
    if (response.hasOwnProperty('tokenId')) {
      let email = response.Qt.zu
      let newLoginObj = { id: response.tokenId, username: response.Qt.Ad, photo: response.Qt.gL, email: email }
      setLogin(prevState => {
        return { ...prevState, ...newLoginObj }
      });
      cookies.set('id', response.tokenId, { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host });
      //this.getAccountInfo(response.w3.U3)

      //getstockNotify
      if (window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') {
        host = 'http://localhost:8080'
      }
      console.log(email)
      fetch(host + '/select/stockNotify', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email//login.email
        })
      })
        .then(res => res.json())
        .then((result) => {
          console.log(result)
          for (let i = 0; i < result.length; i++) {
            if (!stockNotify.some(e => e._id === result[i]._id)) {
              setStockNotify(prevState => {
                prevState.push(result[i])
                return prevState
              });
            }
          }
        })
    }
  }
  const fun_logout = () => {
    setLogin(prevState => {
      return {}
    });
    cookies.remove('id', { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host })
  }
  const test = () => {//run when have login object
    console.log('test')
    connectWebSocket()
    /*if (typeof cookies.get('id') !== 'undefined' && cookies.get('id') !== '') {
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
            
          } else if (result.hasOwnProperty('error_description')) {
            cookies.remove('id')
          }
          console.log(result)
        })
        .catch((err) => {
          console.log(err)
        })
    }*/
  }
  const test2 = () => {
    console.log('test2')
  }
  return (
    <Box bgcolor="text.disabled" style={{ height: '99vh' }}>
      <Toolbar style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          stockAlertClient
      </Typography>
        {Object.keys(login).length === 0
          ?
          <GoogleLogin
            clientId={clientId}
            buttonText="Login"
            onSuccess={fun_login}
            onFailure={fun_login}
            cookiePolicy={'single_host_origin'}
            isSignedIn={true}
          />
          :
          <GoogleLogout
            clientId={clientId}
            buttonText="Logout"
            onLogoutSuccess={fun_logout}
          ></GoogleLogout>
        }
      </Toolbar>
      <Typography align='right'>

      </Typography>
      <Box margin={2} overflow="auto">
        <Box marginX="auto" maxWidth={1000} width="75%" minWidth={500}>
          <Typography align='right'>
            <Button variant="contained">Default</Button>
          </Typography>
          <Card>
            {stockNotify.length !== 0
              ?
              stockNotify.map((row, index) => (<div>test</div>))
              :
              null
            }

            <FormControlLabel
              control={
                <Switch
                  checked={true}
                  onChange={test2}
                  name="checkedB"
                  color="primary"
                />
              }
              label="Primary"
            />
          </Card>

        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
        test
      </Box>
      </Box>

    </Box>
  );
}
//chart:https://canvasjs.com/docs/charts/integration/react/
export default App;
