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
if (
  window.location.host === "localhost:3000" ||
  window.location.host === "localhost:5000"
) {
  host = "http://localhost:3001";
}

const DialogBox = (props) => {
  const [allDataHistory, setAllDataHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.open) {
    } else {
      setTimeout(() => {
        setAllDataHistory([]);
      }, 100);
    }
  }, [props.open]);

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

  const fun_allData = (stock) => {
    //get all data from server
    setLoading((prevState) => {
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
        setLoading((prevState) => {
          return false;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
      <DialogContent dividers style={{ padding: "16px" }}>
        {props.hideAlert && props.dialogIndex > -1 ? (
          <Fragment>
            <Typography align="right" className="margin2">
              {props.edit === true ? (
                <Fragment>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={props.fun_save}
                    disabled={props.sendingForm}
                  >
                    <Typography style={{ marginRight: 8 }}>Save</Typography>
                    {props.sendingForm ? (
                      <CircularProgress size={20} style={{ color: "white" }} />
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
                    <Typography>Alert</Typography>
                  </Grid>
                  <Grid item xs={4} sm={4} md={4} className="margin1">
                    <Typography>now$ to alert$</Typography>
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
            <Box className="box" display="flex" alignItems="center" padding={2}>
              <Grid container alignItems="center">
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={4} sm={4} md={4} className="margin1">
                    <Typography>
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
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={4} md={4} className="margin1">
                    <Typography>
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
                    </Typography>
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
                          checked={props.stockNotify[props.dialogIndex].alert}
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
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Box>
            <Divider />
          </Fragment>
        ) : null}
        <Typography align="center" variant="h6">
          Today Graph
        </Typography>
        {props.selectHistory.length !== 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={props.selectHistory}
              margin={{ top: 10, right: 0, bottom: 10, left: 0 }}
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
                {loading ? (
                  <Fragment>
                    <Typography style={{ marginRight: 8 }}>
                      Get All Data
                    </Typography>
                    <CircularProgress size={20} style={{ color: "white" }} />
                  </Fragment>
                ) : (
                  <Typography>Get All Data</Typography>
                )}
              </Button>
            </Box>
          </Fragment>
        ) : null}
        {allDataHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={allDataHistory}
              margin={{ top: 10, right: 0, bottom: 10, left: 0 }}
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
