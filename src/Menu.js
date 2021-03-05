//@flow
import * as React from "react";
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
import { testlink, url, clientId } from "./common";

type Props = {
  darkModeSetting: boolean,
  changeDarkModeSetting: () => void,
  sendingForm: boolean,
  fun_login: () => void,
  fun_logout: () => void,
  login: { email?: string },
};

const Menu = (props: Props): React.Node => {
  return (
    <AppBar color="default" position="sticky" top={0}>
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          <Link href={url} color="inherit">
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
            clientId={clientId}
            buttonText="Login"
            onSuccess={props.fun_login}
            onFailure={props.fun_login}
            cookiePolicy={"single_host_origin"}
            isSignedIn={true}
          />
        ) : (
          <GoogleLogout
            clientId={clientId}
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
