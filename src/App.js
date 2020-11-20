import React, {
  useState,
  useEffect,
  Fragment,
  useRef,
  lazy,
  Suspense,
} from "react";
import Typography from "@material-ui/core/Typography";
import Cookies from "universal-cookie";
import webSocket from "socket.io-client";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Divider from "@material-ui/core/Divider";
import Avatar from "@material-ui/core/Avatar";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Hidden from "@material-ui/core/Hidden";
import Skeleton from "@material-ui/lab/Skeleton";
import IconButton from "@material-ui/core/IconButton";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import MenuItem from "@material-ui/core/MenuItem";
import Link from "@material-ui/core/Link";
import HttpsRedirect from "react-https-redirect";
import CircularProgress from "@material-ui/core/CircularProgress";
import CssBaseline from "@material-ui/core/CssBaseline";
import Fab from "@material-ui/core/Fab";
import GetAppIcon from "@material-ui/icons/GetApp";
import { subscribeUser } from "./subscription";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import CloseIcon from "@material-ui/icons/Close";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import CountUp from "react-countup";
import Fade from "@material-ui/core/Fade";
import Collapse from "@material-ui/core/Collapse";

import { useHistory, withRouter } from "react-router-dom";

import "./App.css";
import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";

/**
 * qr code
 * test notify
 */

let host = "https://rockie-stockAlertServer.herokuapp.com";
let testlink = false;
if (
  window.location.host === "localhost:3000" ||
  window.location.host === "localhost:5000"
) {
  host = "http://localhost:3001";
  testlink = true;
}

const green_color = green[500];
const red_color = red[500];

const Menu = lazy(() => import("./Menu"));
const DialogBox = lazy(() => import("./DialogBox"));
const renderLoader = () => <div>Loading</div>;

