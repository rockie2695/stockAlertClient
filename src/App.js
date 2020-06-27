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
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Fab from '@material-ui/core/Fab';
import Hidden from '@material-ui/core/Hidden';
import Skeleton from '@material-ui/lab/Skeleton';
import IconButton from '@material-ui/core/IconButton';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';
import Link from '@material-ui/core/Link';
import HttpsRedirect from 'react-https-redirect';
import LinearProgress from '@material-ui/core/LinearProgress';
import CircularProgress from '@material-ui/core/CircularProgress';

import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import CloseIcon from '@material-ui/icons/Close';
import './App.css';

var host = 'https://rockie-stockAlertServer.herokuapp.com'

const App = () => {
  const cookies = new Cookies();
  const clientId = "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com"

  const [login, setLogin] = useState({})
  const [stockHistory, setStockHistory] = useState([])
  const [ws, setWs] = useState(null)
  const [stockNotify, setStockNotify] = useState([])
  const [oldStockNotify, setOldStockNotify] = useState([])
  const [edit, setEdit] = useState(false)
  const [boxShadow, setBoxShadow] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [sendingForm, setSendingForm] = useState(false)
  const [addRoomList, setAddRoomList] = useState([])
  const [open, setOpen] = useState(false);
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
      alert('websocket is fail to connect. Now refresh!')
      window.location.reload()
    });
    ws.on('stockPrice', message => {
      console.log(message)
      setStockNotify(prevState => {
        return prevState.map((row, index) => {
          let addObject = {}
          if (row.stock === message.stock) {
            addObject = { nowPrice: message.price, nowTime: message.time }
            if (message.time.split(' ')[1] === "09:20") {
              findStockName(row.stock, login.email)
            }
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
    },
    padding2: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  }))

  const classes = useStyles();

  const DialogTitle = withStyles(useStyles)((props) => {
    return (
      <MuiDialogTitle disableTypography className={classes.padding2} {...props.other}>
        <Typography variant="h6">{props.children}</Typography>
        {props.onClose ? (
          <IconButton aria-label="close" className={classes.closeButton} onClick={props.onClose}>
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
  });

  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2),
    },
  }))(MuiDialogContent);

  const DialogActions = withStyles((theme) => ({
    root: {
      margin: 0,
      padding: theme.spacing(1),
    },
  }))(MuiDialogActions);

  const openDialog = () => {
    setOpen(prevState => true);
  };
  const closeDialog = () => {
    setOpen(prevState => false);
  };

  const fun_login = (response) => {
    if (response.hasOwnProperty('tokenId')) {
      let email = response.profileObj.email
      let newLoginObj = { id: response.tokenId, username: response.profileObj.name, photo: response.profileObj.imageUrl, email: email }
      setLogin(prevState => {
        return { ...prevState, ...newLoginObj }
      });
      cookies.set('id', response.tokenId, { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host });
      setLoading(prevState => {
        return true
      })
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
                setOldStockNotify(prevState => {
                  return [...prevState, resultArray[i]]
                });
                setStockHistory(prevState => {
                  if (!prevState.some(e => e.stock === resultArray[i].stock)) {
                    return [...prevState, { stock: resultArray[i].stock, priceWithTime: [] }]
                  } else {
                    return prevState
                  }
                })
                setAddRoomList(prevState => {
                  if (!prevState.includes(resultArray[i].stock)) {
                    wsRef.current.emit('addRoom', resultArray[i].stock)
                    return [...prevState, resultArray[i].stock]
                  } else {
                    return prevState
                  }
                })
                findStockName(resultArray[i].stock, email)
              }
            }
            setLoading(prevState => {
              return false;
            })
          } else {
            console.log(result)
            alert('server error. Please refresh')
          }
        }).catch(err => {
          console.log(err)
          alert("Can't get your notification. Please refresh")
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
  }
  const test2 = () => {
    console.log('test2')
  }
  const fun_boxShadow = (index) => {
    setBoxShadow(prevState => {
      if (prevState === index) {
        return -1
      } else {
        return index
      }
    })
  }
  const changeAlertInfo = (event) => {
    if (event.target.name !== null) {
      setStockNotify(prevState => {
        return prevState.map((row, index) => {
          let addObject = {}
          let target = event.target.name.split('_')
          console.log(target)
          let value = event.target.value
          if (index === parseInt(target[1])) {
            if (target[0] === 'price') {
              if (isNaN(parseFloat(event.target.value))) {
                value = event.target.value

              } else {
                value = parseFloat(event.target.value)
              }
            }
            addObject = { [target[0]]: value }
          }
          return { ...row, ...addObject }
        })
      })
    }
  }
  const loseFocusAlertInfo = (event) => {
    console.log(event, event.target.value, event.target.name)
    if (event.target.name !== null) {
      setStockNotify(prevState => {
        return prevState.map((row, index) => {
          let addObject = {}
          let target = event.target.name.split('_')
          console.log(target)
          let value = event.target.value

          if (index === parseInt(target[1]) && target[0] === 'stock') {
            if (value.length > 5) {
              value = value.substring(value.length - 5, value.length)
            }
            value = value.padStart(5, "0");
            addObject = { [target[0]]: value }
          }
          return { ...row, ...addObject }
        })
      })
    }
  }
  const fun_save = () => {
    console.log(oldStockNotify, stockNotify)
    setSendingForm(prevState => {
      return true
    })
    let updateMessage = []
    let insertMessage = []
    for (let i = 0; i < stockNotify.length; i++) {
      if (typeof stockNotify[i]._id !== "undefined") {//update
        updateMessage.push({ _id: stockNotify[i]._id, stock: stockNotify[i].stock, price: stockNotify[i].price, equal: stockNotify[i].equal, alert: stockNotify[i].alert, oldStock: oldStockNotify[i].stock })
      } else {//new to add
        insertMessage.push({ stock: stockNotify[i].stock, price: stockNotify[i].price, equal: stockNotify[i].equal, alert: stockNotify[i].alert })
      }
    }
    if (updateMessage.length !== 0 || insertMessage.length !== 0) {
      fetch(host + '/update/stockNotify', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: login.email,
          update: updateMessage,
          insert: insertMessage
        })
      }).then(res => res.json())
        .then((result) => {
          if (typeof result.ok !== "undefined") {
            let resultArray = result.ok
            for (let i = 0; i < addRoomList.length; i++) {
              wsRef.current.emit('leaveRoom', addRoomList[i].stock)
            }
            setAddRoomList(prevState => {
              return []
            })
            setStockNotify(prevState => {
              return resultArray
            })
            setOldStockNotify(prevState => {
              return resultArray
            })
            setEdit(prevState => {
              return false
            })
            for (let i = 0; i < resultArray.length; i++) {
              setAddRoomList(prevState => {
                if (!prevState.includes(resultArray[i].stock)) {
                  wsRef.current.emit('addRoom', resultArray[i].stock)
                  return [...prevState, resultArray[i].stock]
                } else {
                  return prevState
                }
              })
              findStockName(resultArray[i].stock, login.email)
            }
          }
          setSendingForm(prevState => {
            return false
          })
        })
    }
  }
  const fun_edit = () => {
    if (edit === true) {
      setStockNotify(prevState => {
        return prevState.filter((row, index) => {
          return typeof row._id !== "undefined";
        });
      })
      setStockNotify(prevState => {
        return prevState.map((row, index) => {
          return { ...row, ...{ stock: oldStockNotify[index].stock, price: oldStockNotify[index].price, equal: oldStockNotify[index].equal } }
        })
      })
    }
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
  const findStockName = (stock, subEmail) => {//since email object may not contain before login
    if (window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') {
      host = 'http://localhost:8080'
    }
    fetch(host + '/find/stockName/', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: subEmail,
        stock: stock
      })
    })
      .then(res => res.json())
      .then((result) => {
        console.log(result)
        let name = result.name
        let stock = result.stock
        let past = result.past
        let nowPrice = result.nowPrice
        let nowTime = result.nowTime
        let tenDayLow = result.tenDayLow
        let tenDayHigh = result.tenDayHigh
        let tenDayAvg = result.tenDayAvg
        let monthLow = result.monthLow
        let monthHigh = result.monthHigh
        let twentyDayAvg = result.twentyDayAvg
        let wk52Low = result.wk52Low
        let wk52High = result.wk52High
        let fiftyDayAvg = result.fiftyDayAvg
        setStockNotify(prevState => {
          return prevState.map((row, index) => {
            let addObject = {}

            if (row.stock === stock) {
              addObject = {
                name: name,
                past: past,
                tenDayHigh: tenDayHigh,
                tenDayLow: tenDayLow,
                tenDayAvg: tenDayAvg,
                monthLow: monthLow,
                monthHigh: monthHigh,
                twentyDayAvg: twentyDayAvg,
                wk52Low: wk52Low,
                wk52High: wk52High,
                fiftyDayAvg: fiftyDayAvg
              }
              if (typeof row.nowPrice === "undefined") {
                addObject = { ...addObject, ...{ nowPrice: nowPrice, nowTime: nowTime } }
              }
            }
            return { ...row, ...addObject }
          })
        });
      })
  }
  function ElevationScroll(props) {
    const { children } = props;
    const trigger = useScrollTrigger();
    return React.cloneElement(children, {
      elevation: trigger ? 4 : 1,
    });
  }
  function getDayTime() {
    let today = new Date().toLocaleString("en-US", { timeZone: "Asia/Hong_Kong" });
    today = new Date(today)
    let todayHour = today.getHours();
    let todayMinute = today.getMinutes();
    let todayDay = today.getDay()//todayDay=0(sunday),1,2,3,4,5,6
    let todaySecond = today.getSeconds();
    return [todayHour, todayMinute, todayDay, today, todaySecond]
  }
  return (
    <HttpsRedirect>
      <Box bgcolor="text.disabled" style={{ height: '100%', minHeight: '100vh' }}>
        <ElevationScroll {...App.props}>
          <AppBar color="default" position="sticky" top={0}>
            <Toolbar>
              <Typography variant="h6" style={{ flexGrow: 1 }}>
                <Link href="https://rockie-stockalertclient.herokuapp.com/" color="inherit">
                  StockAlertClient
            </Link>
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
            <LinearProgress />
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
              <Grid item sm={false} md={2} className={classes.margin1}>
              </Grid>
            </Hidden>
            <Grid item xs={12} sm={12} md={8} className={classes.margin1}>
              <Paper>
                <Typography align='right' className={classes.margin2}>
                  {
                    edit === true
                      ?
                      <Fragment>
                        <Button variant="contained" color="primary" onClick={fun_save} disabled={sendingForm}>Save <CircularProgress size={20} style={{color:"white"}}/></Button>
                        <Button variant="contained" color="primary" onClick={fun_edit} disabled={sendingForm}>Cancel</Button>
                      </Fragment>
                      :
                      <Button variant="contained" color="primary" onClick={fun_edit}>Edit</Button>
                  }
                </Typography>
                <Box display="flex" alignItems="center" margin={2}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={3} sm={1} md={1} className={classes.margin1}>
                    </Grid>
                    <Grid item xs={5} sm={2} md={2} className={classes.margin1}>
                      <Typography>Stock Number</Typography>
                    </Grid>
                    <Grid item xs={4} sm={2} md={2} className={classes.margin1}>
                      <Typography>Price</Typography>
                    </Grid>
                    <Hidden only="xs">
                      <Grid item xs={false} sm={2} md={2} className={classes.margin1}>
                      </Grid>
                      <Grid item xs={false} sm={5} md={5} className={classes.margin1}>
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
                      <Box display="flex" alignItems="center" padding={2} onClick={openDialog} boxShadow={boxShadow === index ? 1 : 0} onMouseEnter={() => fun_boxShadow(index)} onMouseLeave={() => fun_boxShadow(index)}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={3} sm={1} md={1} className={classes.margin1}>
                            <Avatar>{index + 1}</Avatar>
                          </Grid>
                          <Grid item xs={5} sm={2} md={2} className={classes.margin1}>
                            {
                              edit === true
                                ?
                                <TextField
                                  type="number"
                                  style={{ minWidth: '85px' }}
                                  id={"stock_" + index}
                                  name={"stock_" + index}
                                  label="stock"
                                  variant="outlined"
                                  value={row.stock}
                                  margin="dense"
                                  autoComplete='off'
                                  onChange={changeAlertInfo}
                                  onBlur={loseFocusAlertInfo}
                                  disabled={sendingForm}
                                />
                                :
                                <Typography>{row.stock}{typeof row.name !== "undefined" ? row.name : null}</Typography>
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
                              {
                                (typeof row.past !== "undefined" && typeof row.nowPrice !== "undefined")
                                  ?
                                  ' (' +
                                  ((parseFloat(row.nowPrice) - parseFloat(row.past)) > 0 ? '+' : '') +
                                  parseFloat(Math.round((parseFloat(row.nowPrice) - parseFloat(row.past)
                                    + 0.00001
                                    * ((parseFloat(row.nowPrice) - parseFloat(row.past)) > 0 ? 1 : -1)
                                  ) * 1000) / 1000)
                                  + ')'
                                  :
                                  null
                              }
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2} md={2} className={classes.margin1}>
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
                            <Grid item xs={false} sm={2} md={2} className={classes.margin1}>
                              {edit
                                ?
                                <TextField
                                  id={"price_" + index} name={"price_" + index} label="price" variant="outlined" value={row.price} margin="dense" autoComplete='off' disabled={sendingForm}
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                                  }}
                                  style={{ minWidth: '90px' }}
                                  onChange={changeAlertInfo}
                                  type="number"
                                />
                                :
                                <Typography>${row.price}</Typography>
                              }
                            </Grid>
                            <Grid item xs={false} sm={1} md={1} className={classes.margin1}>
                              {
                                edit
                                  ?
                                  <TextField
                                    id={"equal_" + index}
                                    name={"equal_" + index}
                                    select
                                    label="equal"
                                    variant="outlined"
                                    margin="dense"
                                    value={row.equal}
                                    style={{ minWidth: '18px' }}
                                    onChange={changeAlertInfo}
                                    disabled={sendingForm}
                                  >
                                    <MenuItem key='>=' value='>='>
                                      {">="}
                                    </MenuItem>
                                    <MenuItem key='<=' value='<='>
                                      {"<="}
                                    </MenuItem>
                                  </TextField>
                                  :
                                  <Typography>{row.equal}</Typography>
                              }

                            </Grid>
                            <Grid item xs={false} sm={2} md={2} className={classes.margin1} alignItems="center" style={{ textAlign: "center" }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={row.alert}
                                    onChange={() => changeAlertSwitch(index, row._id, row.alert)}
                                    name="alertCheck"
                                    color="primary"
                                    disabled={!edit || sendingForm}
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
                  loading === true
                    ?
                    <Fragment>
                      <Box textAlign="center" alignItems="center" margin={2} onClick={test2} onMouseEnter={test2()} onMouseLeave={test2()}>
                        <Typography color="textSecondary" align="center">
                          Loading
                      </Typography>
                      </Box>
                      <Divider />
                    </Fragment>
                    :
                    <Fragment>
                      <Box textAlign="center" alignItems="center" margin={2} onClick={test2} onMouseEnter={test2()} onMouseLeave={test2()}>
                        <Typography color="textSecondary" align="center">
                          None of record
                      </Typography>
                      </Box>
                      <Divider />
                    </Fragment>
                }
                {stockNotify.length < 10 && edit === true
                  ?
                  <Fragment>
                    <Box textAlign="center" alignItems="center" margin={2} onClick={test2} onMouseEnter={test2} onMouseLeave={test2}>
                      <Typography color="textSecondary" align="center">
                        <IconButton color="primary" aria-label="add notify" onClick={fun_addNotify}>
                          <AddCircleIcon fontSize="large" />
                        </IconButton>
                      </Typography>
                    </Box>
                    <Divider />
                  </Fragment>
                  :
                  null
                }
              </Paper>

            </Grid>
            <Hidden only={['xs', 'sm']}>
              <Grid item sm={false} md={2} className={classes.margin1}>
              </Grid>
            </Hidden>
          </Grid>
        </Box>{/* <Box margin={2} overflow="auto"> */}
        {/* following box is close of  <Box bgcolor="text.disabled" style={{ height: '100vh' }}>*/}
      </Box >
      <Dialog onClose={closeDialog} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={closeDialog}>
          Modal title
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis
            in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
          </Typography>
          <Typography gutterBottom>
            Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis
            lacus vel augue laoreet rutrum faucibus dolor auctor.
          </Typography>
          <Typography gutterBottom>
            Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel
            scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus
            auctor fringilla.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={closeDialog} color="primary">
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </HttpsRedirect>
  );
}
//chart:https://canvasjs.com/docs/charts/integration/react/
export default App;
