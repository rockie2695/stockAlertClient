import React, { useState, useEffect, Fragment } from 'react';
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
import Grid from '@material-ui/core/Grid';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import Fab from '@material-ui/core/Fab';
import Hidden from '@material-ui/core/Hidden';
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
    ws.on('connect_error', function () {
      console.log('Failed to connect to server');
    });
    ws.on('stockPrice', message => {
      console.log(message)
    })
  }
  const useStyles = makeStyles((theme) => ({
    margin1: {
      '& > *': {
        margin: theme.spacing(1),
      }
    },
    margin2: {
      '& > *': {
        margin: theme.spacing(2),
      }
    }
  }))
  const classes = useStyles();
  const fun_login = (response) => {
    console.log(response)
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
              console.log(stockNotify)
              ws.emit('addRoom', result[i].room)
            }
          }
        })
    }
  }
  const fun_logout = () => {
    setLogin(prevState => { });
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
    const trigger = useScrollTrigger();
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
        <Box position="fixed" zIndex="0" width="100%" height="50%" minHeight="200px" bgcolor="text.primary" color="background.paper" display="flex" alignItems="center" justifyContent="center">
          <Typography align="center" variant="h2">
            For Stock Price Showing And Notification
        </Typography>
        </Box>
        <Box height="50%" minHeight="50vh">

        </Box>
      </Box>
      <Box paddingX={2} paddingY={3} overflow="auto" position="relative">
        <Grid container alignItems="center">
          <Hidden only={['xs', 'sm']}>
            <Grid item sm={0} md={2} className={classes.margin1}>
            </Grid>
          </Hidden>
          <Grid item xs={12} sm={12} md={8} className={classes.margin1}>
            <Paper>
              <Typography align='right' className={classes.margin2}>
                <Button variant="contained">Default</Button>
                <Button variant="contained">Default</Button>
              </Typography>
              <Box display="flex" alignItems="center" margin={2}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={3} sm={1} md={1} className={classes.margin1}>
                  </Grid>
                  <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                    <Typography>Stock Number</Typography>
                  </Grid>
                  <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                    <Typography>Price</Typography>
                  </Grid>
                  <Hidden only="xs">
                    <Grid item xs={0} sm={7} md={7} className={classes.margin1}>
                      <Typography>Alert</Typography>
                    </Grid>
                  </Hidden>
                </Grid>
              </Box>
              <Divider />
              {stockNotify.length !== 0
                ?
                stockNotify.map((row, index) => (
                  <Fragment>
                    <Box display="flex" alignItems="center" margin={2}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={3} sm={1} md={1} className={classes.margin1}>
                          <Avatar>{index + 1}</Avatar>
                        </Grid>
                        <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                          <Typography>00001</Typography>
                        </Grid>
                        <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                          <Typography>$50.5</Typography>
                        </Grid>
                        <Hidden only="xs">
                          <Grid item xs={0} sm={2} md={2} className={classes.margin1}>
                            <Typography>$50.5</Typography>
                          </Grid>
                          <Grid item xs={0} sm={1} md={1} className={classes.margin1}>
                            <Typography>>=</Typography>
                          </Grid>
                          <Grid item xs={0} sm={2} md={2} className={classes.margin1}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={true}
                                  onChange={test2}
                                  name="checkedA"
                                  color="primary"
                                />
                              }
                            />
                          </Grid>
                        </Hidden>
                        <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                          <Fab
                            color="primary"
                            size="small"
                            variant="extended"
                          >
                            Go<ArrowForwardIcon />
                          </Fab>
                        </Grid>
                      </Grid>
                    </Box>
                    <Divider />
                  </Fragment>
                ))
                :
                null
              }
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((row, index) => (
                <Fragment>
                  <Box display="flex" alignItems="center" margin={2}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={3} sm={1} md={1} className={classes.margin1}>
                        <Avatar>{index + 1}</Avatar>
                      </Grid>
                      <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                        <Typography>00001</Typography>
                      </Grid>
                      <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                        <Typography>$50.5</Typography>
                      </Grid>
                      <Hidden only="xs">
                        <Grid item xs={0} sm={2} md={2} className={classes.margin1}>
                          <Typography>$50.5</Typography>
                        </Grid>
                        <Grid item xs={0} sm={1} md={1} className={classes.margin1}>
                          <Typography>>=</Typography>
                        </Grid>
                        <Grid item xs={0} sm={2} md={2} className={classes.margin1}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={true}
                                onChange={test2}
                                name="checkedA"
                                color="primary"
                              />
                            }
                          />
                        </Grid>
                      </Hidden>
                      <Grid item xs={3} sm={2} md={2} className={classes.margin1}>
                        <Fab
                          color="primary"
                          size="small"
                          variant="extended"
                        >
                          Go<ArrowForwardIcon />
                        </Fab>
                      </Grid>
                    </Grid>
                  </Box>
                  <Divider />
                </Fragment>
              ))}
            </Paper>

          </Grid>
          <Hidden only={['xs', 'sm']}>
            <Grid item sm={0} md={2} className={classes.margin1}>
            </Grid>
          </Hidden>
        </Grid>
      </Box>{/* <Box margin={2} overflow="auto"> */}
      {/* following box is close of  <Box bgcolor="text.disabled" style={{ height: '100vh' }}>*/}
    </Box>
  );
}
//chart:https://canvasjs.com/docs/charts/integration/react/
export default App;