const App = () => {
  let history = useHistory();

  const cookies = new Cookies();
  const clientId =
    "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com";

  const [login, setLogin] = useState({
    email: testlink ? "rockie2695@gmail.com" : "",
  });
  const [stockHistory, setStockHistory] = useState([]);
  const [ws, setWs] = useState(null);
  const [stockNotify, setStockNotify] = useState([]);
  const [oldStockNotify, setOldStockNotify] = useState([]);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingForm, setSendingForm] = useState(false);
  const [addRoomList, setAddRoomList] = useState([]);
  const [open, setOpen] = useState(false);
  const [dialogIndex, setDialogIndex] = useState(-1);
  const [selectHistory, setSelectHistory] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [fullScreenSetting, setFullScreenSetting] = useState(false);
  const [priceDiffPercentSetting, setPriceDeffPercentSetting] = useState(false);
  const [darkModeSetting, setDarkModeSetting] = useState(false);
  const connectWebSocket = () => {
    //開啟
    setWs(webSocket(host));
  };
  const wsRef = useRef(ws);
  wsRef.current = ws;
  const dialogIndexRef = useRef(dialogIndex);
  dialogIndexRef.current = dialogIndex;
  const stockNotifyRef = useRef(stockNotify);
  stockNotifyRef.current = stockNotify;
  const loginRef = useRef(login);
  loginRef.current = login;
  const stockHistoryRef = useRef(stockHistory);
  stockHistoryRef.current = stockHistory;

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode || darkModeSetting ? "dark" : "light",
          primary: {
            light: "#4dabf5",
            main: "#2196f3",
            dark: "#1769aa",
            contrastText: "#fff",
          },
          secondary: {
            light: "#ff7961",
            main: "#f44336",
            dark: "#ba000d",
            contrastText: "#000",
          },
        },
      }),
    [prefersDarkMode, darkModeSetting]
  );
  const isDarkMode = theme.palette.type === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const hideAlert = useMediaQuery(theme.breakpoints.down("xs"));

  useEffect(() => {
    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      //e.preventDefault();
      // Stash the event so it can be triggered later.
      console.log("beforeinstallprompt", e);
      setDeferredPrompt((prevState) => e);
      e.userChoice.then(function (choiceResult) {
        console.log(choiceResult.outcome);
        if (choiceResult.outcome === "dismissed") {
          console.log("User cancelled home screen install");
        } else {
          console.log("User added to home screen");
        }
      });
    });
    if (testlink) {
      fun_login({});
    }
  }, []);

  useEffect(() => {
    if (ws) {
      //連線成功在 console 中打印訊息
      //console.log("success connect!");
      //設定監聽
      initWebSocket();
    }
  }, [ws]);

  useEffect(() => {
    if (login.email !== "") {
      //console.log("do startConnectWS");
      startConnectWS();
    }
  }, [login]);

  const handleConnectionChange = () => {
    const condition = navigator.onLine ? "online" : "offline";
    if (condition === "online") {
    } else {
    }
  };

  const showA2HS = (e) => {
    //console.log("call this medhod showA2HS");
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the A2HS prompt");
      } else {
        console.log("User dismissed the A2HS prompt");
      }
      setDeferredPrompt((prevState) => null);
    });
  };

  const initWebSocket = () => {
    // Server 通知完後再傳送 disConnection 通知關閉連線
    ws.on("disConnection", () => {
      ws.close();
    });
    ws.on("connect_error", function () {
      console.log("Failed to connect to server");
      alert("websocket is fail to connect. Please refresh!");
      //window.location.reload()
    });
    ws.on("stockPrice", (message) => {
      message.jsTime = new Date(message.time).getTime();
      let findStockNameArray = [];
      let changeSelectHistoryArray = [];
      let needEmptySelectHistory = false;
      setStockNotify((prevState) => {
        return prevState.map((row, index) => {
          let addObject = {};
          if (row.stock === message.stock) {
            addObject = { nowPrice: message.price, nowTime: message.time };
            if (row.hasOwnProperty("nowPrice")) {
              addObject = { ...addObject, oldPrice: row.nowPrice };
            }
            if (
              message.time.split(" ")[1] === "09:20" ||
              (typeof row.nowTime !== "undefined" &&
                message.time.split(" ")[0] !== row.nowTime.split(" ")[0])
            ) {
              findStockNameArray = [
                { stock: row.stock, email: loginRef.current.email },
              ];
              changeSelectHistoryArray = [
                {
                  stock: row.stock,
                  index: index,
                  message: message,
                  side: "new",
                },
              ];
              needEmptySelectHistory = true;
            } else {
              changeSelectHistoryArray = [
                {
                  stock: row.stock,
                  index: index,
                  message: message,
                  side: "end",
                },
              ];
            }
          }
          return { ...row, ...addObject };
        });
      });
      if (needEmptySelectHistory) {
        setStockHistory((prevState) => {
          return prevState.map((row, index) => {
            if (row.stock === message.stock) {
              return { ...row, priceWithTime: [] };
            } else {
              return { ...row };
            }
          });
        });
      }
      if (findStockNameArray.length !== 0) {
        findStockName(findStockNameArray[0].stock, loginRef.current.email);
      } else if (
        changeSelectHistoryArray.length !== 0 &&
        dialogIndexRef.current > -1
      ) {
        changeSelectHistory(
          changeSelectHistoryArray[0].stock,
          changeSelectHistoryArray[0].message,
          changeSelectHistoryArray[0].side
        );
      }
      let time = message.time.split(" ")[1];

      setStockHistory((prevState) => {
        return prevState.map((row, index) => {
          if (
            typeof row.stock !== "undefined" &&
            row.stock === message.stock &&
            !row.priceWithTime.some((e) => e.time === time)
          ) {
            return {
              ...row,
              priceWithTime: [
                ...row.priceWithTime,
                { time: time, price: message.price, jsTime: message.jsTime },
              ],
            };
          } else {
            return row;
          }
        });
      });
    });
    ws.on("changeAlert", (message) => {
      setStockNotify((prevState) => {
        return prevState.map((row, index) => {
          let addObject = {};
          if (row._id === message._id && row.stock === message.stock) {
            addObject = { alert: message.alert };
          }
          return { ...row, ...addObject };
        });
      });
    });
  };
  const changePriceDiffPercentSetting = () => {
    setPriceDeffPercentSetting((prevState) => !prevState);
  };
  const changeFullScreenSetting = () => {
    setFullScreenSetting((prevState) => !prevState);
  };
  const changeDarkModeSetting = () => {
    setDarkModeSetting((prevState) => !prevState);
  };
  const changeSelectHistory = (stock, message, side = "new") => {
    if (
      dialogIndexRef.current > -1 &&
      stock === stockNotifyRef.current[dialogIndexRef.current].stock
    ) {
      if (side === "end") {
        let time = message.time.split(" ")[1];
        if (!selectHistory.some((e) => e.time === time)) {
          setSelectHistory((prevState) => {
            let addArray = [];
            if (!prevState.some((e) => e.time === time)) {
              addArray = [
                {
                  time: time,
                  price: message.price,
                  jsTime: message.jsTime,
                  low: message.low,
                  high: message.high,
                },
              ];
            }
            return [...prevState, ...addArray];
          });
        }
      } else if (side === "new") {
        let time = message.time.split(" ")[1];
        setSelectHistory((prevState) => {
          return [
            {
              time: time,
              price: message.price,
              jsTime: message.jsTime,
              low: message.low,
              high: message.high,
            },
          ];
        });
      } else if (side === "front") {
        if (message.length >= 2 && selectHistory.length >= 1) {
          //check second last
          if (
            message[message.length - 2].time ===
            selectHistory[selectHistory.length - 1].time
          ) {
            message.splice(message.length - 2, 2);
          }
        }
        if (message.length >= 1 && selectHistory.length >= 1) {
          //check last one
          if (
            message[message.length - 1].time ===
            selectHistory[selectHistory.length - 1].time
          ) {
            message.splice(message.length - 1, 1);
          } else if (
            selectHistory.length >= 2 &&
            message[message.length - 1].time ===
              selectHistory[selectHistory.length - 2].time
          ) {
            message.splice(message.length - 1, 1);
          }
        }
        setSelectHistory((prevState) => {
          return [...message, ...prevState];
        });
      }
    }
  };

  const openDialog = (index) => {
    if (!edit) {
      setOpen((prevState) => true);
      setDialogIndex((prevState) => index);
      history.push("/" + stockNotify[index]._id);
      console.log(index);
      console.log(stockHistory, stockNotify, selectHistory);
      for (let i = 0; i < stockHistory.length; i++) {
        if (stockHistory[i].stock === stockNotify[index].stock) {
          setSelectHistory(stockHistory[i].priceWithTime);
          break;
        }
      }
    }
  };
  const closeDialog = () => {
    //console.log(selectHistory);
    setOpen((prevState) => false);
    setTimeout(() => {
      setDialogIndex((prevState) => -1);
      setSelectHistory([]);
    }, 100);
    history.push("/");
  };

  const fun_login = (response) => {
    if (response.hasOwnProperty("tokenId")) {
      let email = response.profileObj.email;
      let newLoginObj = {
        id: response.tokenId,
        username: response.profileObj.name,
        photo: response.profileObj.imageUrl,
        email: email,
      };
      setLogin((prevState) => {
        return { ...prevState, ...newLoginObj };
      });
      cookies.set("id", response.tokenId, {
        secure: true,
        sameSite: true,
        maxAge: 3600,
        domain: window.location.host,
      });
      setLoading((prevState) => {
        return true;
      });
      subscribeUser(email);
      //getstockNotify
      fetch(host + "/select/stockNotify", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email, //login.email
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (typeof result.ok !== "undefined") {
            let resultArray = result.ok;
            wsRef.current.emit("addRoom", email);
            for (let i = 0; i < resultArray.length; i++) {
              if (!stockNotify.some((e) => e._id === resultArray[i]._id)) {
                setStockNotify((prevState) => {
                  return [...prevState, resultArray[i]];
                });
                setOldStockNotify((prevState) => {
                  return [...prevState, resultArray[i]];
                });
                setStockHistory((prevState) => {
                  if (
                    !prevState.some((e) => e.stock === resultArray[i].stock)
                  ) {
                    return [
                      ...prevState,
                      { stock: resultArray[i].stock, priceWithTime: [] },
                    ];
                  } else {
                    return prevState;
                  }
                });
                setAddRoomList((prevState) => {
                  if (!prevState.includes(resultArray[i].stock)) {
                    wsRef.current.emit("addRoom", resultArray[i].stock);
                    return [...prevState, resultArray[i].stock];
                  } else {
                    return prevState;
                  }
                });
                findStockName(resultArray[i].stock, email);
                findStockHistory(resultArray[i].stock, email);
              }
            }
            setTimeout(function () {
              if (typeof history.location.pathname !== "undefined") {
                let pathName = history.location.pathname.replace("/", "");
                let k = 0;
                for (; k < resultArray.length; k++) {
                  if (resultArray[k]._id === pathName) {
                    break;
                  }
                }
                if (k !== resultArray.length) {
                  setOpen((prevState) => true);
                  setDialogIndex((prevState) => k);
                  for (let j = 0; j < stockHistoryRef.current.length; j++) {
                    if (
                      stockHistoryRef.current[j].stock ===
                      stockNotifyRef.current[k].stock
                    ) {
                      setSelectHistory(
                        stockHistoryRef.current[j].priceWithTime
                      );
                      break;
                    }
                  }
                } else {
                  history.push("/");
                }
              }
            }, 0);
          } else {
            console.log(result);
            alert("server error. Please refresh");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Can't get your notification. Please refresh");
        })
        .finally(() => {
          setLoading((prevState) => {
            return false;
          });
        });
    } else if (testlink) {
      let email = login.email;
      setLoading((prevState) => {
        return true;
      });
      //getstockNotify
      fetch(host + "/select/stockNotify", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email, //login.email
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (typeof result.ok !== "undefined") {
            let resultArray = result.ok;
            wsRef.current.emit("addRoom", email);
            for (let i = 0; i < resultArray.length; i++) {
              if (!stockNotify.some((e) => e._id === resultArray[i]._id)) {
                setStockNotify((prevState) => {
                  return [...prevState, resultArray[i]];
                });
                setOldStockNotify((prevState) => {
                  return [...prevState, resultArray[i]];
                });
                setStockHistory((prevState) => {
                  if (
                    !prevState.some((e) => e.stock === resultArray[i].stock)
                  ) {
                    return [
                      ...prevState,
                      { stock: resultArray[i].stock, priceWithTime: [] },
                    ];
                  } else {
                    return prevState;
                  }
                });
                setAddRoomList((prevState) => {
                  if (!prevState.includes(resultArray[i].stock)) {
                    wsRef.current.emit("addRoom", resultArray[i].stock);
                    return [...prevState, resultArray[i].stock];
                  } else {
                    return prevState;
                  }
                });
                findStockName(resultArray[i].stock, email);
                findStockHistory(resultArray[i].stock, email);
              }
            }
            setTimeout(function () {
              if (typeof history.location.pathname !== "undefined") {
                let pathName = history.location.pathname.replace("/", "");
                let k = 0;
                for (; k < resultArray.length; k++) {
                  if (resultArray[k]._id === pathName) {
                    break;
                  }
                }
                if (k !== resultArray.length) {
                  setOpen((prevState) => true);
                  setDialogIndex((prevState) => k);
                  for (let j = 0; j < stockHistoryRef.current.length; j++) {
                    if (
                      stockHistoryRef.current[j].stock ===
                      stockNotifyRef.current[k].stock
                    ) {
                      setSelectHistory(
                        stockHistoryRef.current[j].priceWithTime
                      );
                      break;
                    }
                  }
                } else {
                  history.push("/");
                }
              }
            }, 0);
          } else {
            console.log(result);
            alert("server error. Please refresh");
          }
        })
        .catch((err) => {
          console.log(err);
          alert("Can't get your notification. Please refresh");
        })
        .finally(() => {
          setLoading((prevState) => {
            return false;
          });
        });
    }
  };
  const fun_logout = () => {
    setLogin((prevState) => {
      return { email: "" };
    });
    cookies.remove("id", {
      secure: true,
      sameSite: true,
      maxAge: 3600,
      domain: window.location.host,
    });
  };
  const fun_addNotify = () => {
    setStockNotify((prevState) => {
      return [
        ...prevState,
        { stock: "", price: "1", equal: ">=", alert: true },
      ];
    });
  };
  const startConnectWS = () => {
    //run when have login object
    console.log("startConnectWS");
    connectWebSocket();
  };

  const changeAlertInfo = (event) => {
    if (event.target.name !== null) {
      setStockNotify((prevState) => {
        return prevState.map((row, index) => {
          let addObject = {};
          let target = event.target.name.split("_");
          let value = event.target.value;
          if (index === parseInt(target[1])) {
            if (target[0] === "price") {
              if (isNaN(parseFloat(event.target.value))) {
                value = event.target.value;
              } else {
                value = parseFloat(event.target.value);
              }
            }
            addObject = { [target[0]]: value };
          }
          return { ...row, ...addObject };
        });
      });
    }
  };
  const loseFocusAlertInfo = (event) => {
    if (event.target.name !== null) {
      setStockNotify((prevState) => {
        return prevState.map((row, index) => {
          let addObject = {};
          let target = event.target.name.split("_");
          let value = event.target.value;

          if (index === parseInt(target[1]) && target[0] === "stock") {
            if (value.length > 5) {
              value = value.substring(value.length - 5, value.length);
            }
            value = value.padStart(5, "0");
            addObject = { [target[0]]: value };
          }
          return { ...row, ...addObject };
        });
      });
    }
  };
  const fun_save = () => {
    setSendingForm((prevState) => {
      return true;
    });
    let updateMessage = [];
    let insertMessage = [];
    for (let i = 0; i < stockNotify.length; i++) {
      if (
        stockNotify[i].stock !== "" &&
        parseInt(stockNotify[i].stock) !== 0 &&
        stockNotify[i].price !== ""
      ) {
        if (typeof stockNotify[i]._id !== "undefined") {
          //update
          updateMessage.push({
            _id: stockNotify[i]._id,
            stock: stockNotify[i].stock,
            price: parseFloat(stockNotify[i].price),
            equal: stockNotify[i].equal,
            alert: stockNotify[i].alert,
            oldStock: oldStockNotify[i].stock,
          });
        } else {
          //new to add
          insertMessage.push({
            stock: stockNotify[i].stock,
            price: parseFloat(stockNotify[i].price),
            equal: stockNotify[i].equal,
            alert: stockNotify[i].alert,
          });
        }
      }
    }
    if (updateMessage.length !== 0 || insertMessage.length !== 0) {
      fetch(host + "/update/stockNotify", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: login.email,
          update: updateMessage,
          insert: insertMessage,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (typeof result.ok !== "undefined") {
            let resultArray = result.ok;
            for (let i = 0; i < addRoomList.length; i++) {
              wsRef.current.emit("leaveRoom", addRoomList[i].stock);
            }
            setAddRoomList((prevState) => {
              return [];
            });
            setStockNotify((prevState) => {
              return resultArray;
            });
            let addStockHistory = [];
            for (let i = 0; i < resultArray.length; i++) {
              addStockHistory.push({
                stock: resultArray[i].stock,
                priceWithTime: [],
              });
            }
            setStockHistory((prevState) => {
              return addStockHistory;
            });
            setOldStockNotify((prevState) => {
              return resultArray;
            });
            setEdit((prevState) => {
              return false;
            });
            for (let i = 0; i < resultArray.length; i++) {
              setAddRoomList((prevState) => {
                if (!prevState.includes(resultArray[i].stock)) {
                  wsRef.current.emit("addRoom", resultArray[i].stock);
                  return [...prevState, resultArray[i].stock];
                } else {
                  return prevState;
                }
              });
              findStockName(resultArray[i].stock, login.email);
              findStockHistory(resultArray[i].stock, login.email);
            }
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setSendingForm((prevState) => {
            return false;
          });
        });
    }
  };
  const fun_edit = () => {
    if (edit === true) {
      setStockNotify((prevState) => {
        return prevState.filter((row, index) => {
          return typeof row._id !== "undefined";
        });
      });
      setStockNotify((prevState) => {
        return prevState.map((row, index) => {
          return {
            ...row,
            ...{
              stock: oldStockNotify[index].stock,
              price: oldStockNotify[index].price,
              equal: oldStockNotify[index].equal,
            },
          };
        });
      });
    }
    setEdit((prevState) => {
      return !prevState;
    });
  };
  const changeAlertSwitch = (rowIndex, _id, alert) => {
    if (edit === true && typeof stockNotify[rowIndex]._id !== "undefined") {
      fetch(host + "/update/stockNotify/alert", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: login.email,
          _id: _id,
          alert: !alert,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (typeof result.ok !== "undefined") {
            setStockNotify((prevState) => {
              return prevState.map((row, index) => {
                let addObject = {};
                if (index === rowIndex) {
                  addObject = { alert: !alert };
                }
                return { ...row, ...addObject };
              });
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  const clickAvatar = (index) => {
    if (edit) {
      if (typeof stockNotify[index]._id !== "undefined") {
        let id = stockNotify[index]._id;
        let stock = stockNotify[index].stock;
        let count = stockNotify.filter((row) => row.stock === stock).length;
        fetch(host + "/delete/stockNotify/", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: login.email,
            id: id,
            stock: stock,
          }),
        })
          .then((res) => res.json())
          .then((result) => {
            console.log(result);
            if (typeof result.ok !== "undefined") {
              //delete stockNotify , stockHistory && leave room
              setStockNotify((prevState) => {
                return prevState.filter((row, index) => {
                  return row._id !== id;
                });
              });
              if (count === 1) {
                setStockHistory((prevState) => {
                  return prevState.filter((row, index) => {
                    return row.stock !== stock;
                  });
                });
              }
              for (let i = 0; i < addRoomList.length; i++) {
                wsRef.current.emit("leaveRoom", addRoomList[i].stock);
              }
              setAddRoomList((prevState) => {
                return [];
              });
              for (let i = 0; i < stockHistory.length; i++) {
                setAddRoomList((prevState) => {
                  if (!prevState.includes(stockHistory[i].stock)) {
                    wsRef.current.emit("addRoom", stockHistory[i].stock);
                    return [...prevState, stockHistory[i].stock];
                  } else {
                    return prevState;
                  }
                });
              }
            } else if (typeof result.error !== "undefined") {
              alert(result.error);
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        setStockNotify((prevState) => {
          return prevState.filter((row, row_index) => {
            return row_index !== index;
          });
        });
      }
    }
  };
  const findStockHistory = (stock, subEmail) => {
    fetch(host + "/select/stockPrice/", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: subEmail,
        stock: stock,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        let j = 0;
        for (j = 0; j < stockHistoryRef.current.length; j++) {
          if (stockHistoryRef.current[j].stock === stock) {
            break;
          }
        }
        let insertHistory = [];
        for (let i = 0; i < result.ok.length; i++) {
          let rowTime = new Date(result.ok[i].time).toLocaleString("en-US", {
            timeZone: "UTC",
          });
          result.ok[i].jsTime = new Date(rowTime).getTime();
          result.ok[i].time = result.ok[i].stringTime.split(" ")[1];
          if (
            !stockHistoryRef.current[j].priceWithTime.some(
              (e) => e.time === result.ok[i].time
            )
          ) {
            insertHistory.push({
              time: result.ok[i].time,
              price: result.ok[i].price,
              jsTime: result.ok[i].jsTime,
              high: result.ok[i].high,
              low: result.ok[i].low,
            });
          }
        }
        setStockHistory((prevState) => {
          return prevState.map((row, index) => {
            if (row.stock === stock) {
              if (typeof row.priceWithTime === "undefined") {
                return {
                  ...row,
                  priceWithTime: [...insertHistory],
                };
              } else {
                return {
                  ...row,
                  priceWithTime: [...insertHistory, ...row.priceWithTime],
                };
              }
            } else {
              return row;
            }
          });
        });
        changeSelectHistory(stock, result.ok, "front");
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const findStockName = (stock, subEmail) => {
    //since email object may not contain before login
    fetch(host + "/find/stockName/", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: subEmail,
        stock: stock,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        let name = result.name;
        let stock = result.stock;
        let past = result.past;
        let nowPrice = result.nowPrice;
        let nowTime = result.nowTime;
        let tenDayLow = result.tenDayLow;
        let tenDayHigh = result.tenDayHigh;
        let tenDayAvg = result.tenDayAvg;
        let monthLow = result.monthLow;
        let monthHigh = result.monthHigh;
        let twentyDayAvg = result.twentyDayAvg;
        let wk52Low = result.wk52Low;
        let wk52High = result.wk52High;
        let fiftyDayAvg = result.fiftyDayAvg;
        let lotSize = result.lotSize;
        let eps = result.eps;
        let dividend = result.dividend;
        let rsi10 = result.rsi10;
        let rsi14 = result.rsi14;
        let rsi20 = result.rsi20;
        let pe = result.pe;
        let marketValue = result.marketValue;
        let issuedShare = result.issuedShare;
        let vol = result.vol;
        let tvr = result.tvr;
        //let row_index = -2
        setStockNotify((prevState) => {
          return prevState.map((row, index) => {
            let addObject = {};

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
                fiftyDayAvg: fiftyDayAvg,
                lotSize: lotSize,
                eps: eps,
                dividend: dividend,
                rsi10: rsi10,
                rsi14: rsi14,
                rsi20: rsi20,
                pe: pe,
                marketValue: marketValue,
                issuedShare: issuedShare,
                vol: vol,
                tvr: tvr,
              };
              if (typeof row.nowPrice === "undefined") {
                addObject = {
                  ...addObject,
                  ...{ nowPrice: nowPrice, nowTime: nowTime },
                };
              }
            }
            return { ...row, ...addObject };
          });
        });
        setStockHistory((prevState) => {
          return prevState.map((row, index) => {
            if (
              row.stock === stock &&
              !row.priceWithTime.some((e) => e.time === nowTime.split(" ")[1])
            ) {
              return {
                ...row,
                priceWithTime: [
                  ...row.priceWithTime,
                  {
                    time: nowTime.split(" ")[1],
                    price: nowPrice,
                    jsTime: new Date(nowTime).getTime(),
                  },
                ],
              };
            } else {
              return row;
            }
          });
        });
        changeSelectHistory(
          stock,
          {
            time: nowTime,
            price: nowPrice,
            jsTime: new Date(nowTime).getTime(),
          },
          "end"
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /*
  function getDayTime() {
    let today = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Hong_Kong",
    });
    today = new Date(today);
    let todayHour = today.getHours();
    let todayMinute = today.getMinutes();
    let todayDay = today.getDay(); //todayDay=0(sunday),1,2,3,4,5,6
    let todaySecond = today.getSeconds();
    return [todayHour, todayMinute, todayDay, today, todaySecond];
  }*/

  /*
  you can make style like this
  const boxStyle={
    height: '100%', minHeight: '100vh'
  }
  */

  return (
    <HttpsRedirect disabled={testlink ? true : false}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          bgcolor="text.disabled"
          style={{ height: "100%", minHeight: "100vh" }}
        >
          <Suspense fallback={renderLoader()}>
            <Menu
              login={login}
              clientId={clientId}
              fun_login={fun_login}
              fun_logout={fun_logout}
              sendingForm={sendingForm}
            />
          </Suspense>
          <Box
            position="fixed"
            zIndex="0"
            width="100vw"
            height="50vh"
            minHeight="200px"
            bgcolor="text.primary"
            color="background.paper"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography align="center" variant="h2">
              For HK Stock Price Showing And Notification
            </Typography>
          </Box>
          <Box height="50vh"></Box>
          <Box paddingX={1} paddingY={3} overflow="auto" position="relative">
            <Grid container alignItems="center">
              <Hidden only={["xs", "sm"]}>
                <Grid item sm={false} md={2} className="margin1"></Grid>
              </Hidden>
              <Grid item xs={12} sm={12} md={8} className="margin1">
                <Paper>
                  <Typography align="right" className="margin2">
                    {!prefersDarkMode ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={darkModeSetting}
                            onChange={changeDarkModeSetting}
                            name="Dark Mode Switch"
                            color="primary"
                          />
                        }
                        label="Dark Mode"
                      />
                    ) : null}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={priceDiffPercentSetting}
                          onChange={changePriceDiffPercentSetting}
                          name="Percent Price Diff Switch"
                          color="primary"
                        />
                      }
                      label="Percent Price Diff"
                    />
                    {!fullScreen ? (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={fullScreenSetting}
                            onChange={changeFullScreenSetting}
                            name="Full Screen Switch"
                            color="primary"
                          />
                        }
                        label="Full Screen Dialog"
                      />
                    ) : null}
                  </Typography>

                  <Typography align="right" className="margin2">
                    {edit === true ? (
                      <Fragment>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={fun_save}
                          disabled={sendingForm}
                        >
                          <Typography style={{ marginRight: 8 }}>
                            Save
                          </Typography>
                          {sendingForm ? (
                            <CircularProgress
                              size={20}
                              style={{ color: "white" }}
                            />
                          ) : (
                            <SaveIcon />
                          )}
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={fun_edit}
                          disabled={sendingForm}
                        >
                          <Typography>Cancel</Typography>
                          <CloseIcon />
                        </Button>
                      </Fragment>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={fun_edit}
                      >
                        <Typography style={{ marginRight: 8 }}>Edit</Typography>
                        <EditIcon />
                      </Button>
                    )}
                  </Typography>
                  <Box display="flex" alignItems="center" margin={2}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid
                        item
                        xs={3}
                        sm={1}
                        md={1}
                        className="margin1"
                      ></Grid>
                      <Grid item xs={5} sm={2} md={2} className="margin1">
                        <Typography>Stock Number</Typography>
                      </Grid>
                      <Grid item xs={4} sm={2} md={2} className="margin1">
                        <Typography>Price</Typography>
                      </Grid>
                      <Hidden only="xs">
                        <Grid
                          item
                          xs={false}
                          sm={2}
                          md={2}
                          className="margin1"
                        ></Grid>
                        <Grid item xs={false} sm={3} md={3} className="margin1">
                          <Typography style={{ textAlign: "center" }}>
                            now$ to alert$
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={false}
                          sm={1}
                          md={1}
                          className="margin1"
                        ></Grid>
                        <Grid item xs={false} sm={1} md={1} className="margin1">
                          <Typography>Alert</Typography>
                        </Grid>
                      </Hidden>
                    </Grid>
                  </Box>
                  <Divider />
                  {stockNotify.length !== 0 ? (
                    <Collapse in={!loading} timeout={1000}>
                      {stockNotify.map((row, index) => (
                        <Fade
                          in={true}
                          timeout={1000}
                          style={{
                            transitionDelay:
                              (row.hasOwnProperty("_id") ? index : 0) * 150 +
                              "ms",
                          }}
                          key={index}
                        >
                          <div>
                            <Box
                              className={
                                edit
                                  ? isDarkMode
                                    ? "boxDark"
                                    : "box"
                                  : isDarkMode
                                  ? "cursorPointer boxDark"
                                  : "cursorPointer box"
                              }
                              display="flex"
                              alignItems="center"
                              padding={2}
                              onClick={() => openDialog(index)}
                            >
                              <Grid container spacing={3} alignItems="center">
                                <Grid
                                  item
                                  xs={3}
                                  sm={1}
                                  md={1}
                                  className="margin1"
                                >
                                  <Avatar
                                    className={edit ? "cursorPointer" : ""}
                                    onClick={() => clickAvatar(index)}
                                  >
                                    {edit ? "X" : index + 1}
                                  </Avatar>
                                </Grid>
                                <Grid
                                  item
                                  xs={5}
                                  sm={2}
                                  md={2}
                                  className="margin1"
                                >
                                  {edit === true ? (
                                    <TextField
                                      type="number"
                                      style={{ minWidth: "85px" }}
                                      id={"stock_" + index}
                                      name={"stock_" + index}
                                      label="stock"
                                      variant="outlined"
                                      value={row.stock}
                                      margin="dense"
                                      autoComplete="off"
                                      onChange={changeAlertInfo}
                                      onBlur={loseFocusAlertInfo}
                                      disabled={sendingForm}
                                    />
                                  ) : (
                                    <Typography>
                                      {row.stock}{" "}
                                      {typeof row.name !== "undefined"
                                        ? row.name
                                        : null}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid
                                  item
                                  xs={4}
                                  sm={2}
                                  md={2}
                                  className="margin1"
                                >
                                  <Typography>
                                    {typeof row.nowPrice !== "undefined" ? (
                                      row.hasOwnProperty("oldPrice") ? (
                                        <CountUp
                                          start={row.oldPrice}
                                          end={row.nowPrice}
                                          decimals={3}
                                          prefix="$ "
                                          onEnd={() => console.log("Ended!")}
                                          onStart={() =>
                                            console.log("Started!")
                                          }
                                        />
                                      ) : (
                                        <CountUp
                                          end={row.nowPrice}
                                          decimals={3}
                                          prefix="$ "
                                        />
                                      )
                                    ) : (
                                      <Skeleton />
                                    )}

                                    {typeof row.past !== "undefined" &&
                                    typeof row.nowPrice !== "undefined" ? (
                                      <Fragment>
                                        <span>{" ("}</span>
                                        <span
                                          style={
                                            parseFloat(row.nowPrice) -
                                              parseFloat(row.past) >
                                            0
                                              ? { color: green_color }
                                              : parseFloat(row.nowPrice) -
                                                  parseFloat(row.past) <
                                                0
                                              ? { color: red_color }
                                              : {}
                                          }
                                        >
                                          {(parseFloat(row.nowPrice) -
                                            parseFloat(row.past) >
                                          0
                                            ? "+"
                                            : "") +
                                            (!priceDiffPercentSetting
                                              ? parseFloat(
                                                  Math.round(
                                                    (parseFloat(row.nowPrice) -
                                                      parseFloat(row.past) +
                                                      0.00001 *
                                                        (parseFloat(
                                                          row.nowPrice
                                                        ) -
                                                          parseFloat(row.past) >
                                                        0
                                                          ? 1
                                                          : -1)) *
                                                      1000
                                                  ) / 1000
                                                )
                                              : parseFloat(
                                                  Math.round(
                                                    ((parseFloat(row.nowPrice) -
                                                      parseFloat(row.past) +
                                                      0.00001 *
                                                        (parseFloat(
                                                          row.nowPrice
                                                        ) -
                                                          parseFloat(row.past) >
                                                        0
                                                          ? 1
                                                          : -1)) /
                                                      row.past) *
                                                      100000
                                                  ) / 1000
                                                ) + "%")}
                                        </span>
                                        <span>{")"}</span>
                                      </Fragment>
                                    ) : null}
                                  </Typography>
                                </Grid>
                                <Grid
                                  item
                                  xs={12}
                                  sm={2}
                                  md={2}
                                  className="margin1"
                                >
                                  <Typography
                                    color="textSecondary"
                                    align="center"
                                    variant="subtitle2"
                                  >
                                    {typeof row.nowTime !== "undefined" ? (
                                      row.nowTime
                                    ) : (
                                      <Skeleton />
                                    )}
                                  </Typography>
                                </Grid>
                                <Hidden only="xs">
                                  <Grid
                                    item
                                    xs={false}
                                    sm={2}
                                    md={2}
                                    className="margin1"
                                  >
                                    {edit ? (
                                      <TextField
                                        id={"equal_" + index}
                                        name={"equal_" + index}
                                        select
                                        label="equal"
                                        variant="outlined"
                                        margin="dense"
                                        value={row.equal}
                                        style={{ minWidth: "18px" }}
                                        onChange={changeAlertInfo}
                                        disabled={sendingForm}
                                        fullWidth={true}
                                      >
                                        <MenuItem key=">=" value=">=">
                                          {">="}
                                        </MenuItem>
                                        <MenuItem key="<=" value="<=">
                                          {"<="}
                                        </MenuItem>
                                      </TextField>
                                    ) : (
                                      <Typography
                                        style={{ textAlign: "center" }}
                                      >
                                        {row.equal}
                                      </Typography>
                                    )}
                                  </Grid>
                                  <Grid
                                    item
                                    xs={false}
                                    sm={2}
                                    md={2}
                                    className="margin1"
                                  >
                                    {edit ? (
                                      <TextField
                                        id={"price_" + index}
                                        name={"price_" + index}
                                        label="price"
                                        variant="outlined"
                                        value={row.price}
                                        margin="dense"
                                        autoComplete="off"
                                        disabled={sendingForm}
                                        InputProps={{
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              $
                                            </InputAdornment>
                                          ),
                                        }}
                                        style={{ minWidth: "90px" }}
                                        onChange={changeAlertInfo}
                                        type="number"
                                      />
                                    ) : (
                                      <Typography>${row.price}</Typography>
                                    )}
                                  </Grid>

                                  <Grid
                                    item
                                    xs={false}
                                    sm={1}
                                    md={1}
                                    className="margin1"
                                    style={{ textAlign: "center" }}
                                  >
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={row.alert}
                                          onChange={() =>
                                            changeAlertSwitch(
                                              index,
                                              row._id,
                                              row.alert
                                            )
                                          }
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
                            {index === stockNotify.length - 1 ? null : (
                              <Divider />
                            )}
                          </div>
                        </Fade>
                      ))}
                    </Collapse>
                  ) : (
                    <Fragment>
                      <Box
                        textAlign="center"
                        alignItems="center"
                        padding={2}
                        className={isDarkMode ? "boxDark" : "box"}
                      >
                        {loading === true ? (
                          <CircularProgress />
                        ) : (
                          <Typography color="textSecondary" align="center">
                            None of record
                          </Typography>
                        )}
                      </Box>
                    </Fragment>
                  )}
                  {stockNotify.length < 10 && edit === true ? (
                    <Fragment>
                      <Divider />
                      <Box
                        textAlign="center"
                        alignItems="center"
                        padding={2}
                        className={isDarkMode ? "boxDark" : "box"}
                      >
                        <Typography color="textSecondary" align="center">
                          <IconButton
                            color="primary"
                            aria-label="add notify"
                            onClick={fun_addNotify}
                          >
                            <AddCircleIcon fontSize="large" />
                          </IconButton>
                        </Typography>
                      </Box>
                    </Fragment>
                  ) : null}
                </Paper>
              </Grid>
              <Hidden only={["xs", "sm"]}>
                <Grid item sm={false} md={2} className="margin1"></Grid>
              </Hidden>
            </Grid>
          </Box>
          {/* <Box margin={2} overflow="auto"> */}
          <Box
            position="relative"
            paddingX={2}
            width="100%"
            height="20vh"
            minHeight="200px"
            color="background.paper"
            display="flex"
            alignItems="flex-end"
            justifyContent="center"
          >
            <Grid container alignItems="center">
              <Grid item xs={12} sm={12} md={6}>
                <Hidden only={["xs", "sm"]}>
                  <Typography align="left" variant="h6">
                    make by&nbsp;
                    <Link href="mailto:rockie2695@gmail.com">
                      rockie2695@gmail.com
                    </Link>
                  </Typography>
                </Hidden>
                <Hidden mdUp>
                  <Typography align="center" variant="h6">
                    make by&nbsp;
                    <Link href="mailto:rockie2695@gmail.com">
                      rockie2695@gmail.com
                    </Link>
                  </Typography>
                </Hidden>
              </Grid>
              <Grid item xs={12} sm={12} md={6}>
                <Hidden only={["xs", "sm"]}>
                  <Box textAlign="right">
                    <Fab
                      color="primary"
                      aria-label="pwa"
                      onClick={showA2HS}
                      className={fullScreen ? "" : "marginRight12"}
                    >
                      <GetAppIcon />
                    </Fab>
                    <Typography variant="h6">Web App</Typography>
                  </Box>
                </Hidden>
                <Hidden mdUp>
                  {deferredPrompt !== null ? (
                    <Box textAlign="center">
                      <Fab
                        color="primary"
                        aria-label="pwa"
                        onClick={showA2HS}
                        className={fullScreen ? "" : "marginRight12"}
                      >
                        <GetAppIcon />
                      </Fab>
                      <Typography variant="h6">Web App</Typography>
                    </Box>
                  ) : null}
                </Hidden>
              </Grid>
            </Grid>
          </Box>
          {/* following box is close of  <Box bgcolor="text.disabled" style={{ height: '100vh' }}>*/}
        </Box>
        <Suspense fallback={renderLoader()}>
          <DialogBox
            closeDialog={closeDialog}
            open={open}
            fullScreen={fullScreen || fullScreenSetting}
            dialogIndex={dialogIndex}
            stockNotify={stockNotify}
            selectHistory={selectHistory}
            login={login}
            changeAlertSwitch={changeAlertSwitch}
            hideAlert={hideAlert}
            edit={edit}
            sendingForm={sendingForm}
            fun_edit={fun_edit}
            fun_save={fun_save}
            changeAlertInfo={changeAlertInfo}
            isDarkMode={isDarkMode}
            priceDiffPercentSetting={priceDiffPercentSetting}
          />
        </Suspense>
      </ThemeProvider>
    </HttpsRedirect>
  );
};
export default withRouter(App);
