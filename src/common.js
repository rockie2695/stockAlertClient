import styled, { css } from "styled-components";
import green from "@material-ui/core/colors/green";
import red from "@material-ui/core/colors/red";
import grey from "@material-ui/core/colors/grey";

const PriceDiff = (props) => {
  let returnValue = "";
  let diff = props.nowPrice - props.past;
  let diffPositive = diff > 0 ? 1 : -1;
  let timesMathRound = props.priceDiffPercentSetting ? 100000 : 1000;
  if (props.nowPrice - props.past > 0) {
    returnValue += "+";
  }
  if (!props.priceDiffPercentSetting) {
    returnValue += parseFloat(
      Math.round((diff + 0.0001 * diffPositive) * timesMathRound) / 1000
    );
  } else {
    returnValue += parseFloat(
      Math.round(
        ((diff + 0.0001 * diffPositive) / props.past) * timesMathRound
      ) / 1000
    );
    returnValue += "%";
  }
  return returnValue;
};

const ColorPriceSpan = styled.span`
  color: gray;
  ${(props) =>
    props.nowPrice - props.past > 0 &&
    css`
      color: ${green_color};
    `}
  ${(props) =>
    props.nowPrice - props.past < 0 &&
    css`
      color: ${red_color};
    `}
`;

const green_color = green[500];
const red_color = red[500];
const grey_color = grey[500];

let host = "https://rockie-stockAlertServer.herokuapp.com";
let host2 = "https://stock-alert-server2.herokuapp.com";
let testlink = false;
if (
  window.location.host === "localhost:3000" ||
  window.location.host === "localhost:5000"
) {
  host = "http://localhost:3001";
  testlink = true;
}
let url = "https://rockie-stockalertclient.herokuapp.com/";
if (window.location.host === "trusting-austin-bb7eb7.netlify.app") {
  url = "https://trusting-austin-bb7eb7.netlify.app/";
}
let clientId =
  "56496239522-mgnu8mmkmt1r8u9op32b0ik8n7b625pd.apps.googleusercontent.com";
if (window.location.host === "trusting-austin-bb7eb7.netlify.app") {
  clientId =
    "637550083168-0aqnadjb5ealolonvioba828rki4dhlo.apps.googleusercontent.com";
}
export {
  PriceDiff,
  ColorPriceSpan,
  green_color,
  red_color,
  grey_color,
  host,
  host2,
  testlink,
  url,
  clientId,
};
