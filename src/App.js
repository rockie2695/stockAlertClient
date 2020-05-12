import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import useScrollTrigger from '@material-ui/core/useScrollTrigger';
import Typography from '@material-ui/core/Typography';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import Cookies from 'universal-cookie';
import webSocket from 'socket.io-client'
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';
import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
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
  const useStyles = makeStyles((theme) => ({
    root: {
      '& > *': {
        margin: theme.spacing(1),
      },
    }
  }))
  const classes = useStyles();
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

  function ElevationScroll(props) {
    const { children } = props;
    // Note that you normally won't need to set the window ref as useScrollTrigger
    // will default to window.
    // This is only being set here because the demo is in an iframe.
    const trigger = useScrollTrigger();
    console.log(trigger)
    return React.cloneElement(children, {
      elevation: trigger ? 4 : 0,
    });
  }
  return (
    <Box bgcolor="text.disabled" style={{ height: '100%', minHeight: '100vh' }}>
      <ElevationScroll {...App.props}>
        <AppBar color="default" position="sticky" top={0}>
          <Toolbar>
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
        </AppBar>
      </ElevationScroll>


      <Box position="relative">
        <Box position="fixed" zIndex="0" width="100%" height="50%" minHeight="50vh" bgcolor="text.primary" color="background.paper" display="flex" alignItems="center" justifyContent="center">
          <Typography align="center" variant="h2">
            For Stock Price Showing And Notification
        </Typography>
        </Box>
        <Box height="50%" minHeight="50vh">

        </Box>
      </Box>
      <Box padding={3} overflow="auto" position="relative">
        <Box marginX="auto" maxWidth={1000} width="75%" minWidth={500}>
          <Paper elevation={0}>
            <Typography align='right' className={classes.root}>
              <Button variant="contained" margin={1}>Default</Button>
              <Button variant="contained">Default</Button>
            </Typography>
            {stockNotify.length !== 0
              ?
              stockNotify.map((row, index) => (<div>test</div>))
              :
              null
            }
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
            <Box display="flex" alignItems="center" margin={2} className={classes.root}>
              <Avatar>1</Avatar>
              00001
              NowPrice:50.5
              AlertPrice:50.5
              >=
              <FormControlLabel
                control={
                  <Switch
                    checked={true}
                    onChange={test2}
                    name="checkedA"
                    color="primary"
                  />
                }
                label="Alert"
              />
              <Button variant="contained">Go</Button>
            </Box>
            <Divider />
          </Paper>
        </Box>{/* <Box marginX="auto" maxWidth={1000} width="75%" minWidth={500}> */}
      </Box>{/* <Box margin={2} overflow="auto"> */}
      {/* close of  <Box bgcolor="text.disabled" style={{ height: '100vh' }}>*/}
    </Box>
  );
}
//chart:https://canvasjs.com/docs/charts/integration/react/
export default App;
