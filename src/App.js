import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SwipeableViews from 'react-swipeable-views';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { withTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Team from './Team';
import History from './History';
import Schedule from './Schedule';
import Player from './Player';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import Avatar from '@material-ui/core/Avatar';
import Cookies from 'universal-cookie';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Base64 } from 'js-base64';
import HttpsRedirect from 'react-https-redirect';
import { isMobile } from 'react-device-detect';
import Button from '@material-ui/core/Button';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import './App.css';
const cookies = new Cookies();
const clientId = "637550083168-0aqnadjb5ealolonvioba828rki4dhlo.apps.googleusercontent.com"
var host = 'https://teamplayser.herokuapp.com'

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      <Box p={3}>{children}</Box>
    </Typography>

  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    width: '100%',
  },
}));

class App extends Component {
  /*const classes = useStyles();
  const theme = useTheme();
  const[value, setValue] = React.useState(0);
*/
  constructor(props) {
    super(props);
    this.state = {
      value: 0,
      team: [],
      player: [],
      date: [],
      history: [],
      login: {},
      isDisconnected: false,
      isLoading: true,
      userMoney: 0,
      buyHistory: [],
      deferredPrompt: null
    }
  }
  showA2HS = (e) => {
    console.log('call this medhod showA2HS')
    let that = this
    // Show the prompt
    this.state.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.state.deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        that.setstate({ deferredPrompt: null })
      });
  }
  saveUserMoney = (money) => {
    this.setState({ userMoney: money })
  }
  addBuyHistory = (newBuyHistory) => {
    console.log('do addbuyHistory', newBuyHistory)
    let buyHistory = this.state.buyHistory
    buyHistory.push(newBuyHistory)
    this.setState({ buyHistory: buyHistory })
  }
  responseGoogle = (response) => {
    if (response.hasOwnProperty('tokenId')) {
      this.setState({ login: { id: response.tokenId, username: response.w3.ig, photo: response.w3.Paa, email: response.w3.U3 } })
      cookies.set('id', response.tokenId, { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host });
      this.getAccountInfo(response.w3.U3)
      this.changeHeight()
    }
  }
  logout = () => {
    this.setState({ login: {} })
    cookies.remove('id', { secure: true, sameSite: true, maxAge: 3600, domain: window.location.host })
    this.changeHeight()
  }
  handleChange = (event, newValue) => {
    this.setState({ value: newValue })
    this.changeTitle(newValue)
    this.changeHeight()
  }
  changeHeight = () => {
    setTimeout(() => {
      if (document.getElementsByClassName('react-swipeable-view-container').length > 0) {
        let element = document.getElementsByClassName('react-swipeable-view-container')[0].childNodes[this.state.value]
        document.getElementsByClassName("react-swipeable-view-container")[0].style.height = element.childNodes[0].offsetHeight + 'px'
      }
    }, 100);
  }
  handleChangeIndex = (index) => {
    this.setState({ value: index })
    this.changeTitle(index)
  }
  getAccountInfo(email) {
    fetch(host + '/getUser', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        season: this.state.date.length > 0 ? this.state.date[0].season : 2,
        isMobile: isMobile
      })
    })
      .then(res => res.json())
      .then((result) => {
        console.log(result)
        if (typeof result.ok !== 'undefined' && result.ok.length !== 0) {
          this.setState({ userMoney: result.ok[0].money, buyHistory: result.ok[0].history })
        } else {
          alert('can\'t access your account')
        }
      })
  }
  changeTitle(value = 0) {
    switch (value) {
      case 0:
        document.title = 'Team'
        break;
      case 1:
        document.title = 'Schedule'
        break;
      case 2:
        document.title = 'Player'
        break;
      case 3:
        document.title = 'History'
        break;
      default:
        document.title = 'TeamPlay'
    }
  }
  handleConnectionChange = () => {
    const condition = navigator.onLine ? 'online' : 'offline';
    if (condition === 'online') {
      this.webAccess()
      this.setState({ isDisconnected: false });
    } else {
      this.localAccess()
      this.setState({ isDisconnected: true });
    }
  }
  componentDidMount() {
    if (window.location.protocol === 'http:' && window.location.host !== 'localhost:3000' && window.location.host !== 'localhost:5000') {
      //window.location.href = "https://" + window.location.host;
      //return
    } else {
      this.handleConnectionChange();
      window.addEventListener('online', this.handleConnectionChange);
      window.addEventListener('offline', this.handleConnectionChange);


      window.addEventListener('beforeinstallprompt', (e) => {
        // Stash the event so it can be triggered later.
        console.log('beforeinstallprompt', e)
        this.setState({ deferredPrompt: e })
      });
    }
  }
  componentWillUnmount() {
    window.removeEventListener('online', this.handleConnectionChange);
    window.removeEventListener('offline', this.handleConnectionChange);
  }
  localAccess() {//offline
    console.log('get data from local storage')
    if (!window.localStorage) {
      alert('not support local storage');
    } else {
      if (window.localStorage.getItem('teamplay') !== null) {
        let result = JSON.parse(Base64.decode(window.localStorage.getItem('teamplay')))
        this.setState({
          team: [...result.team],
          date: [...result.date],
          player: [...result.player],
          history: [...result.history],
          isLoading: false
        })
        this.changeHeight()
      } else {
        this.setState({ isLoading: false })
        alert('network error')
      }
    }
  }
  webAccess() {
    if (window.location.host === 'localhost:3000' || window.location.host === 'localhost:5000') {
      host = 'http://localhost:8080'
    }
    this.changeTitle()
    fetch(host + '/select/' + isMobile, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then((result) => {
        window.localStorage.setItem('teamplay', Base64.encode(JSON.stringify(result)))
        this.setState({
          team: [...result.team],
          date: [...result.date],
          player: [...result.player],
          history: [...result.history]
        })
        if (typeof cookies.get('id') !== 'undefined' && cookies.get('id') !== '') {
          fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + cookies.get('id'), {
            method: 'get',
            headers: { 'Content-Type': 'application/json' }
          })
            .then(res => res.json())
            .then((result) => {
              if (result.hasOwnProperty('aud') && result.hasOwnProperty('azp') && result.aud === clientId && result.azp === clientId) {
                this.setState({ login: { id: cookies.get('id'), username: result.name, photo: result.picture, email: result.email } })
                this.getAccountInfo(result.email)
              } else if (result.hasOwnProperty('error_description')) {
                cookies.remove('id')
              }
            }).catch((err) => {
              console.log(err)
            })
        }
        this.changeHeight()
        this.setState({ isLoading: false })
      }).catch((err) => {
        console.log(err)
        this.localAccess()
      })
  }
  render() {
    return (
      <HttpsRedirect>
        <Toolbar style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            TeamPlay
            </Typography>
          {/*<Button color="inherit">Login-></Button>*/}
          {(Object.getOwnPropertyNames(this.state.login).length > 0)
            ?
            <div>
              <span>$</span><span>{this.state.userMoney} </span>
              <img src={this.state.login.photo} alt="username_photo" style={{ verticalAlign: 'middle', borderRadius: '50%', width: '32px', height: '32px' }} />
              &nbsp;
            </div>
            :
            null
          }
          {(Object.getOwnPropertyNames(this.state.login).length > 0)
            ?
            <GoogleLogout
              clientId={clientId}
              buttonText="Logout"
              onLogoutSuccess={this.logout}
            ></GoogleLogout>
            :
            <GoogleLogin
              clientId={clientId}
              buttonText="Login"
              onSuccess={this.responseGoogle}
              onFailure={this.responseGoogle}
              cookiePolicy={'single_host_origin'}
            />
          }
        </Toolbar>
        <AppBar position="sticky" style={{ top: 0, boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 0px 0px rgba(0,0,0,0.12)' }} color="default">
          <Tabs
            value={this.state.value}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Team" />
            <Tab label="Schedule" />
            <Tab label="Player" />
            <Tab label="History" />
          </Tabs>
        </AppBar>
        {this.state.isDisconnected ?
          <div style={{ textAlign: "center" }}><br />離線</div>
          :
          null
        }
        {this.state.isLoading
          ?
          <div style={{ textAlign: 'center' }}>
            <br /><br />
            <CircularProgress />
            <br /><br />
          </div>
          :
          <SwipeableViews
            //axis={/*this.theme.direction === 'rtl' ? 'x-reverse' :*/ 'x'}
            index={this.state.value}
            onChangeIndex={this.handleChangeIndex}
            disabled
          >
            <TabPanel value={0} index={0} style={{ overflow: 'auto hidden!important' }}>
              <Team team={this.state.team} date={this.state.date} changeHeight={this.changeHeight} index={this.state.value} />
            </TabPanel>
            <TabPanel value={1} index={1} >
              <Schedule date={this.state.date} changeHeight={this.changeHeight} team={this.state.team} history={this.state.history} index={this.state.value} login={this.state.login} buyHistory={this.state.buyHistory} userMoney={this.state.userMoney} saveUserMoney={this.saveUserMoney} addBuyHistory={this.addBuyHistory} />
            </TabPanel>
            <TabPanel value={2} index={2}>
              <Player player={this.state.player} history={this.state.history} changeHeight={this.changeHeight} index={this.state.value} />
            </TabPanel>
            <TabPanel value={3} index={3}>
              <History history={this.state.history} date={this.state.date} changeHeight={this.changeHeight} team={this.state.team} index={this.state.value} />
            </TabPanel>
          </SwipeableViews>
        }
        <div style={{ textAlign: 'center' }}>
          {/*(Object.getOwnPropertyNames(this.state.login).length > 0)
            ?
            <div style={{ verticalAlign: 'middle' }}>
              <span>Welcome</span> <img src={this.state.login.photo} alt="username_photo" style={{ verticalAlign: 'middle', borderRadius: '50%', width: '32px', height: '32px' }} /> <span>{this.state.login.username}</span>
              <span> , Money: </span><span>{this.state.userMoney}</span>
              <br /><br />
            </div>
            :
            null
          */}
          {/*(Object.getOwnPropertyNames(this.state.login).length > 0)
            ?
            <GoogleLogout
              clientId={clientId}
              buttonText="Logout"
              onLogoutSuccess={this.logout}
            ></GoogleLogout>
            :
            <GoogleLogin
              clientId={clientId}
              buttonText="Login"
              onSuccess={this.responseGoogle}
              onFailure={this.responseGoogle}
              cookiePolicy={'single_host_origin'}
            />
          */}
          {
            this.state.deferredPrompt === null
              ?
              null
              :
              <Button variant="outlined" onClick={this.showA2HS}>Download WebApp</Button>
          }

          <br /><br />
        </div>
      </HttpsRedirect>
    );
  }
}
export default withTheme(App);