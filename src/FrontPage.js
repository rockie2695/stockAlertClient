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
import CircularProgress from "@material-ui/core/CircularProgress";
import CssBaseline from "@material-ui/core/CssBaseline";
import Fab from "@material-ui/core/Fab";
import GetAppIcon from "@material-ui/icons/GetApp";
import { subscribeUser } from "./subscription";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import CloseIcon from "@material-ui/icons/Close";
import CountUp from "react-countup";
import Fade from "@material-ui/core/Fade";
import Collapse from "@material-ui/core/Collapse";
import AddIcon from "@material-ui/icons/Add";
import { useHistory, withRouter } from "react-router-dom";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
//import "./App.css";
import "./App.sass";
import classNames from "classnames";
import styled, { css } from "styled-components";
import {
  PriceDiff,
  ColorPriceSpan,
  green_color,
  red_color,
  testlink,
  host, host2,
  url,
} from "./common";

/**
 * add ordering
 */

const QRCode = require("qrcode.react");

const Menu = lazy(() => import("./Menu"));
const DialogBox = lazy(() => import("./DialogBox"));
const renderLoader = () => <div>Loading</div>;

const ColorPriceDiv = styled.div`
  border-radius: 10px;
  text-align: center;
  max-width: 120px;
  color: white;
  background: gray;
  ${(props) =>
    props.nowPrice - props.past > 0 &&
    css`
      background: ${green_color};
    `}
  ${(props) =>
    props.nowPrice - props.past < 0 &&
    css`
      background: ${red_color};
    `}
`;

