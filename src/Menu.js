import React from "react";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import LinearProgress from "@material-ui/core/LinearProgress";
import { GoogleLogin, GoogleLogout } from "react-google-login";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Brightness2Icon from "@material-ui/icons/Brightness2";
import IconButton from "@material-ui/core/IconButton";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import "./App.css";

let testlink = false;
if (
  window.location.host === "localhost:3000" ||
  window.location.host === "localhost:5000"
) {
  testlink = true;
}

const Menu = (props) => {
  /*
  function ElevationScroll(props) {
    const { children } = props;
    const trigger = useScrollTrigger();
    return React.cloneElement(children, {
      elevation: trigger ? 4 : 1,
    });
  }
*/
  return (
    <AppBar color="default" position="sticky" top={0}>
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          <Link
            href="https://rockie-stockalertclient.herokuapp.com/"
            color="inherit"
          >
            Stock Alert
          </Link>
        </Typography>
        <IconButton
          aria-label="moon icon"
          color="inherit"
          onClick={props.changeDarkModeSetting}
          style={{ margin: "5px" }}
        >
          {props.darkModeSetting ? <Brightness7Icon /> : <Brightness2Icon />}
        </IconButton>
        {testlink ? null : props.login.email === "" ? (
          <GoogleLogin
            clientId={props.clientId}
            buttonText="Login"
            onSuccess={props.fun_login}
            onFailure={props.fun_login}
            cookiePolicy={"single_host_origin"}
            isSignedIn={true}
          />
        ) : (
          <GoogleLogout
            clientId={props.clientId}
            buttonText="Logout"
            onLogoutSuccess={props.fun_logout}
          ></GoogleLogout>
        )}
      </Toolbar>
      {props.sendingForm ? <LinearProgress /> : null}
    </AppBar>
  );
};
export default Menu;
