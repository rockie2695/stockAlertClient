import React, { useState, useEffect, Fragment } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import moment from "moment";

import Dialog from "@material-ui/core/Dialog";
import "./App.css";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
let host = "https://rockie-stockAlertServer.herokuapp.com";
let testlink = false;
if (
  window.location.host === "localhost:3000" ||
  window.location.host === "localhost:5000"
) {
  host = "http://localhost:3001";
  testlink = true;
}

const DialogBox = (props) => {
  const [allDataHistory, setAllDataHistory] = useState([]);

  useEffect(() => {
    console.log("test", props.open);
    if (props.open) {
    } else {
      setAllDataHistory([]);
    }
  }, [props.open]);

  const useStyles = makeStyles((theme) => ({
    margin1: {
      "& > *": {
        margin: theme.spacing(1),
      },
    },
    margin2: {
      "& > *": {
        margin: theme.spacing(2),
      },
    },
    padding2: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
    marginRight12: {
      marginRight: "12px",
    },
  }));

  const classes = useStyles();

  const DialogTitle = withStyles(useStyles)((props) => {
    return (
      <MuiDialogTitle
        disableTypography
        className={classes.padding2}
        {...props.other}
      >
        <Typography variant="h6">{props.children}</Typography>
        {props.onClose ? (
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={props.onClose}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
  });

  const fun_allData = (stock) => {
    //get all data from server
    console.log(stock, props.login.email);
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
        console.log(result);

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
          });
        }
        setAllDataHistory((prevState) => {
          return insertHistory;
        });
      });
  };
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

  return (
    <Dialog
      fullWidth={true}
      onClose={props.closeDialog}
      aria-labelledby="dialog-title"
      open={props.open}
      fullScreen={props.fullScreen}
    >
      <DialogTitle id="dialog-title" onClose={props.closeDialog}>
        Stock:&nbsp;
        {props.dialogIndex > -1
          ? props.stockNotify[props.dialogIndex].stock +
            " (" +
            props.stockNotify[props.dialogIndex].name +
            ")"
          : null}
      </DialogTitle>
      <DialogContent dividers>
        {props.selectHistory.length !== 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={props.selectHistory}
              margin={{ top: 10, right: 25, bottom: 10, left: 0 }}
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
                tickFormatter={(unixTime) => moment(unixTime).format("HH:mm")}
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                interval={
                  props.selectHistory.length > 5
                    ? parseInt(props.selectHistory.length / 5)
                    : 1
                }
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(unixTime) => moment(unixTime).format("HH:mm")}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
        {props.dialogIndex > -1 ? (
          <Fragment>
            <table className="dialog">
              <colgroup>
                <col style={{ width: "32%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>
              <tbody>
                <tr>
                  <td>
                    <Typography>price</Typography>
                  </td>
                  <td>
                    <Typography>現價</Typography>
                  </td>
                  <td>
                    <Typography>
                      {props.stockNotify[props.dialogIndex].nowPrice}
                    </Typography>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Typography>past</Typography>
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
                    <Typography>tenDayLow</Typography>
                  </td>
                  <td>
                    <Typography>10日低</Typography>
                  </td>
                  <td>
                    <Typography>
                      {props.stockNotify[props.dialogIndex].tenDayLow}
                    </Typography>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Typography>tenDayHigh</Typography>
                  </td>
                  <td>
                    <Typography>10日高</Typography>
                  </td>
                  <td>
                    <Typography>
                      {props.stockNotify[props.dialogIndex].tenDayHigh}
                    </Typography>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Typography>tenDayAvg</Typography>
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
                    <Typography>monthLow</Typography>
                  </td>
                  <td>
                    <Typography>1個月低</Typography>
                  </td>
                  <td>
                    <Typography>
                      {props.stockNotify[props.dialogIndex].monthLow}
                    </Typography>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Typography>monthHigh</Typography>
                  </td>
                  <td>
                    <Typography>1個月高</Typography>
                  </td>
                  <td>
                    <Typography>
                      {props.stockNotify[props.dialogIndex].monthHigh}
                    </Typography>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Typography>twentyDayAvg</Typography>
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
                    <Typography>wk52Low</Typography>
                  </td>
                  <td>
                    <Typography>52周低</Typography>
                  </td>
                  <td>
                    <Typography>
                      {props.stockNotify[props.dialogIndex].wk52Low}
                    </Typography>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Typography>wk52High</Typography>
                  </td>
                  <td>
                    <Typography>52周高</Typography>
                  </td>
                  <td>
                    <Typography>
                      {props.stockNotify[props.dialogIndex].wk52High}
                    </Typography>
                  </td>
                </tr>

                <tr>
                  <td>
                    <Typography>fiftyDayAvg</Typography>
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
              </tbody>
            </table>
            <Box textAlign="center" marginTop={1}>
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  fun_allData(props.stockNotify[props.dialogIndex].stock)
                }
              >
                <Typography>Get All Data</Typography>
              </Button>
            </Box>
          </Fragment>
        ) : null}
        {allDataHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={allDataHistory}
              margin={{ top: 10, right: 25, bottom: 10, left: 0 }}
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
                dataKey="stringTime"
                type="category"
                domain={["auto", "auto"]}
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={props.closeDialog} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default DialogBox;
