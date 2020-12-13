import React, { useState, useEffect, Fragment } from "react";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import moment from "moment";
import CircularProgress from "@material-ui/core/CircularProgress";
import Divider from "@material-ui/core/Divider";
import Grid from "@material-ui/core/Grid";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Dialog from "@material-ui/core/Dialog";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Collapse from "@material-ui/core/Collapse";
import Fade from "@material-ui/core/Fade";
import TrendingUpIcon from "@material-ui/icons/TrendingUp";
import TimelineIcon from "@material-ui/icons/Timeline";
import ReceiptIcon from "@material-ui/icons/Receipt";

import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";
import MaterialTooltip from "@material-ui/core/Tooltip";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

let host = "https://rockie-stockAlertServer.herokuapp.com";
if (
  window.location.host === "localhost:3000" ||
  window.location.host === "localhost:5000"
) {
  host = "http://localhost:3001";
}

const green_color = green[500];
const red_color = red[500];

const DialogBox = (props) => {
  const [allDataHistory, setAllDataHistory] = useState([]);
  const [dailyDataHistory, setDailyDataHistory] = useState([]);
  const [newsHistory, setNewsHistory] = useState([]);
  const [loadingAllData, setLoadingAllData] = useState(false);
  const [loadingDailyData, setLoadingDailyData] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [areaChartSetting, setAreaChartSetting] = useState(false);
  const [marketValue, setMarketValue] = useState("");
  const [issuedShare, setIssuedShare] = useState("");
  const [vol, setVol] = useState("");
  const [tvr, setTvr] = useState("");

  useEffect(() => {
    if (
      props.open &&
      typeof props.stockNotify[props.dialogIndex] !== "undefined"
    ) {
      if (props.stockNotify[props.dialogIndex].marketValue !== "") {
        let sub_marketValue = props.stockNotify[props.dialogIndex].marketValue;
        setMarketValue(fun_appendFix(sub_marketValue));
      }
      if (props.stockNotify[props.dialogIndex].issuedShare !== "") {
        let sub_issuedShare = props.stockNotify[props.dialogIndex].issuedShare;
        setIssuedShare(fun_appendFix(sub_issuedShare));
      }
      if (props.stockNotify[props.dialogIndex].vol !== "") {
        let sub_vol = props.stockNotify[props.dialogIndex].vol;
        setVol(fun_appendFix(sub_vol));
      }
      if (props.stockNotify[props.dialogIndex].tvr !== "") {
        let sub_tvr = props.stockNotify[props.dialogIndex].tvr;
        setTvr(fun_appendFix(sub_tvr));
      }
    } else {
      setTimeout(() => {
        setAllDataHistory([]);
        setDailyDataHistory([]);
        setNewsHistory([]);
        setMarketValue("");
        setIssuedShare("");
        setVol("");
        setTvr("");
      }, 100);
    }
    return () => {
      setAllDataHistory([]);
      setDailyDataHistory([]);
      setNewsHistory([]);
      setMarketValue("");
      setIssuedShare("");
      setVol("");
      setTvr("");
    };
  }, [props.open, props.dialogIndex, props.stockNotify]);
  const fun_appendFix = (value) => {
    if (value > 100000000) {
      value = Math.round((value / 100000000) * 100) / 100 + "億";
    } else if (value > 10000) {
      value = Math.round((value / 10000) * 100) / 100 + "萬";
    }
    return value;
  };
  const CustomToolTip = (props) => {
    const { active, payload, label, labelFormatter } = props;
    if (!active || !payload) {
      return null;
    }
    const tooltip = {
      backgroundColor: "white",
      opacity: "0.9",
      border: "1px solid black",
      borderRadius: "15px",
      paddingLeft: "10px",
      paddingRight: "10px",
    };

    return (
      <div>
        <div className="custom-tooltip" style={tooltip}>
          <p style={{ textAlign: "center", color: "black" }}>
            <strong>
              {typeof labelFormatter !== "undefined"
                ? labelFormatter(label)
                : label}
            </strong>
          </p>
          {payload.map((item, i, payload) => {
            return (
              <div key={i}>
                <p style={{ color: item.color }} key={i}>
                  {item.name}: <strong>{item.value}</strong>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
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
  const fun_news = (stock) => {
    setLoadingNews((prevState) => {
      return true;
    });
    fetch(host + "/find/stockNews/", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: props.login.email,
        stock: stock,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.hasOwnProperty("error")) {
          setNewsHistory(result);
        } else {
          alert(result.error);
        }
      })
      .finally(() => {
        setLoadingNews((prevState) => {
          return false;
        });
      });
  };
  const fun_close_news = () => {
    setNewsHistory([]);
  };
  const fun_dailyData = (stock) => {
    //get data from https://www.quandl.com/api/v3/datasets/HKEX/00001.json?api_key=xCJuSM5DeG9s9PtmNbFg
    setLoadingDailyData((prevState) => {
      return true;
    });
    fetch(host + "/find/stockDailyPrice/", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: props.login.email,
        stock: stock,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.hasOwnProperty("error")) {
          let dailyData = result.dataset.data.reverse();
          let insertHistory = [];
          for (let i = 0; i < dailyData.length; i++) {
            insertHistory.push({
              stringDay: dailyData[i][0],
              price: dailyData[i][1],
            });
          }
          setDailyDataHistory((prevState) => {
            return insertHistory;
          });
        } else {
          alert(result.error);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoadingDailyData((prevState) => {
          return false;
        });
      });
  };
  const fun_close_dailyDataHistory = () => {
    setDailyDataHistory([]);
  };
  const fun_allData = (stock) => {
    //get all data from server
    setLoadingAllData((prevState) => {
      return true;
    });
    fetch(host + "/select/allStockPrice/", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: props.login.email,
        stock: stock,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.hasOwnProperty("error")) {
          let insertHistory = [];
          for (let i = 0; i < result.ok.length; i++) {
            let rowTime = new Date(result.ok[i].time).toLocaleString("en-US", {
              timeZone: "UTC",
            });
            result.ok[i].jsTime = new Date(rowTime).getTime();
            result.ok[i].time = result.ok[i].stringTime.split(" ")[1];
            insertHistory.push({
              stringTime: result.ok[i].stringTime,
              price: result.ok[i].price,
              jsTime: result.ok[i].jsTime,
              high: result.ok[i].high,
              low: result.ok[i].low,
            });
          }
          setAllDataHistory((prevState) => {
            return insertHistory;
          });
        } else {
          alert(result.error);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoadingAllData((prevState) => {
          return false;
        });
      });
  };
  const fun_close_allDataHistory = () => {
    setAllDataHistory([]);
  };
  const changeAreaChartSetting = () => {
    setAreaChartSetting((prevState) => !prevState);
  };
  const openLink = (linkUrl) => {
    window.open(linkUrl);
  };
  const gradientOffset = () => {
    const dataMax = Math.max(...props.selectHistory.map((i) => i.price));
    const dataMin = Math.min(...props.selectHistory.map((i) => i.price));
    const past = props.stockNotify[props.dialogIndex].past;
    if (props.dialogIndex > -1) {
      if (dataMax <= past) {
        return 0;
      } else if (dataMin >= past) {
        return 1;
      } else {
        return (
          Math.round(
            ((dataMax - past) / (dataMax - past - (dataMin - past))) * 1000
          ) / 1000
        );
      }
    } else {
      return 0;
    }
  };
  return (
    <Dialog
      onClose={props.closeDialog}
      aria-labelledby="dialog-title"
      open={props.open}
      fullScreen={props.fullScreen}
      maxWidth={"md"}
      fullWidth={true}
    >
      {props.open ? (
        <Fragment>
          <DialogTitle id="dialog-title" onClose={props.closeDialog}>
            Stock:&nbsp;
            {props.dialogIndex > -1
              ? props.stockNotify[props.dialogIndex].stock +
                (typeof props.stockNotify[props.dialogIndex].name !==
                "undefined"
                  ? " (" + props.stockNotify[props.dialogIndex].name + ")"
                  : "")
              : null}
          </DialogTitle>
          <DialogContent dividers style={{ padding: "16px" }}>
            {props.hideAlert && props.dialogIndex > -1 ? (
              <Box
                border={1}
                borderColor={"grey.300"}
                borderRadius={16}
                marginY={2}
              >
                <Box marginX={3} marginTop={2}>
                  <Typography align="right" className="margin2">
                    {props.edit === true ? (
                      <Fragment>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={props.fun_save}
                          disabled={props.sendingForm}
                        >
                          <Typography style={{ marginRight: 8 }}>
                            Save
                          </Typography>
                          {props.sendingForm ? (
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
                          onClick={props.fun_edit}
                          disabled={props.sendingForm}
                        >
                          <Typography>Cancel</Typography>
                          <CloseIcon />
                        </Button>
                      </Fragment>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={props.fun_edit}
                      >
                        <Typography style={{ marginRight: 8 }}>Edit</Typography>
                        <EditIcon />
                      </Button>
                    )}
                  </Typography>
                  <Box display="flex" alignItems="center" margin={2}>
                    <Grid container alignItems="center">
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={4} sm={4} md={4} className="margin1">
                          <Typography>now$ to alert$</Typography>
                        </Grid>
                        <Grid item xs={4} sm={4} md={4} className="margin1">
                          <Typography>Alert</Typography>
                        </Grid>
                        <Grid
                          item
                          xs={4}
                          sm={4}
                          md={4}
                          className="margin1"
                          style={{ textAlign: "center" }}
                        >
                          <Typography>Enable Switch</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                  <Divider />
                  <Box
                    className={props.isDarkMode ? "boxDark" : "box"}
                    display="flex"
                    alignItems="center"
                    padding={2}
                  >
                    <Grid container alignItems="center">
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={4} sm={4} md={4} className="margin1">
                          {props.edit ? (
                            <TextField
                              id={"equal_" + props.dialogIndex}
                              name={"equal_" + props.dialogIndex}
                              select
                              label="equal"
                              variant="outlined"
                              margin="dense"
                              value={props.stockNotify[props.dialogIndex].equal}
                              style={{ minWidth: "18px" }}
                              onChange={props.changeAlertInfo}
                              disabled={props.sendingForm}
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
                            <Typography>
                              {props.stockNotify[props.dialogIndex].equal}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={4} sm={4} md={4} className="margin1">
                          {props.edit ? (
                            <TextField
                              id={"price_" + props.dialogIndex}
                              name={"price_" + props.dialogIndex}
                              label="price"
                              variant="outlined"
                              value={props.stockNotify[props.dialogIndex].price}
                              margin="dense"
                              autoComplete="off"
                              disabled={props.sendingForm}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    $
                                  </InputAdornment>
                                ),
                              }}
                              style={{ minWidth: "90px" }}
                              onChange={props.changeAlertInfo}
                              type="number"
                            />
                          ) : (
                            <Typography>
                              ${props.stockNotify[props.dialogIndex].price}
                            </Typography>
                          )}
                        </Grid>
                        <Grid
                          item
                          xs={4}
                          sm={4}
                          md={4}
                          className="margin1"
                          style={{ textAlign: "center" }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={
                                  props.stockNotify[props.dialogIndex].alert
                                }
                                onChange={() =>
                                  props.changeAlertSwitch(
                                    props.dialogIndex,
                                    props.stockNotify[props.dialogIndex]._id,
                                    props.stockNotify[props.dialogIndex].alert
                                  )
                                }
                                name="alertCheck"
                                color="primary"
                                disabled={!props.edit || props.sendingForm}
                              />
                            }
                            label=""
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Box>
            ) : null}
            <Box
              border={1}
              borderColor={"grey.300"}
              borderRadius={16}
              marginY={2}
            >
              {props.selectHistory.length !== 0 ? (
                <Fragment>
                  <Box marginX={3} marginTop={2}>
                    <Typography align="center" variant="h6">
                      Today Graph
                    </Typography>

                    <Typography align="right" className="margin2">
                      <MaterialTooltip
                        title="Area is not sure"
                        aria-label="Area is not sure"
                        style={{ margin: 0 }}
                        placement="bottom"
                        arrow
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              checked={areaChartSetting}
                              onChange={changeAreaChartSetting}
                              name="Area Chart"
                              color="primary"
                            />
                          }
                          label="Area Chart"
                          style={{ margin: 0 }}
                        />
                      </MaterialTooltip>
                    </Typography>
                  </Box>
                  <Box marginRight={3}>
                    <ResponsiveContainer width="100%" height={400}>
                      {areaChartSetting ? (
                        <AreaChart
                          data={props.selectHistory}
                          margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="splitColor"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset={gradientOffset()}
                                stopColor={green_color}
                                stopOpacity={1}
                              />
                              <stop
                                offset={gradientOffset()}
                                stopColor={red_color}
                                stopOpacity={1}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                            dot={false}
                            fill="url(#splitColor)"
                          />
                          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                          <XAxis
                            dataKey="jsTime"
                            tickFormatter={(unixTime) =>
                              moment(unixTime).format("HH:mm")
                            }
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            interval={
                              props.selectHistory.length > 5
                                ? parseInt(props.selectHistory.length / 5)
                                : 1
                            }
                            tick={{
                              fill: props.isDarkMode ? "lightgray" : "gray",
                            }}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            tick={{
                              fill: props.isDarkMode ? "lightgray" : "gray",
                            }}
                          />
                          <Tooltip
                            content={
                              <CustomToolTip
                                labelFormatter={(unixTime) =>
                                  moment(unixTime).format("HH:mm")
                                }
                              />
                            }
                          />
                        </AreaChart>
                      ) : (
                        <LineChart
                          data={props.selectHistory}
                          margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                        >
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                            dot={false}
                          />
                          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                          <XAxis
                            dataKey="jsTime"
                            tickFormatter={(unixTime) =>
                              moment(unixTime).format("HH:mm")
                            }
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            interval={
                              props.selectHistory.length > 5
                                ? parseInt(props.selectHistory.length / 5)
                                : 1
                            }
                            tick={{
                              fill: props.isDarkMode ? "lightgray" : "gray",
                            }}
                          />
                          <YAxis
                            domain={["auto", "auto"]}
                            tick={{
                              fill: props.isDarkMode ? "lightgray" : "gray",
                            }}
                          />
                          <Tooltip
                            content={
                              <CustomToolTip
                                labelFormatter={(unixTime) =>
                                  moment(unixTime).format("HH:mm")
                                }
                              />
                            }
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </Box>
                </Fragment>
              ) : null}
              {props.dialogIndex > -1 ? (
                <Box marginX={3} marginBottom={2}>
                  <table className={props.isDarkMode ? "dialogDark" : "dialog"}>
                    <colgroup>
                      <col style={{ width: "32%" }} />
                      <col style={{ width: "32%" }} />
                      <col style={{ width: "32%" }} />
                      <col style={{ width: "6%" }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        <td>
                          <Typography>Price</Typography>
                        </td>
                        <td>
                          <Typography>現價</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].nowPrice}
                            <Fragment>
                              <span>{" ("}</span>
                              <span
                                style={
                                  parseFloat(
                                    props.stockNotify[props.dialogIndex]
                                      .nowPrice
                                  ) -
                                    parseFloat(
                                      props.stockNotify[props.dialogIndex].past
                                    ) >
                                  0
                                    ? { color: green_color }
                                    : parseFloat(
                                        props.stockNotify[props.dialogIndex]
                                          .nowPrice
                                      ) -
                                        parseFloat(
                                          props.stockNotify[props.dialogIndex]
                                            .past
                                        ) <
                                      0
                                    ? { color: red_color }
                                    : {}
                                }
                              >
                                {(parseFloat(
                                  props.stockNotify[props.dialogIndex].nowPrice
                                ) -
                                  parseFloat(
                                    props.stockNotify[props.dialogIndex].past
                                  ) >
                                0
                                  ? "+"
                                  : "") +
                                  (!props.priceDiffPercentSetting
                                    ? parseFloat(
                                        Math.round(
                                          (parseFloat(
                                            props.stockNotify[props.dialogIndex]
                                              .nowPrice
                                          ) -
                                            parseFloat(
                                              props.stockNotify[
                                                props.dialogIndex
                                              ].past
                                            ) +
                                            0.00001 *
                                              (parseFloat(
                                                props.stockNotify[
                                                  props.dialogIndex
                                                ].nowPrice
                                              ) -
                                                parseFloat(
                                                  props.stockNotify[
                                                    props.dialogIndex
                                                  ].past
                                                ) >
                                              0
                                                ? 1
                                                : -1)) *
                                            1000
                                        ) / 1000
                                      )
                                    : parseFloat(
                                        Math.round(
                                          ((parseFloat(
                                            props.stockNotify[props.dialogIndex]
                                              .nowPrice
                                          ) -
                                            parseFloat(
                                              props.stockNotify[
                                                props.dialogIndex
                                              ].past
                                            ) +
                                            0.00001 *
                                              (parseFloat(
                                                props.stockNotify[
                                                  props.dialogIndex
                                                ].nowPrice
                                              ) -
                                                parseFloat(
                                                  props.stockNotify[
                                                    props.dialogIndex
                                                  ].past
                                                ) >
                                              0
                                                ? 1
                                                : -1)) /
                                            props.stockNotify[props.dialogIndex]
                                              .past) *
                                            100000
                                        ) / 1000
                                      ) + "%")}
                              </span>
                              <span>{")"}</span>
                            </Fragment>
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Today Low - High</Typography>
                        </td>
                        <td>
                          <Typography>今日低高</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.selectHistory.length > 0
                              ? (typeof props.selectHistory[
                                  props.selectHistory.length - 1
                                ].low === "undefined" &&
                                props.selectHistory.length > 1
                                  ? props.selectHistory[
                                      props.selectHistory.length - 2
                                    ].low
                                  : props.selectHistory[
                                      props.selectHistory.length - 1
                                    ].low) +
                                " - " +
                                (typeof props.selectHistory[
                                  props.selectHistory.length - 1
                                ].high === "undefined" &&
                                props.selectHistory.length > 1
                                  ? props.selectHistory[
                                      props.selectHistory.length - 2
                                    ].high
                                  : props.selectHistory[
                                      props.selectHistory.length - 1
                                    ].high)
                              : null}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Last Update Time</Typography>
                        </td>
                        <td>
                          <Typography>最後更新時間</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].nowTime}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Past</Typography>
                        </td>
                        <td>
                          <Typography>前收市價</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].past}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Vol</Typography>
                        </td>
                        <td>
                          <Typography>成交量</Typography>
                        </td>
                        <td>
                          <Typography>{vol}</Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Tvr</Typography>
                        </td>
                        <td>
                          <Typography>成交金額</Typography>
                        </td>
                        <td>
                          <Typography>{tvr}</Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>TenDay Low - High</Typography>
                        </td>
                        <td>
                          <Typography>10日低高</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].tenDayLow}
                            {" - "}
                            {props.stockNotify[props.dialogIndex].tenDayHigh}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>TenDay Avg</Typography>
                        </td>
                        <td>
                          <Typography>10日平均價</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].tenDayAvg}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Month Low - High</Typography>
                        </td>
                        <td>
                          <Typography>1個月低高</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].monthLow}
                            {" - "}
                            {props.stockNotify[props.dialogIndex].monthHigh}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>TwentyDay Avg</Typography>
                        </td>
                        <td>
                          <Typography>20日平均價</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].twentyDayAvg}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Wk52 Low - High</Typography>
                        </td>
                        <td>
                          <Typography>52周低高</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].wk52Low}
                            {" - "}
                            {props.stockNotify[props.dialogIndex].wk52High}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>FiftyDay Avg</Typography>
                        </td>
                        <td>
                          <Typography>50日平均價</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].fiftyDayAvg}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>LotSize</Typography>
                        </td>
                        <td>
                          <Typography>每手股數</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].lotSize}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Eps</Typography>
                        </td>
                        <td>
                          <Typography>全年每股盈利(元)</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].eps}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Dividend</Typography>
                        </td>
                        <td>
                          <Typography>全年每股派息(元)</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].dividend}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Rsi10</Typography>
                        </td>
                        <td>
                          <Typography>10日RSI</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].rsi10}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Rsi14</Typography>
                        </td>
                        <td>
                          <Typography>14日RSI</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].rsi14}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Rsi20</Typography>
                        </td>
                        <td>
                          <Typography>20日RSI</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].rsi20}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Pe</Typography>
                        </td>
                        <td>
                          <Typography>市盈率(倍)</Typography>
                        </td>
                        <td>
                          <Typography>
                            {props.stockNotify[props.dialogIndex].pe}
                          </Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Market Value</Typography>
                        </td>
                        <td>
                          <Typography>市值</Typography>
                        </td>
                        <td>
                          <Typography>{marketValue}</Typography>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <Typography>Issued Share</Typography>
                        </td>
                        <td>
                          <Typography>發行股數</Typography>
                        </td>
                        <td>
                          <Typography>{issuedShare}</Typography>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Box>
              ) : null}
            </Box>

            {props.dialogIndex > -1 ? (
              <Fragment>
                <Box
                  border={1}
                  borderColor={"grey.300"}
                  borderRadius={16}
                  marginY={2}
                >
                  <Box textAlign="center" paddingY={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        allDataHistory.length > 0
                          ? fun_close_allDataHistory()
                          : fun_allData(
                              props.stockNotify[props.dialogIndex].stock
                            )
                      }
                    >
                      <Fragment>
                        <Typography>
                          {allDataHistory.length > 0
                            ? "Close Server Data"
                            : "Get Server Data"}
                        </Typography>
                        <TrendingUpIcon style={{ marginLeft: 8 }} />
                        {loadingAllData ? (
                          <CircularProgress
                            size={20}
                            style={{ color: "white", marginLeft: 8 }}
                          />
                        ) : null}
                        {allDataHistory.length > 0 ? (
                          <CloseIcon style={{ marginLeft: 8 }} />
                        ) : null}
                      </Fragment>
                    </Button>
                  </Box>
                  <Box marginRight={3}>
                    <Collapse in={allDataHistory.length > 0} timeout={1000}>
                      <Fade in={allDataHistory.length > 0} timeout={1000}>
                        <div>
                          {allDataHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                              <LineChart
                                data={allDataHistory}
                                margin={{
                                  top: 10,
                                  right: 10,
                                  bottom: 10,
                                  left: 0,
                                }}
                              >
                                <Line
                                  type="monotone"
                                  dataKey="price"
                                  stroke="#8884d8"
                                  activeDot={{ r: 8 }}
                                  dot={false}
                                />
                                <CartesianGrid
                                  stroke="#ccc"
                                  strokeDasharray="5 5"
                                />
                                <XAxis
                                  dataKey="stringTime"
                                  type="category"
                                  domain={["auto", "auto"]}
                                  tick={{
                                    fill: props.isDarkMode
                                      ? "lightgray"
                                      : "gray",
                                  }}
                                />
                                <YAxis
                                  domain={["auto", "auto"]}
                                  tick={{
                                    fill: props.isDarkMode
                                      ? "lightgray"
                                      : "gray",
                                  }}
                                />
                                <Tooltip content={<CustomToolTip />} />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : null}
                        </div>
                      </Fade>
                    </Collapse>
                  </Box>
                </Box>

                <Box
                  border={1}
                  borderColor={"grey.300"}
                  borderRadius={16}
                  marginY={2}
                >
                  <Box textAlign="center" paddingY={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        dailyDataHistory.length > 0
                          ? fun_close_dailyDataHistory()
                          : fun_dailyData(
                              props.stockNotify[props.dialogIndex].stock
                            )
                      }
                    >
                      <Fragment>
                        <Typography>
                          {dailyDataHistory.length > 0
                            ? "Close Daily Data"
                            : "Get Daily Data"}
                        </Typography>
                        <TimelineIcon style={{ marginLeft: 8 }} />
                        {loadingDailyData ? (
                          <CircularProgress
                            size={20}
                            style={{ color: "white", marginLeft: 8 }}
                          />
                        ) : null}
                        {dailyDataHistory.length > 0 ? (
                          <CloseIcon style={{ marginLeft: 8 }} />
                        ) : null}
                      </Fragment>
                    </Button>
                  </Box>
                  <Box marginRight={3}>
                    <Collapse in={dailyDataHistory.length > 0} timeout={1000}>
                      <Fade in={dailyDataHistory.length > 0} timeout={1000}>
                        <div>
                          {dailyDataHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                              <LineChart
                                data={dailyDataHistory}
                                margin={{
                                  top: 10,
                                  right: 10,
                                  bottom: 10,
                                  left: 0,
                                }}
                              >
                                <Line
                                  type="monotone"
                                  dataKey="price"
                                  stroke="#8884d8"
                                  activeDot={{ r: 8 }}
                                  dot={false}
                                />
                                <CartesianGrid
                                  stroke="#ccc"
                                  strokeDasharray="5 5"
                                />
                                <XAxis
                                  dataKey="stringDay"
                                  type="category"
                                  domain={["auto", "auto"]}
                                  tick={{
                                    fill: props.isDarkMode
                                      ? "lightgray"
                                      : "gray",
                                  }}
                                />
                                <YAxis
                                  domain={["auto", "auto"]}
                                  tick={{
                                    fill: props.isDarkMode
                                      ? "lightgray"
                                      : "gray",
                                  }}
                                />
                                <Tooltip content={<CustomToolTip />} />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : null}
                        </div>
                      </Fade>
                    </Collapse>
                  </Box>
                </Box>

                <Box
                  border={1}
                  borderColor={"grey.300"}
                  borderRadius={16}
                  marginY={2}
                >
                  <Box textAlign="center" paddingY={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        newsHistory.length > 0
                          ? fun_close_news()
                          : fun_news(props.stockNotify[props.dialogIndex].stock)
                      }
                    >
                      <Fragment>
                        <Typography>
                          {newsHistory.length > 0 ? "Close News" : "Get News"}
                        </Typography>
                        <ReceiptIcon style={{ marginLeft: 8 }} />
                        {loadingNews ? (
                          <CircularProgress
                            size={20}
                            style={{ color: "white", marginLeft: 8 }}
                          />
                        ) : null}
                        {newsHistory.length > 0 ? (
                          <CloseIcon style={{ marginLeft: 8 }} />
                        ) : null}
                      </Fragment>
                    </Button>
                  </Box>
                  <Box
                    marginX={3}
                    marginBottom={newsHistory.length > 0 ? 3 : 0}
                  >
                    {newsHistory.map((row, index) => (
                      <Fade
                        in={true}
                        timeout={1000}
                        style={{
                          transitionDelay: index * 250 + "ms",
                        }}
                        key={index}
                      >
                        <Card key={index}>
                          <CardActionArea onClick={() => openLink(row.link)}>
                            <CardMedia
                              component="img"
                              image={
                                typeof row.photo !== "undefined"
                                  ? "data:image/png;base64, " + row.photo
                                  : ""
                              }
                              title={row.title}
                            />

                            <CardContent
                              style={
                                typeof row.photo !== "undefined"
                                  ? {
                                      position: props.fullScreen
                                        ? "block"
                                        : "absolute",
                                      background: "white",
                                      bottom: 0,
                                      backdropFilter: "blur(5px)",
                                      backgroundColor:
                                        "rgba(255, 255, 255, 0.65)",
                                      width: "100%",
                                    }
                                  : ""
                              }
                            >
                              <Typography
                                gutterBottom
                                variant="h5"
                                component="h2"
                              >
                                {row.title}
                              </Typography>
                              <Typography variant="subtitle2" component="p">
                                {row.pubDate}
                              </Typography>
                              <Typography variant="body2" component="p">
                                {row.content}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Fade>
                    ))}
                  </Box>
                </Box>
              </Fragment>
            ) : null}
          </DialogContent>
        </Fragment>
      ) : null}
      <DialogActions>
        <Button
          onClick={() => props.clickAvatar(props.dialogIndex)}
          color="primary"
        >
          Delete
        </Button>
        <Button autoFocus onClick={props.closeDialog} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default DialogBox;
