import React, { useState, useEffect } from "react";
import HttpsRedirect from "react-https-redirect";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { BrowserRouter as Router } from "react-router-dom";
import { testlink } from "./common";
import FrontPage from "./FrontPage";

const App = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [darkModeSetting, setDarkModeSetting] = useState(
    localStorage.getItem("darkModeSetting") === null
      ? prefersDarkMode
      : localStorage.getItem("darkModeSetting") === "true"
  );

  useEffect(() => {
    if (localStorage.getItem("darkModeSetting") === null) {
      setDarkModeSetting(() => {
        return prefersDarkMode;
      });
    }
  }, [prefersDarkMode]);

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: darkModeSetting ? "dark" : "light",
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
    [darkModeSetting]
  );

  const isDarkMode = theme.palette.type === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const hideAlert = useMediaQuery(theme.breakpoints.down("xs"));

  return (
    <Router>
      <HttpsRedirect disabled={testlink ? true : false}>
        <ThemeProvider theme={theme}>
          <FrontPage
            hideAlert={hideAlert}
            fullScreen={fullScreen}
            isDarkMode={isDarkMode}
            darkModeSetting={darkModeSetting}
            setDarkModeSetting={setDarkModeSetting}
          />
        </ThemeProvider>
      </HttpsRedirect>
    </Router>
  );
};
export default App;
