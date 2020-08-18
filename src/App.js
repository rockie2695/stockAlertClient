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
import CssBaseline from '@material-ui/core/CssBaseline';
import moment from 'moment'


import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import CloseIcon from '@material-ui/icons/Close';
import './App.css';

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

var host = 'https://rockie-stockAlertServer.herokuapp.com'
if (window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') {
  host = 'http://localhost:3001'
}
console.log(window.location.host)
const App = () => {
  const cookies = new Cookies();
  const clientId = "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com"

  const [login, setLogin] = useState({
    email: (window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') ? 'rockie2695@gmail.com' : ''
  })
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
  const [dialogIndex, setDialogIndex] = useState(-1)
  const [selectHistory, setSelectHistory] = useState([])
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const connectWebSocket = () => {
    //開啟
    setWs(webSocket(host))
  }
  const wsRef = useRef(ws);
  wsRef.current = ws;
  const dialogIndexRef = useRef(dialogIndex);
  dialogIndexRef.current = dialogIndex;
  const stockNotifyRef = useRef(stockNotify);
  stockNotifyRef.current = stockNotify;
  const loginRef = useRef(login)
  loginRef.current = login;

  useEffect(() => {
    console.log('mounted')
    window.addEventListener('online', handleConnectionChange)
    window.addEventListener('offline', handleConnectionChange)

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      console.log('beforeinstallprompt', e)
      setDeferredPrompt(prevState => e)
    })
  }, []);

  useEffect(() => {
    if (ws) {
      //連線成功在 console 中打印訊息
      console.log('success connect!')
      //設定監聽
      initWebSocket()
    }
  }, [ws]);

  useEffect(() => {
    if (login.email !== '') {
      console.log('do test')
      test()
    }
  }, [login]);

  const handleConnectionChange = () => {
    const condition = navigator.onLine ? 'online' : 'offline';
    if (condition === 'online') {

    } else {

    }
  }

  const showA2HS = (e) => {
    console.log('call this medhod showA2HS')
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(prevState => null)
      });
  }

  const initWebSocket = () => {
    // Server 通知完後再傳送 disConnection 通知關閉連線
    ws.on('disConnection', () => {
      ws.close()
    })
    ws.on('connect_error', function () {
      console.log('Failed to connect to server');
      alert('websocket is fail to connect. Please refresh!')
      //window.location.reload()
    });
    ws.on('stockPrice', message => {
      console.log('receive stockPrice message', message)
      
      message.jsTime=new Date(message.time).toLocaleString("en-US", { timeZone: "UTC" });
      let findStockNameArray = []
      let changeSelectHistoryArray = []
      setStockNotify(prevState => {
        console.log(prevState)
        return prevState.map((row, index) => {
          console.log('in setStockNotify run how many times')
          let addObject = {}
          if (row.stock === message.stock) {
            addObject = { nowPrice: message.price, nowTime: message.time }
            if (message.time.split(' ')[1] === "09:20") {
              //findStockName(row.stock, login.email)
              findStockNameArray = [{ stock: row.stock, email: loginRef.current.email }]
            }
            console.log('in each stock', prevState)
            //changeSelectHistory(index, message, 'end')
            changeSelectHistoryArray = [{ stock: row.stock, index: index, message: message, side: 'end' }]
          }
          return { ...row, ...addObject }
        })
      });
      if (findStockNameArray.length !== 0) {
        console.log('please chech email', findStockNameArray[0].email, loginRef.current.email)
        findStockName(findStockNameArray[0].stock, loginRef.current.email)
      }
      if (changeSelectHistoryArray.length !== 0 && dialogIndexRef.current > -1) {
        changeSelectHistory(changeSelectHistoryArray[0].stock, changeSelectHistoryArray[0].message, changeSelectHistoryArray[0].side)
      }
      let time = message.time.split(' ')[1]
      setStockHistory(prevState => {
        return prevState.map((row, index) => {
          console.log('seesetStockHistory run how many times')
          if (row.stock === message.stock && !row.priceWithTime.some(e => e.time === time)) {
            return { ...row, priceWithTime: [...row.priceWithTime, { time: time, price: message.price, jsTime: message.jsTime }] }
          } else {
            return row
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

  const changeSelectHistory = (stock, message, side) => {
    if (dialogIndexRef.current > -1) {
      if (stock === stockNotifyRef.current[dialogIndexRef.current].stock) {
        let time = message.time.split(' ')[1]
        if (side === 'end') {
          if (!selectHistory.some(e => e.time === time)) {
            setSelectHistory(prevState => {
              let addArray = []
              if (!prevState.some(e => e.time === time)) {
                addArray = [{ time: time, price: message.price, jsTime: message.jsTime }]
                console.log(time, message.jsTime)
              }
              return [...prevState, ...addArray]
            })
          }
        } else if (side === 'new') {
          setSelectHistory(prevState => {
            return [{ time: time, price: message.price }]
          })
        } else if (side === 'front') {
          if (!selectHistory.some(e => e.time === time)) {
            setSelectHistory(prevState => {
              let addArray = []
              if (!prevState.some(e => e.time === time)) {
                addArray = [{ time: time, price: message.price, jsTime: message.jsTime }]
                console.log(time)
              }
              return [...addArray, ...prevState]
            })
          }
        }
      }
    }
  }

  const openDialog = (index) => {
    if (!edit) {
      setOpen(prevState => true);
      setDialogIndex(prevState => index);
      console.log(index)
      console.log(stockHistory, stockNotify, selectHistory)
      for (let i = 0; i < stockHistory.length; i++) {
        if (stockHistory[i].stock === stockNotify[index].stock) {
          setSelectHistory(stockHistory[i].priceWithTime)
          break
        }
      }

    }
  };
  const closeDialog = () => {
    console.log(selectHistory)
    setOpen(prevState => false);
    setDialogIndex(prevState => -1);
    setSelectHistory([])
  };

  const fun_login = (response) => {
    console.log(response)
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
                findStockHistory(resultArray[i].stock, email)
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
    setLogin(prevState => { return { email: '' } });
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
    setBoxShadow(prevState => -1)
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
            setStockHistory(prevState => {
              return []
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
    setBoxShadow(prevState => -1)
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
    if (edit === true && typeof stockNotify[rowIndex]._id !== "undefined") {
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
  const clickAvatar = (index) => {
    if (edit) {
      if (typeof stockNotify[index]._id !== "undefined") {
        let id = stockNotify[index]._id
        let stock = stockNotify[index].stock
        let count = stockNotify.filter(row => row.stock === stock).length
        fetch(host + '/delete/stockNotify/', {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: login.email,
            id: id,
            stock: stock
          })
        }).then(res => res.json())
          .then((result) => {
            console.log(result)
            if (typeof result.ok !== "undefined") {
              //delete stockNotify , stockHistory && leave room
              setStockNotify(prevState => {
                return prevState.filter((row, index) => {
                  return row._id !== id
                })
              })
              if (count === 1) {
                setStockHistory(prevState => {
                  return prevState.filter((row, index) => {
                    return row.stock !== stock
                  })
                })
              }
              for (let i = 0; i < addRoomList.length; i++) {
                wsRef.current.emit('leaveRoom', addRoomList[i].stock)
              }
              setAddRoomList(prevState => {
                return []
              })
              for (let i = 0; i < stockHistory.length; i++) {
                setAddRoomList(prevState => {
                  if (!prevState.includes(stockHistory[i].stock)) {
                    wsRef.current.emit('addRoom', stockHistory[i].stock)
                    return [...prevState, stockHistory[i].stock]
                  } else {
                    return prevState
                  }
                })
              }

            } else if (typeof result.error !== "undefined") {
              alert(result.error)
            }
          })
      } else {
        setStockNotify(prevState => {
          return prevState.filter((row, row_index) => {
            return row_index !== index
          })
        })
      }
    }

  }
  const findStockHistory = (stock, subEmail) => {
    console.log(stock, subEmail)
    fetch(host + '/select/stockPrice/', {
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
        for (let i = result.ok.length - 1; i > -1; i--) {
          let rowTime = new Date(result.ok[i].time).toLocaleString("en-US", { timeZone: "UTC" });
          rowTime = new Date(rowTime).getTime()
          setStockHistory(prevState => {
            return prevState.map((row, index) => {
              if (row.stock === stock && !row.priceWithTime.some(e => e.time === result.ok[i].stringTime.split(' ')[1])) {
                return { ...row, priceWithTime: [{ time: result.ok[i].stringTime.split(' ')[1], price: result.ok[i].price, jsTime: rowTime }, ...row.priceWithTime] }
              } else {
                return row
              }
            })
          })
          changeSelectHistory(stock, { time: result.ok[i].stringTime.split(' ')[1], price: result.ok[i].price, jsTime: rowTime }, 'front')
        }
      })
  }
  const findStockName = (stock, subEmail) => {//since email object may not contain before login
    console.log(subEmail)
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
        //let row_index = -2
        setStockNotify(prevState => {
          return prevState.map((row, index) => {
            let addObject = {}

            if (row.stock === stock) {
              //row_index = index
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
        setStockHistory(prevState => {
          return prevState.map((row, index) => {
            if (row.stock === stock && !row.priceWithTime.some(e => e.time === nowTime.split(' ')[1])) {
              return { ...row, priceWithTime: [...row.priceWithTime, { time: nowTime.split(' ')[1], price: nowPrice, jsTime: new Date(nowTime).getTime() }] }
            } else {
              return row
            }
          })
        })
        changeSelectHistory(stock, { time: nowTime.split(' ')[1], price: nowPrice, jsTime: new Date(nowTime).getTime() }, 'end')
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

  /*
  you can make style like this
  const boxStyle={
    height: '100%', minHeight: '100vh'
  }
  */

  return (
    <HttpsRedirect disabled={(window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') ? true : false}>
      <CssBaseline />
      <Box bgcolor="text.disabled" style={{ height: '100%', minHeight: '100vh' }}>
        <ElevationScroll {...App.props}>
          <AppBar color="default" position="sticky" top={0}>
            <Toolbar>
              <Typography variant="h6" style={{ flexGrow: 1 }}>
                <Link href="https://rockie-stockalertclient.herokuapp.com/" color="inherit">
                  StockAlertClient
            </Link>
              </Typography>
              {login.email === ''
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
            {sendingForm ? <LinearProgress /> : null}
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
                        <Button variant="contained" color="primary" onClick={fun_save} disabled={sendingForm}>Save&nbsp;
                        {sendingForm ? <CircularProgress size={20} style={{ color: "white" }} /> : null}
                        </Button>
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
                      <Grid item xs={false} sm={2} md={2} className={classes.margin1}>
                        <Typography>Alert</Typography>
                      </Grid>
                      <Grid item xs={false} sm={2} md={2} className={classes.margin1}>
                        <Typography>now$ to alert$</Typography>
                      </Grid>
                    </Hidden>
                  </Grid>
                </Box>
                <Divider />
                {stockNotify.length !== 0
                  ?
                  stockNotify.map((row, index) => (
                    <Fragment>
                      <Box display="flex" alignItems="center" padding={2} onClick={() => openDialog(index)} boxShadow={boxShadow === index ? 1 : 0} onMouseEnter={() => fun_boxShadow(index)} onMouseLeave={() => fun_boxShadow(index)}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={3} sm={1} md={1} className={classes.margin1}>
                            <Avatar onClick={() => clickAvatar(index)}>{edit && boxShadow === index ? 'X' : (index + 1)}</Avatar>
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
                                  <Fragment>
                                    <span>{" ("}</span>
                                    <span style={
                                      (
                                        ((parseFloat(row.nowPrice) - parseFloat(row.past)) > 0)
                                          ?
                                          { color: 'green' }
                                          :
                                          ((parseFloat(row.nowPrice) - parseFloat(row.past)) < 0)
                                            ?
                                            { color: 'red' }
                                            :
                                            {}
                                      )
                                    }>
                                      {
                                        ((parseFloat(row.nowPrice) - parseFloat(row.past)) > 0 ? '+' : '')
                                        +
                                        parseFloat(
                                          Math.round((parseFloat(row.nowPrice) - parseFloat(row.past)
                                            + 0.00001
                                            * ((parseFloat(row.nowPrice) - parseFloat(row.past)) > 0 ? 1 : -1)
                                          )
                                            * 1000)
                                          / 1000
                                        )
                                      }

                                    </span>
                                    <span>{")"}</span>
                                  </Fragment>
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
                      <Box textAlign="center" alignItems="center" margin={2} onMouseEnter={test2} onMouseLeave={test2}>
                        <Typography color="textSecondary" align="center">
                          <CircularProgress />
                        </Typography>
                      </Box>
                      <Divider />
                    </Fragment>
                    :
                    <Fragment>
                      <Box textAlign="center" alignItems="center" margin={2} onMouseEnter={test2} onMouseLeave={test2}>
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
        <Box position="relative" width="100%" height="50%" minHeight="200px" color="background.paper" display="flex" alignItems="center" justifyContent="center">
          <Typography align="center" variant="h6">
            make by
            <Link href="mailto:rockie2695@gmail.com">
              rockie2695@gmail.com
            </Link>
          </Typography>
        </Box>
        {/* following box is close of  <Box bgcolor="text.disabled" style={{ height: '100vh' }}>*/}
      </Box >
      <Dialog fullWidth={true} onClose={closeDialog} aria-labelledby="dialog-title" open={open}>
        <DialogTitle id="dialog-title" onClose={closeDialog}>
          Stock:{dialogIndex > -1 ? stockNotify[dialogIndex].stock + ' (' + stockNotify[dialogIndex].name + ')' : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            {selectHistory.length !== 0
              ?
              <ResponsiveContainer width='100%' height={400}>
                <LineChart data={selectHistory} margin={{ top: 10, right: 25, bottom: 10, left: 0 }}>
                  <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} dot={false} />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <XAxis dataKey="jsTime" tickFormatter={(unixTime) => moment(unixTime).format('HH:mm')} type='number' scale='time' domain={['dataMin', 'dataMax']} />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip labelFormatter={(unixTime) => moment(unixTime).format('HH:mm')} />
                </LineChart>
              </ResponsiveContainer>
              :
              null
            }
          </Typography>
          <Typography gutterBottom>
            {dialogIndex > -1
              ?
              <table class="dialog">
                <colgroup>
                  <col style={{ width: '33.33%' }} />
                  <col style={{ width: '33.33%' }} />
                  <col style={{ width: '33.33%' }} />
                </colgroup>
                <tr>
                  <td>
                    price
                  </td>
                  <td>
                    現價
                  </td>
                  <td>
                    {stockNotify[dialogIndex].nowPrice}
                  </td>
                </tr>

                <tr>
                  <td>
                    past
                  </td>
                  <td>
                    前收市價
                  </td>
                  <td>
                    {stockNotify[dialogIndex].past}
                  </td>
                </tr>

                <tr>
                  <td>
                    tenDayLow
                  </td>
                  <td>
                    10日低
                  </td>
                  <td>
                    {stockNotify[dialogIndex].tenDayLow}
                  </td>
                </tr>

                <tr>
                  <td>
                    tenDayHigh
                  </td>
                  <td>
                    10日高
                  </td>
                  <td>
                    {stockNotify[dialogIndex].tenDayHigh}
                  </td>
                </tr>

                <tr>
                  <td>
                    tenDayAvg
                  </td>
                  <td>
                    10日平均價
                  </td>
                  <td>
                    {stockNotify[dialogIndex].tenDayAvg}
                  </td>
                </tr>

                <tr>
                  <td>
                    monthLow
                  </td>
                  <td>
                    1個月低
                  </td>
                  <td>
                    {stockNotify[dialogIndex].monthLow}
                  </td>
                </tr>

                <tr>
                  <td>
                    monthHigh
                  </td>
                  <td>
                    1個月高
                  </td>
                  <td>
                    {stockNotify[dialogIndex].monthHigh}
                  </td>
                </tr>

                <tr>
                  <td>
                    twentyDayAvg
                  </td>
                  <td>
                    20日平均價
                  </td>
                  <td>
                    {stockNotify[dialogIndex].twentyDayAvg}
                  </td>
                </tr>

                <tr>
                  <td>
                    wk52Low
                  </td>
                  <td>
                    52周低
                  </td>
                  <td>
                    {stockNotify[dialogIndex].wk52Low}
                  </td>
                </tr>

                <tr>
                  <td>
                    wk52High
                  </td>
                  <td>
                    52周高
                  </td>
                  <td>
                    {stockNotify[dialogIndex].wk52High}
                  </td>
                </tr>

                <tr>
                  <td>
                    fiftyDayAvg
                  </td>
                  <td>
                    50日平均價
                  </td>
                  <td>
                    {stockNotify[dialogIndex].fiftyDayAvg}
                  </td>
                </tr>
              </table>
              :
              ''
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={closeDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </HttpsRedirect >
  );
}
export default App;
