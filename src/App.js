import React, { useState, useEffect, Fragment, useRef } from 'react';
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
import Skeleton from '@material-ui/lab/Skeleton';
import IconButton from '@material-ui/core/IconButton';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import TextField from '@material-ui/core/TextField';
import './App.css';

var host = 'https://rockie-stockAlertServer.herokuapp.com'

const App = () => {
  const cookies = new Cookies();
  const clientId = "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com"

  const [login, setLogin] = useState({})
  const [stockHistory, setStockHistory] = useState([])
  const [ws, setWs] = useState(null)
  const [stockNotify, setStockNotify] = useState([])
  const [edit, setEdit] = useState(false)

  const connectWebSocket = () => {
    //開啟
    setWs(webSocket(host))
  }

  const wsRef = useRef(ws);
  wsRef.current = ws;

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
      setStockNotify(prevState => {
        return prevState.map((row, index) => {
          let addObject = {}
          if (row.stock === message.stock) {
            addObject = { nowPrice: message.price, nowTime: message.time, elevation:0}
          }
          return { ...row, ...addObject }
        })
      });
      setStockHistory(prevState => {
        return prevState.map((row, index) => {
          if (row.stock === message.stock && !row.priceWithTime.some(e => e.time === message.time)) {
            return { ...prevState, priceWithTime: [...row.priceWithTime, { time: message.time, price: message.price }] }
          } else {
            return prevState
          }
        })
      })
    })
    ws.on('changeAlert', message => {
      console.log(message)
      setStockNotify(prevState => {
        return prevState.map((row, index) => {
          let addObject = {}
          if (row._id === message._id && row.stock === message.stock) {
            addObject = { alert: message.alert }
          }
          return { ...row, ...addObject }
        })
      });
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
    if (response.hasOwnProperty('tokenId')) {
      let email = response.profileObj.email
      let newLoginObj = { id: response.tokenId, username: response.profileObj.name, photo: response.profileObj.imageUrl, email: email }
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
          email: email//login.email
        })
      })
        .then(res => res.json())
        .then((result) => {
          if (typeof result.ok !== 'undefined') {
            let resultArray = result.ok
            wsRef.current.emit('addRoom', email)
            for (let i = 0; i < resultArray.length; i++) {
              if (!stockNotify.some(e => e._id === resultArray[i]._id)) {
                setStockNotify(prevState => {
                  return [...prevState, resultArray[i]]
                });
                setStockHistory(prevState => {
                  if (!prevState.some(e => e.stock === resultArray[i].stock)) {
                    return [...prevState, { stock: resultArray[i].stock, priceWithTime: [] }]
                  } else {
                    return prevState
                  }
                })
                wsRef.current.emit('addRoom', resultArray[i].stock)
              }
            }
          }
        })
    }
  }
  const fun_logout = () => {
    setLogin(prevState => { });
    cookies.remove('id', { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host })
  }
  const fun_addNotify = () => {
    setStockNotify(prevState => {
      return [...prevState, { stock: "", price: "", equal: ">=", alert: true }]
    });
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
  const fun_edit = () => {
    setEdit(prevState => {
      return !prevState
    });
  }
  const changeAlertSwitch = (rowIndex, _id, alert) => {
    if (edit === true) {
      if (window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') {
        host = 'http://localhost:8080'
      }
      fetch(host + '/update/stockNotify/alert', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: login.email,
          _id: _id,
          alert: !alert
        })
      })
        .then(res => res.json())
        .then((result) => {
          if (typeof result.ok !== 'undefined') {
            setStockNotify(prevState => {
              return prevState.map((row, index) => {
                let addObject = {}
                if (index === rowIndex) {
                  addObject = { alert: !alert }
                }
                return { ...row, ...addObject }
              })
            });
          }
        })
    }
  }
  function ElevationScroll(props) {
    const { children } = props;
    const trigger = useScrollTrigger();
    return React.cloneElement(children, {
      elevation: trigger ? 4 : 1,
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
      <Box paddingX={1} paddingY={3} overflow="auto" position="relative">
        <Grid container alignItems="center">
          <Hidden only={['xs', 'sm']}>
            <Grid item sm={0} md={2} className={classes.margin1}>
            </Grid>
          </Hidden>
          <Grid item xs={12} sm={12} md={8} className={classes.margin1}>
            <Paper>
              <Typography align='right' className={classes.margin2}>
                {
                  edit === true
                    ?
                    <Fragment>
                      <Button variant="contained" color="primary">Save</Button>
                      <Button variant="contained" color="primary" onClick={fun_edit}>Cancel</Button>
                    </Fragment>
                    :
                    <Button variant="contained" color="primary" onClick={fun_edit}>Edit</Button>
                }
              </Typography>
              <Box display="flex" alignItems="center" margin={2}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={4} sm={1} md={1} className={classes.margin1}>
                  </Grid>
                  <Grid item xs={4} sm={2} md={2} className={classes.margin1}>
                    <Typography>Stock Number</Typography>
                  </Grid>
                  <Grid item xs={4} sm={2} md={2} className={classes.margin1}>
                    <Typography>Price</Typography>
                  </Grid>
                  <Hidden only="xs">
                    <Grid item xs={0} sm={2} md={2} className={classes.margin1}>
                    </Grid>
                    <Grid item xs={0} sm={5} md={5} className={classes.margin1}>
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
                    <Box display="flex" alignItems="center" margin={2} onClick={test2} onMouseEnter={test2} onMouseLeave={test2}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={4} sm={1} md={1} className={classes.margin1}>
                          <Avatar>{index + 1}</Avatar>
                        </Grid>
                        <Grid item xs={4} sm={2} md={2} className={classes.margin1}>
                          {
                          edit
                          ?
                          <TextField id="stock" label="stock" variant="outlined" value={row.stock} margin="dense" autoComplete='off'/>
                          :
                          <Typography>{row.stock}</Typography>
                          }
                        </Grid>
                        <Grid item xs={4} sm={2} md={2} className={classes.margin1}>
                          <Typography>
                            {
                              typeof row.nowPrice !== "undefined"
                                ?
                                '$' + row.nowPrice
                                :
                                <Skeleton />
                            }
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={2} md={2} className={classes.margin1}>
                          {/*<Fab
                            color="primary"
                            size="small"
                            variant="extended"
                          >
                            Go<ArrowForwardIcon />
                          </Fab>*/}
                          <Typography color="textSecondary" align="center" variant="subtitle2">
                            {
                              typeof row.nowTime !== "undefined"
                                ?
                                row.nowTime
                                :
                                <Skeleton />
                            }
                          </Typography>
                        </Grid>
                        <Hidden only="xs">
                          <Grid item xs={0} sm={2} md={2} className={classes.margin1}>
                            <Typography>${row.price}</Typography>
                          </Grid>
                          <Grid item xs={0} sm={1} md={1} className={classes.margin1}>
                            <Typography>{row.equal}</Typography>
                          </Grid>
                          <Grid item xs={0} sm={2} md={2} className={classes.margin1}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={row.alert}
                                  onChange={() => changeAlertSwitch(index, row._id, row.alert)}
                                  name="alertCheck"
                                  color="primary"
                                  disabled={!edit}
                                />
                              }
                            />
                          </Grid>
                        </Hidden>
                      </Grid>
                    </Box>
                    <Divider />
                  </Fragment>
                ))
                :
                <Fragment>
                  <Typography color="textSecondary" align="center">
                    <Box textAlign="center" alignItems="center" margin={2} onClick={test2} onMouseEnter={test2} onMouseLeave={test2}>
                      None of record
                  </Box>
                  </Typography>
                  <Divider />
                </Fragment>
              }
              {stockNotify.length < 10 && edit === true
                ?
                <Fragment>
                  <Typography color="textSecondary" align="center">
                    <Box textAlign="center" alignItems="center" margin={2} onClick={test2} onMouseEnter={test2} onMouseLeave={test2}>
                      <IconButton color="primary" aria-label="add notify" onClick={fun_addNotify}>
                        <AddCircleIcon fontSize="large" />
                      </IconButton>
                    </Box>
                  </Typography>
                  <Divider />
                </Fragment>
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