const DialogTitle = (props) => {
  return (
    <MuiDialogTitle disableTypography className="padding2" {...props.other}>
      <Typography variant="h6">{props.children}</Typography>
      {props.onClose ? (
        <IconButton
          aria-label="close"
          className="closeButton"
          onClick={props.onClose}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
};

const FrontPage = (props) => {
  let history = useHistory();
  const cookies = new Cookies();
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
  const [fullScreenSetting, setFullScreenSetting] = useState(
    localStorage.getItem("fullScreenSetting") === null
      ? false
      : localStorage.getItem("fullScreenSetting") === "true"
  );
  const [priceDiffPercentSetting, setPriceDeffPercentSetting] = useState(
    localStorage.getItem("priceDiffPercentSetting") === null
      ? false
      : localStorage.getItem("priceDiffPercentSetting") === "true"
  );
  const [addStockDialog, setAddStockDialog] = useState(false);
  const [denseModeSetting, setDenseModeSetting] = useState(
    localStorage.getItem("denseModeSetting") === null
      ? false
      : localStorage.getItem("denseModeSetting") === "true"
  );

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

  useEffect(() => {
    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      //e.preventDefault();
      // Stash the event so it can be triggered later.
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
    if (testlink && login.emil !== "") {
      fun_login({});
    }
    return () => {
      setWs(() => null);
      setLogin({ email: "" });
      setStockNotify(() => []);
      setOldStockNotify(() => []);
      setEdit(() => false);
      setStockHistory(() => []);
      setAddRoomList(() => []);
      setSelectHistory(() => []);
      setWs(() => null);
    };
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
    } else {
      setStockNotify(() => []);
      setOldStockNotify(() => []);
      setEdit(() => false);
      setStockHistory(() => []);
      setAddRoomList(() => []);
      setSelectHistory(() => []);
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
      //alert("websocket is fail to connect. Please refresh!");
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
                { stock: row.stock, email: loginRef.current.email, index },
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
        findStockName(
          findStockNameArray[0].stock,
          loginRef.current.email,
          loginRef.current.id,
          findStockNameArray[0].index
        );
      } else if (
        changeSelectHistoryArray.length !== 0 &&
        dialogIndexRef.current > -1
      ) {
        changeSelectHistory(
          changeSelectHistoryArray[0].stock,
          changeSelectHistoryArray[0].message,
          changeSelectHistoryArray[0].side,
          changeSelectHistoryArray[0].index
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
    localStorage.setItem("priceDiffPercentSetting", !priceDiffPercentSetting);
    setPriceDeffPercentSetting((prevState) => !prevState);
  };
  const changeFullScreenSetting = () => {
    localStorage.setItem("fullScreenSetting", !fullScreenSetting);
    setFullScreenSetting((prevState) => !prevState);
  };
  const changeDarkModeSetting = () => {
    localStorage.setItem("darkModeSetting", !props.darkModeSetting);
    props.setDarkModeSetting((prevState) => !prevState);
  };
  const changeDenseModeSetting = () => {
    localStorage.setItem("denseModeSetting", !denseModeSetting);
    setDenseModeSetting((prevState) => !prevState);
  };
  const changeSelectHistory = (stock, message, side = "new", index = 0) => {
    if (
      dialogIndexRef.current > -1 &&
      stock === stockNotifyRef.current[dialogIndexRef.current].stock &&
      dialogIndexRef.current === index
    ) {
      if (side === "end") {
        let time = message.time.split(" ")[1];
        if (!selectHistory.some((e) => e.time === time)) {
          setSelectHistory((prevState) => {
            let addArray = [];
            if (!prevState.some((e) => e.time === time)) {
              addArray = [
                {
                  stock: message.stock,
                  time: time,
                  price: message.price,
                  stringTime: message.time,
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
              stock: message.stock,
              time: time,
              price: message.price,
              stringTime: message.time,
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
    if (!edit && typeof stockNotify[index]._id !== "undefined") {
      setOpen((prevState) => true);
      setDialogIndex((prevState) => index);
      history.push("/" + stockNotify[index]._id);
      for (let i = 0; i < stockHistory.length; i++) {
        if (stockHistory[i].stock === stockNotify[index].stock) {
          setSelectHistory(stockHistory[i].priceWithTime);
          break;
        }
      }
    }
  };
  const closeDialog = () => {
    setEdit(() => false);
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
      fetch(host2 + "/stockNotify", {
        method: "get",
        headers: { "Content-Type": "application/json", email: email, Authorization: response.tokenId },
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
                findStockName(resultArray[i].stock, email, response.tokenId, i);
                findStockHistory(resultArray[i].stock, email, response.tokenId, i);
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
    } else if (login.email !== "" && testlink) {
      let email = login.email;
      let tokenId = login.id;
      setLoading((prevState) => {
        return true;
      });
      //getstockNotify
      fetch(host2 + "/stockNotify", {
        method: "get",
        headers: { "Content-Type": "application/json", email: email, Authorization: tokenId },
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
                findStockName(resultArray[i].stock, email, tokenId, i);
                findStockHistory(resultArray[i].stock, email, tokenId, i);
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
    setTimeout(() => {
      window.location.reload();
    }, 0);
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
            if (value === "00000") {
              value = "";
            }
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
      fetch(host2 + "/stockNotify", {
        method: "put",
        headers: { "Content-Type": "application/json", email: login.email, Authorization: login.id },
        body: JSON.stringify({
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
            setAddStockDialog((prevState) => false);
            if (dialogIndexRef.current > resultArray.length - 1) {
              setDialogIndex(() => -1);
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
              findStockName(resultArray[i].stock, login.email, login.id, i);
              findStockHistory(resultArray[i].stock, login.email, login.id, i);
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
  const fun_addStockDialog = () => {
    if (!edit) {
      fun_addNotify();
      setTimeout(() => {
        setDialogIndex((prevState) => stockNotifyRef.current.length - 1);
      }, 0);
      setTimeout(() => {
        setAddStockDialog((prevState) => true);
      }, 100);
    } else {
      setAddStockDialog((prevState) => false);
    }
    fun_edit();
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
      fetch(host2 + "/stockNotify/" + _id + "/alert", {
        method: "put",
        headers: { "Content-Type": "application/json", email: login.email, Authorization: login.id },
        body: JSON.stringify({
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
    } else if (
      edit === true &&
      typeof stockNotify[rowIndex]._id === "undefined"
    ) {
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
  };
  const clickAvatar = (index) => {
    if (typeof stockNotify[index]._id !== "undefined") {
      let id = stockNotify[index]._id;
      let stock = stockNotify[index].stock;
      let count = stockNotify.filter((row) => row.stock === stock).length;
      fetch(host2 + "/stockNotify/" + id, {
        method: "delete",
        headers: { "Content-Type": "application/json", email: login.email, Authorization: login.id },
        body: JSON.stringify({
          stock: stock,
        }),
      })
        .then((res) => {
          if (res.status === 204) {
            setDialogIndex(() => -1);
            setOpen(() => false);
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
            history.push("/");
          } else {
            let result = res.json()
            if (typeof result.error !== "undefined") {
              alert(result.error);
            }
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
  };
  const findStockHistory = (stock, subEmail, subId, k) => {
    fetch(host2 + "/stockPrice/" + stock, {
      method: "get",
      headers: { "Content-Type": "application/json", email: subEmail, Authorization: subId },
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
        changeSelectHistory(stock, result.ok, "front", k);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const findStockName = (stock = "00001", subEmail, subId, index = 0) => {
    //since email object may not contain before login
    fetch(host2 + "/stockName/" + stock, {
      method: "get",
      headers: { "Content-Type": "application/json", email: subEmail, Authorization: subId },
    })
      .then((res) => res.json())
      .then((result) => {
        let {
          name,
          stock,
          past,
          nowPrice,
          nowTime,
          tenDayLow,
          tenDayHigh,
          tenDayAvg,
          monthLow,
          monthHigh,
          twentyDayAvg,
          wk52Low,
          wk52High,
          fiftyDayAvg,
          lotSize,
          eps,
          dividend,
          rsi10,
          rsi14,
          rsi20,
          pe,
          marketValue,
          issuedShare,
          vol,
          tvr,
        } = result;
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
          "end",
          index
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

  const boxClassWithPointer = classNames({
    box: true,
    cursorPointer: !edit,
    boxDark: props.isDarkMode,
  });
  const boxClassWithoutPointer = classNames({
    box: true,
    boxDark: props.isDarkMode,
  });
  const avatarClass = classNames({
    cursorPointer: edit,
  });
  const webAppIconClass = classNames({
    marginRight12: !props.fullScreen,
  });

  return (
    <Fragment>
      <CssBaseline />
      <Box
        bgcolor="text.disabled"
        style={{ height: "100%", minHeight: "100vh" }}
      >
        <Suspense fallback={renderLoader()}>
          <Menu
            login={login}
            fun_login={fun_login}
            fun_logout={fun_logout}
            sendingForm={sendingForm}
            changeDarkModeSetting={changeDarkModeSetting}
            darkModeSetting={props.darkModeSetting}
          />
        </Suspense>
        <Box
          position="fixed"
          zIndex="0"
          width="100vw"
          height="40vh"
          minHeight="200px"
          bgcolor="text.primary"
          color="background.paper"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography className="description" align="center" variant="h2">
            For HK Stock Price Showing And Notification
          </Typography>
        </Box>
        <Box height="25vh"></Box>
        <Box paddingX={1} paddingY={3} overflow="auto" position="relative">
          <Grid container alignItems="center">
            <Hidden only={["xs", "sm"]}>
              <Grid item sm={false} md={2} className="margin1"></Grid>
            </Hidden>
            <Grid item xs={12} sm={12} md={8} className="margin1">
              <Paper style={{ paddingBottom: 2 }}>
                <Typography
                  align="right"
                  className="margin1"
                  style={{ margin: "0.5em", paddingTop: "0.5em" }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={denseModeSetting}
                        onChange={changeDenseModeSetting}
                        name="Dense Mode Switch"
                        color="primary"
                      />
                    }
                    label="Dense Mode"
                  />
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
                  {!props.fullScreen ? (
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

                <Typography
                  align="right"
                  className="margin1"
                  style={{ margin: "0.5em" }}
                >
                  {props.hideAlert ||
                    denseModeSetting ||
                    login.email === "" ? null : edit === true ? (
                      <Fragment>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={fun_save}
                          disabled={sendingForm}
                        >
                          <Typography style={{ marginRight: 8 }}>Save</Typography>
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
                  {denseModeSetting ? (
                    <Grid container alignItems="center">
                      <Grid item xs={6} sm={6} md={6}>
                        <Typography>Stock Number</Typography>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        <Typography>Price ($)</Typography>
                      </Grid>
                    </Grid>
                  ) : (
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
                        <Grid item xs={false} sm={1} md={1}>
                          <Typography>Alert</Typography>
                        </Grid>
                      </Hidden>
                    </Grid>
                  )}
                </Box>
                <Divider />
                {stockNotify.length !== 0 ? (
                  <Collapse in={!loading} timeout={1000}>
                    {denseModeSetting
                      ? stockNotify.map((row, index) => (
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
                          <section>
                            <Box
                              className={boxClassWithPointer}
                              display="flex"
                              alignItems="center"
                              style={{
                                paddingLeft: 16,
                                paddingRight: 16,
                                height: 80,
                              }}
                              onClick={() => openDialog(index)}
                            >
                              <Grid container alignItems="center">
                                <Grid item xs={6} sm={6} md={6}>
                                  <Typography
                                    variant="h6"
                                    style={{ display: "inline-block" }}
                                  >
                                    {row.stock}{" "}
                                    {typeof row.name !== "undefined"
                                      ? row.name
                                      : null}
                                  </Typography>
                                  {typeof row.name === "undefined" ? (
                                    <Skeleton
                                      style={{
                                        width: "50%",
                                        display: "inline-block",
                                      }}
                                    />
                                  ) : null}
                                </Grid>
                                <Grid
                                  item
                                  xs={6}
                                  sm={6}
                                  md={6}
                                  className="margin1"
                                >
                                  {typeof row.nowPrice !== "undefined" ? (
                                    <ColorPriceDiv
                                      nowPrice={parseFloat(row.nowPrice)}
                                      past={parseFloat(row.past)}
                                    >
                                      <Typography variant="h6">
                                        {row.hasOwnProperty("oldPrice") ? (
                                          <CountUp
                                            start={row.oldPrice}
                                            end={row.nowPrice}
                                            decimals={3}
                                          />
                                        ) : (
                                          <CountUp
                                            end={row.nowPrice}
                                            decimals={3}
                                          />
                                        )}
                                      </Typography>
                                      <div
                                        style={{
                                          borderBottom: "1px solid white",
                                          width: "100%",
                                          height: "1px",
                                        }}
                                      >
                                        &nbsp;
                                      </div>
                                      {typeof row.past !== "undefined" &&
                                        typeof row.nowPrice !== "undefined" ? (
                                        <Typography variant="h6">
                                          <PriceDiff
                                            nowPrice={parseFloat(
                                              row.nowPrice
                                            )}
                                            past={parseFloat(row.past)}
                                            priceDiffPercentSetting={
                                              priceDiffPercentSetting
                                            }
                                          />
                                        </Typography>
                                      ) : null}
                                    </ColorPriceDiv>
                                  ) : (
                                    <Skeleton />
                                  )}
                                </Grid>
                              </Grid>
                            </Box>
                            {index === stockNotify.length - 1 ? null : (
                              <Divider />
                            )}
                          </section>
                        </Fade>
                      ))
                      : stockNotify.map((row, index) => (
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
                          <section>
                            <Box
                              className={boxClassWithPointer}
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
                                    className={avatarClass}
                                    onClick={
                                      edit ? () => clickAvatar(index) : null
                                    }
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
                                      id={`stock_${index}`}
                                      name={`stock_${index}`}
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
                                    <Fragment>
                                      <Typography
                                        style={{
                                          display: "inline-block",
                                        }}
                                      >
                                        {row.stock}
                                        &nbsp;
                                        {typeof row.name !== "undefined"
                                          ? row.name
                                          : null}
                                      </Typography>
                                      {typeof row.name === "undefined" ? (
                                        <Skeleton
                                          style={{
                                            width: "50%",
                                            display: "inline-block",
                                          }}
                                        />
                                      ) : null}
                                    </Fragment>
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
                                        <ColorPriceSpan
                                          nowPrice={parseFloat(row.nowPrice)}
                                          past={parseFloat(row.past)}
                                        >
                                          <PriceDiff
                                            nowPrice={parseFloat(
                                              row.nowPrice
                                            )}
                                            past={parseFloat(row.past)}
                                            priceDiffPercentSetting={
                                              priceDiffPercentSetting
                                            }
                                          />
                                        </ColorPriceSpan>
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
                                        id={`equal_${index}`}
                                        name={`equal_${index}`}
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
                                        id={`price_${index}`}
                                        name={`price_${index}`}
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
                                      label=""
                                      className="marginLeftn11"
                                    />
                                  </Grid>
                                </Hidden>
                              </Grid>
                            </Box>
                            {index === stockNotify.length - 1 ? null : (
                              <Divider />
                            )}
                          </section>
                        </Fade>
                      ))}
                  </Collapse>
                ) : (
                  <Fragment>
                    <Box
                      textAlign="center"
                      alignItems="center"
                      padding={2}
                      className={boxClassWithoutPointer}
                    >
                      {loading === true ? (
                        <CircularProgress />
                      ) : (
                        <Typography color="textSecondary" align="center">
                          {login.email === ""
                            ? "Please login first"
                            : "None of record"}
                        </Typography>
                      )}
                    </Box>
                  </Fragment>
                )}
                {stockNotify.length < 10 &&
                  edit === true &&
                  !props.hideAlert ? (
                  <Fragment>
                    <Divider />
                    <Box
                      textAlign="center"
                      alignItems="center"
                      padding={2}
                      className={boxClassWithoutPointer}
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
          {/* following box is close of <Box paddingX={1} paddingY={3} overflow="auto" position="relative"> */}
        </Box>
        {/*bottom*/}
        <footer>
          <Box
            position="relative"
            paddingX={2}
            width="100%"
            minHeight="200px"
            color="background.paper"
            display="flex"
            alignItems="flex-end"
            justifyContent="center"
          >
            <Grid container alignItems="center">
              <Hidden only={["xs", "sm"]}>
                <Grid item sm={false} md={2} className="margin1"></Grid>
              </Hidden>

              <Grid item xs={12} sm={12} md={8} className="margin1">
                <Box padding={1}>
                  <Grid container alignItems="center">
                    <Grid item xs={12} sm={12} md={4}>
                      <Hidden only={["xs", "sm"]}>
                        <Typography align="left" variant="h6">
                          make by{" "}
                          <Link href="mailto:rockie2695@gmail.com">
                            rockie2695@gmail.com
                          </Link>
                        </Typography>
                      </Hidden>
                      <Hidden mdUp>
                        <Typography align="center" variant="h6">
                          make by{" "}
                          <Link href="mailto:rockie2695@gmail.com">
                            rockie2695@gmail.com
                          </Link>
                        </Typography>
                      </Hidden>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={4}
                      style={{ textAlign: "center" }}
                    >
                      <QRCode
                        value={url}
                        imageSettings={{
                          src: "../logo192.png",
                          height: 30,
                          width: 30,
                        }}
                      />
                      {/*window.location.href*/}
                    </Grid>
                    <Grid item xs={12} sm={12} md={4}>
                      <Hidden only={["xs", "sm"]}>
                        {deferredPrompt !== null ? (
                          <Box textAlign="right">
                            <Fab
                              color="primary"
                              aria-label="pwa"
                              onClick={showA2HS}
                              className={webAppIconClass}
                            >
                              <GetAppIcon />
                            </Fab>
                            <Typography variant="h6">Web App</Typography>
                          </Box>
                        ) : null}
                      </Hidden>
                      <Hidden mdUp>
                        {deferredPrompt !== null ? (
                          <Box textAlign="center">
                            <Fab
                              color="primary"
                              aria-label="pwa"
                              onClick={showA2HS}
                              className={webAppIconClass}
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
              </Grid>

              <Hidden only={["xs", "sm"]}>
                <Grid item sm={false} md={2} className="margin1"></Grid>
              </Hidden>
            </Grid>
            {!edit && props.hideAlert && login.email !== "" ? (
              <Fab
                color="primary"
                aria-label="add"
                style={{
                  position: "fixed",
                  bottom: 16,
                  left: "calc(100vw - 85px)",
                }}
                onClick={fun_addStockDialog}
              >
                <AddIcon />
              </Fab>
            ) : null}
          </Box>
        </footer>
        {/* following box is close of  <Box bgcolor="text.disabled" style={{ height: '100vh' }}>*/}
      </Box>

      {/*show Dialog box after click each stock */}
      <Suspense fallback={renderLoader()}>
        <DialogBox
          closeDialog={closeDialog}
          open={open}
          fullScreen={props.fullScreen || fullScreenSetting}
          dialogIndex={dialogIndex}
          stockNotify={stockNotify}
          selectHistory={selectHistory}
          login={login}
          changeAlertSwitch={changeAlertSwitch}
          hideAlert={props.hideAlert}
          edit={edit}
          sendingForm={sendingForm}
          fun_edit={fun_edit}
          fun_save={fun_save}
          changeAlertInfo={changeAlertInfo}
          isDarkMode={props.isDarkMode}
          priceDiffPercentSetting={priceDiffPercentSetting}
          clickAvatar={clickAvatar}
        />
      </Suspense>
      <Dialog
        aria-labelledby="dialog-title"
        open={addStockDialog}
        fullScreen={props.fullScreen}
        maxWidth={"md"}
        fullWidth={true}
        onClose={fun_addStockDialog}
      >
        <DialogTitle id="dialog-title" onClose={fun_addStockDialog}>
          Add
        </DialogTitle>
        <DialogContent dividers style={{ padding: "16px" }}>
          {addStockDialog ? (
            <Fragment>
              <TextField
                type="number"
                style={{ minWidth: "85px" }}
                id={`stock_${dialogIndex}`}
                name={`stock_${dialogIndex}`}
                label="stock"
                variant="outlined"
                value={stockNotifyRef.current[dialogIndex].stock}
                margin="dense"
                autoComplete="off"
                onChange={changeAlertInfo}
                onBlur={loseFocusAlertInfo}
                disabled={sendingForm}
                fullWidth={true}
              />
              <TextField
                id={`equal_${dialogIndex}`}
                name={`equal_${dialogIndex}`}
                select
                label="equal"
                variant="outlined"
                margin="dense"
                value={stockNotifyRef.current[dialogIndex].equal}
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
              <TextField
                id={`price_${dialogIndex}`}
                name={`price_${dialogIndex}`}
                label="price"
                variant="outlined"
                value={stockNotify[dialogIndex].price}
                margin="dense"
                autoComplete="off"
                disabled={sendingForm}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                style={{ minWidth: "90px" }}
                onChange={changeAlertInfo}
                type="number"
                fullWidth={true}
              />
              <div style={{ textAlign: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={stockNotify[dialogIndex].alert}
                      onChange={() =>
                        changeAlertSwitch(
                          dialogIndex,
                          stockNotify[dialogIndex]._id,
                          stockNotify[dialogIndex].alert
                        )
                      }
                      name="alertCheck"
                      color="primary"
                      disabled={!edit || sendingForm}
                    />
                  }
                  label="Enable Switch"
                />
              </div>
            </Fragment>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={fun_save}>
            <SaveIcon />
            Save
          </Button>
          <Button autoFocus color="primary" onClick={fun_addStockDialog}>
            <CloseIcon />
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};
export default withRouter(FrontPage);
