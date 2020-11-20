const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

var bodyParser = require("body-parser");

//database connection
var MongoClient = require("mongodb").MongoClient;
var mongodb = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

var compression = require("compression");
var helmet = require("helmet");
var cors = require("cors");
var validator = require("email-validator");

// Use your own mlab account!!!
const mongourl =
  "mongodb+srv://rockie2695:26762714Rockie@cluster-test-cw81o.gcp.mongodb.net/test?retryWrites=true";
const mongoConectClient = new MongoClient(mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const fetch = require("node-fetch");
const test = false;

let nodemailer = require("nodemailer");
const { rejects } = require("assert");
let interval = null;
let time = {};

const dotenv = require("dotenv");
const webpush = require("web-push");

const imageToBase64 = require("image-to-base64");

dotenv.config();

webpush.setVapidDetails(
  process.env.WEB_PUSH_CONTACT,
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

mongoConectClient.connect((err) => {
  if (err) {
    console.log(err);
    res.send({ error: err });
  } else {
    if (interval === null) {
      deleteNoUse();
      startServer();
      console.log("start run");
    }
  }
});

app.use(helmet());
app.use(compression());
app.use(cors()); // Use this after the variable declaration
app.use(bodyParser.json());
/*app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});*/

//將 express 放進 http 中開啟 Server 的 3000 port ，正確開啟後會在 console 中印出訊息
const server = require("http")
  .Server(app)
  .listen(port, () => {
    console.log("open server!");
  });

//將啟動的 Server 送給 socket.io 處理
const io = require("socket.io")(server);

/*上方為此寫法的簡寫：
  const socket = require('socket.io')
  const io = socket(server)
*/

//監聽 Server 連線後的所有事件，並捕捉事件 socket 執行
io.on("connection", (socket) => {
  //經過連線後在 console 中印出訊息
  console.log("success connect!");
  /*
        //只回傳給發送訊息的 client
        socket.on('getMessage', message => {
            socket.emit('getMessage', message)
        })
    
        //回傳給所有連結著的 client
        socket.on('getMessageAll', message => {
            io.sockets.emit('getMessageAll', message)
        })
    
        //回傳給除了發送者外所有連結著的 client
        socket.on('getMessageLess', message => {
            socket.broadcast.emit('getMessageLess', message)
        })
    */
  socket.on("addRoom", (room) => {
    /*
        //加入前檢查是否已有所在房間
        const nowRoom = Object.keys(socket.rooms).find(room => {
            return room !== socket.id
        })
        //有的話要先離開
        if (nowRoom) {
            socket.leave(nowRoom)
        }
        */
    //再加入新的
    if (!io.sockets.adapter.rooms.hasOwnProperty(room)) {
      socket.join(room);
    }
  });

  socket.on("leaveRoom", (room) => {
    if (io.sockets.adapter.rooms.hasOwnProperty(room)) {
      socket.leave(room);
    }
  });

  //送出中斷申請時先觸發此事件
  socket.on("disConnection", (message) => {
    //再送訊息讓 Client 做 .close()
    socket.emit("disConnection", "");
  });

  //client中斷後觸發此監聽
  socket.on("disconnect", () => {
    console.log("disconnection");
  });
});
function checkEmail(email) {
  return validator.validate(email);
}
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
}
function deleteNoUse() {
  let [todayHour, todayMinute, todayDay, today] = getDayTime();
  let collection = mongoConectClient
    .db("rockie2695_mongodb")
    .collection("stockAlert_" + "stockPrice");
  today.setDate(today.getDate() - 8);
  collection.deleteMany({ time: { $lt: today } });
  let collection2 = mongoConectClient
    .db("rockie2695_mongodb")
    .collection("stockAlert_" + "eachStock");
  collection2.deleteMany({ people: { $lt: 1 } });
}
function startServer() {
  let stockPriceInsert = [];
  //open in 9:30-12:05,1:00-4:08
  interval = setInterval(
    function () {
      let [todayHour, todayMinute, todayDay, today, todaySecond] = getDayTime();
      if (test || (todayDay !== 6 && todayDay !== 0)) {
        if (
          test === false &&
          (todayHour < 9 ||
            (todayHour === 9 && todayMinute < 20) ||
            (todayHour >= 16 && todayMinute > 1) ||
            todayHour > 16)
        ) {
          //do nothing
        } else if (test === false && todayHour === 12 && todayMinute >= 07) {
          //do nothing
        } else {
          //get ajax
          let collection = mongoConectClient
            .db("rockie2695_mongodb")
            .collection("stockAlert_" + "eachStock");
          let findstock = new Promise(function (resolve, reject) {
            findRecord(collection, { people: { $gt: 0 } }, {}, function (
              err,
              result
            ) {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
          findstock
            .then(function (result) {
              let promises = [];
              //to get all stock
              //https://money18.on.cc/securityQuote/genStockJSONHKWithDelay.php?stockcode=1,10,8&t=20201910143020
              for (let i = 0; i < result.length; i++) {
                if (result[i].stock !== "") {
                  let url =
                    "https://money18.on.cc/js/real/hk/quote/" +
                    result[i].stock +
                    "_r.js?time=" +
                    todayHour +
                    todayMinute +
                    todaySecond;
                  let settings = { method: "Get", follow: 0 };
                  promises.push(
                    fetch(url, settings)
                      .then((res) => res.text())
                      .then((res) =>
                        res
                          .replace(/\r\n/g, "")
                          .replace(/\t/g, "")
                          .replace(/\'/g, '"')
                      )
                      .then((res) => res.substring(14))
                      .then((res) => res.substring(0, res.length - 1))
                      .then((res) => JSON.parse(res))
                      .then((res) => {
                        // do something with JSON
                        return { ...res, stock: result[i].stock };
                      })
                      .catch((err) => console.error(err))
                  );
                }
              }
              return new Promise(function (resolve, reject) {
                Promise.all(promises)
                  .then(function (result) {
                    resolve(result);
                  })
                  .catch(function (error) {
                    console.log(error);
                    reject(error);
                  });
              });
            })
            .then(function (result) {
              stockPriceInsert = [];
              for (let i = 0; i < result.length; i++) {
                let rowDate = new Date(result[i].ltt);
                if (
                  test ||
                  (rowDate.getDate() === today.getDate() &&
                    rowDate.getMonth() === today.getMonth() &&
                    rowDate.getFullYear() === today.getFullYear())
                ) {
                  if (
                    typeof time[result[i].stock] === "undefined" ||
                    (typeof time[result[i].stock] !== "undefined" &&
                      time[result[i].stock] !== result[i].ltt)
                  ) {
                    io.sockets.in(result[i].stock).emit("stockPrice", {
                      stock: result[i].stock,
                      price: parseFloat(result[i].np),
                      time: result[i].ltt,
                      high: parseFloat(result[i].dyh),
                      low: parseFloat(result[i].dyl),
                    });
                    stockPriceInsert.push({
                      stock: result[i].stock,
                      time: rowDate,
                      price: parseFloat(result[i].np),
                      stringTime: result[i].ltt,
                      high: parseFloat(result[i].dyh),
                      low: parseFloat(result[i].dyl),
                    });
                    time[result[i].stock] = result[i].ltt;
                  }
                }
              }
              if (stockPriceInsert.length !== 0) {
                var insert_stock = function (query) {
                  let collection = mongoConectClient
                    .db("rockie2695_mongodb")
                    .collection("stockAlert_" + "stockPrice");
                  return new Promise(function (resolve, reject) {
                    insertManyRecord(collection, query, function (err, result) {
                      if (err) {
                        console.log(err);
                        reject(err);
                      } else {
                        resolve(result);
                      }
                      return;
                    });
                  });
                };
                return insert_stock(stockPriceInsert);
              }
            })
            .then(function (result) {
              if (stockPriceInsert.length !== 0) {
                // get notification and subscription
                let promises = [];
                let collection = mongoConectClient
                  .db("rockie2695_mongodb")
                  .collection("stockAlert_" + "stockNotify");
                promises.push(
                  new Promise(function (resolve, reject) {
                    findRecord(collection, { alert: true }, {}, function (
                      err,
                      result
                    ) {
                      if (err) {
                        console.log(err);
                        reject(err);
                      } else {
                        resolve(result);
                      }
                    });
                  })
                );
                let collection2 = mongoConectClient
                  .db("rockie2695_mongodb")
                  .collection("stockAlert_" + "subscription");
                promises.push(
                  new Promise(function (resolve, reject) {
                    findRecord(collection2, {}, {}, function (err, result) {
                      if (err) {
                        console.log(err);
                        reject(err);
                      } else {
                        resolve(result);
                      }
                    });
                  })
                );
                return new Promise(function (resolve, reject) {
                  Promise.all(promises)
                    .then(function (result) {
                      resolve(result);
                    })
                    .catch(function (error) {
                      console.log(error);
                      reject(error);
                    });
                });
              }
            })
            .then(function (result) {
              let update_notify = function (query) {
                let collection = mongoConectClient
                  .db("rockie2695_mongodb")
                  .collection("stockAlert_" + "stockNotify");
                return new Promise(function (resolve, reject) {
                  updateRecordMulti(collection, query, function (err, result) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(result);
                    }
                    return;
                  });
                });
              };
              if (typeof result !== "undefined") {
                let stockNotifyArray = result[0];
                let alertSubscription = result[1];
                if (
                  stockPriceInsert.length !== 0 &&
                  typeof stockNotifyArray !== "undefined" &&
                  stockNotifyArray.length !== 0
                ) {
                  let query = [];
                  for (let i = 0; i < stockPriceInsert.length; i++) {
                    //find same stock in result
                    let j;
                    for (j = 0; j < stockNotifyArray.length; j++) {
                      if (
                        stockNotifyArray[j].stock === stockPriceInsert[i].stock
                      ) {
                        break;
                      }
                    }
                    if (
                      typeof j !== "undefined" &&
                      j != stockNotifyArray.length
                    ) {
                      let isNotify = false;
                      if (stockNotifyArray[j].equal === ">=") {
                        if (
                          parseFloat(stockPriceInsert[i].price) >=
                          parseFloat(stockNotifyArray[j].price)
                        ) {
                          isNotify = true;
                        }
                      } else if (stockNotifyArray[j].equal === "<=") {
                        if (
                          parseFloat(stockPriceInsert[i].price) <=
                          parseFloat(stockNotifyArray[j].price)
                        ) {
                          isNotify = true;
                        }
                      }
                      if (
                        isNotify === true &&
                        checkEmail(stockNotifyArray[j].email)
                      ) {
                        //send notification and email
                        var transporter = nodemailer.createTransport({
                          service: "Gmail",
                          auth: {
                            user: "rockie2695@gmail.com",
                            pass: "hgyjjddozhaomlzt",
                          },
                        });

                        var mailOptions = {
                          from: '"Stock Alert" <rockie2695@gmail.com>',
                          to: stockNotifyArray[j].email,
                          subject: "Notify stock price",
                          html:
                            "Stock <b>" +
                            stockNotifyArray[j].stock +
                            "</b>:<br /> Now Price " +
                            stockPriceInsert[i].price +
                            " " +
                            stockNotifyArray[j].equal +
                            " Alert Price " +
                            stockNotifyArray[j].price,
                        };
                        //update
                        let row = {
                          updateOne: {
                            filter: {
                              _id: ObjectId(stockNotifyArray[j]._id),
                            },
                            update: {
                              $set: {
                                alert: false,
                              },
                            },
                          },
                        };
                        query.push(row);
                        transporter.sendMail(mailOptions, function (
                          error,
                          info
                        ) {
                          if (error) {
                            console.log(error);
                          } else {
                            io.sockets
                              .in(stockNotifyArray[j].email)
                              .emit("changeAlert", {
                                stock: stockNotifyArray[j].stock,
                                _id: stockNotifyArray[j]._id,
                                alert: false,
                              });
                          }
                        });
                        const payload = JSON.stringify({
                          title: "Notify Stock Price",
                          body:
                            "Stock " +
                            stockNotifyArray[j].stock +
                            ": Now Price " +
                            stockPriceInsert[i].price +
                            " " +
                            stockNotifyArray[j].equal +
                            " Alert Price " +
                            stockNotifyArray[j].price,
                          icon:
                            "https://rockie-stockalertclient.herokuapp.com/logo512.png",
                          badge:
                            "https://rockie-stockalertclient.herokuapp.com/favicon-32x32.png",
                          url: "https://rockie-stockalertclient.herokuapp.com",
                        });
                        for (let i = 0; i < alertSubscription.length; i++) {
                          if (
                            alertSubscription[i].email ===
                            stockNotifyArray[j].email
                          ) {
                            webpush
                              .sendNotification(
                                alertSubscription[i].subscription,
                                payload
                              )
                              .catch((e) => {
                                console.log(e.stack);
                                unsubscription(
                                  alertSubscription[i].subscription,
                                  alertSubscription[i].email
                                );
                              });
                          }
                        }
                      }
                      /*if (
                        i + 1 === stockPriceInsert.length &&
                        query.length !== 0
                      ) {
                        return update_notify(query);
                      }*/
                    }
                    if (query.length !== 0) {
                      return update_notify(query);
                    }
                  }
                }
              }
            })
            .catch(function (error) {
              console.log(error);
            });
        }
      } else {
        clearInterval(interval);
        interval = null;
      }
      //60*1000 is 1 mins
    },
    test ? 5 * 1000 : 30 * 1000
  );
}

app.post("/notifications/subscribe", (req, res) => {
  const subscription = req.body.subscription;
  const email = req.body.email;
  console.log("subscription here", subscription);
  if (checkEmail(email)) {
    //update
    let collection = mongoConectClient
      .db("rockie2695_mongodb")
      .collection("stockAlert_" + "subscription");
    let whereCondition = {
      count: true,
      "subscription.endpoint": subscription.endpoint,
    };
    var find = new Promise(function (resolve, reject) {
      findRecord(collection, whereCondition, {}, function (result) {
        resolve(result);
      });
    });
    find
      .then(function (result) {
        if (result == 0) {
          //insert
          var insert_subscription = function (query) {
            return new Promise(function (resolve, reject) {
              insertManyRecord(collection, query, function (err, result) {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
                return;
              });
            });
          };
          return insert_subscription([
            {
              email: email,
              subscription: subscription,
            },
          ]);
        }
      })
      .then(function () {
        res.status(200).json({ success: true });
      })
      .catch(function (error) {
        console.log(error);
      });

    //delay is ok,close website and repeat is ok
    /*webpush
      .sendNotification(subscription, payload)
      .then((result) => console.log(result))
      .catch((e) => {
        console.log(e.stack);
        //unsubscription(subscription, email);
      }); */ //when user block ,error:WebPushError: Received unexpected response code
  } else {
    res.send({ error: "Email not validate" });
  }
});

function unsubscription(subscription, email) {
  let collection = mongoConectClient
    .db("rockie2695_mongodb")
    .collection("stockAlert_" + "subscription");
  collection.deleteMany({
    "subscription.endpoint": subscription.endpoint,
    email: email,
  });
}

app.post("/select/:TABLE", function (req, res) {
  let TABLE = req.params.TABLE;
  let EMAIL = req.body.email;
  let [todayHour, todayMinute, todayDay, today, todaySecond] = getDayTime();
  let whereCondition = {};
  if (checkEmail(EMAIL)) {
    if (TABLE === "stockNotify") {
      whereCondition = { email: EMAIL };
      let collection = mongoConectClient
        .db("rockie2695_mongodb")
        .collection("stockAlert_" + TABLE);
      var find = new Promise(function (resolve, reject) {
        findRecord(collection, whereCondition, {}, function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      find
        .then(function (result) {
          res.send({ ok: result });
        })
        .catch(function (error) {
          console.log(error);
          res.send({ error: error });
        });
    } else if (TABLE === "stockPrice") {
      let STOCK = req.body.stock;
      let onlyToday = new Date(today.toDateString());
      let onlyNextDay = new Date(today.toDateString());
      if (todayDay === 0) {
        //Sunday
        onlyToday = new Date(onlyToday.setDate(onlyToday.getDate() - 2));
        onlyNextDay = new Date(onlyNextDay.setDate(onlyNextDay.getDate() - 1));
      } else if (todayDay === 6) {
        //saturday
        onlyToday = new Date(onlyToday.setDate(onlyToday.getDate() - 1));
      } else {
        if (todayHour < 9) {
          onlyToday = new Date(onlyToday.setDate(onlyToday.getDate() - 1));
        } else {
          onlyNextDay = new Date(
            onlyNextDay.setDate(onlyNextDay.getDate() + 1)
          );
        }
      }
      onlyToday = new Date(onlyToday.setHours(8));
      onlyNextDay = new Date(onlyNextDay.setHours(8));
      let collection = mongoConectClient
        .db("rockie2695_mongodb")
        .collection("stockAlert_" + TABLE);
      var find = new Promise(function (resolve, reject) {
        findRecord(
          collection,
          { time: { $lt: onlyNextDay, $gte: onlyToday }, stock: STOCK },
          { projection: { _id: 0 } },
          function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
      find
        .then(function (result) {
          res.send({ ok: result });
        })
        .catch(function (error) {
          console.log(error);
          res.send({ error: error });
        });
    } else if (TABLE === "allStockPrice") {
      let STOCK = req.body.stock;
      let collection = mongoConectClient
        .db("rockie2695_mongodb")
        .collection("stockAlert_" + "stockPrice");
      var find = new Promise(function (resolve, reject) {
        findRecord(
          collection,
          { stock: STOCK },
          { projection: { _id: 0 } },
          function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
      find
        .then(function (result) {
          res.send({ ok: result });
        })
        .catch(function (error) {
          console.log(error);
          res.send({ error: error });
        });
    }
  } else {
    res.send({ error: "Email not validate" });
  }
});
app.post("/update/:TABLE/:singleItem", function (req, res) {
  let TABLE = req.params.TABLE;
  let EMAIL = req.body.email;
  let whereCondition = {};
  if (checkEmail(EMAIL)) {
    if (
      TABLE === "stockNotify" &&
      typeof req.params.singleItem !== "undefined" &&
      typeof req.body._id !== "undefined" &&
      typeof req.body.alert !== "undefined"
    ) {
      whereCondition = { email: EMAIL, _id: ObjectId(req.body._id) };
      let isAlert = req.body.alert;
      let collection = mongoConectClient
        .db("rockie2695_mongodb")
        .collection("stockAlert_" + TABLE);
      let query = [];
      let row = {
        updateOne: {
          filter: whereCondition,
          update: {
            $set: {
              alert: isAlert,
            },
          },
        },
      };
      query.push(row);
      let update_notify = new Promise(function (resolve, reject) {
        updateRecordMulti(collection, query, function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
          return;
        });
      });

      if (query.length !== 0) {
        update_notify
          .then(function (result) {
            res.send({ ok: result });
          })
          .catch(function (error) {
            console.log(error);
            res.send({ error: error });
          });
      } else {
        res.send({ error: "empty query" });
      }
    }
  }
});
app.post("/update/:TABLE", function (req, res) {
  let TABLE = req.params.TABLE;
  let EMAIL = req.body.email;
  if (checkEmail(EMAIL)) {
    if (
      TABLE === "stockNotify" &&
      typeof req.body.update !== "undefined" &&
      typeof req.body.insert !== "undefined"
    ) {
      let updateMessage = req.body.update;
      let insertMessage = req.body.insert;
      let query = [];
      let collection = mongoConectClient
        .db("rockie2695_mongodb")
        .collection("stockAlert_" + TABLE);
      if (updateMessage.length !== 0) {
        for (let i = 0; i < updateMessage.length; i++) {
          if (
            updateMessage[i].stock !== "" &&
            parseInt(updateMessage[i].stock) !== 0 &&
            updateMessage[i].price !== ""
          ) {
            let row = {
              updateOne: {
                filter: { email: EMAIL, _id: ObjectId(updateMessage[i]._id) },
                update: {
                  $set: {
                    stock: updateMessage[i].stock,
                    price: parseFloat(updateMessage[i].price),
                    equal: updateMessage[i].equal,
                    alert: updateMessage[i].alert,
                  },
                },
              },
            };
            query.push(row);
          }
        }
      }
      if (insertMessage.length !== 0) {
        for (let i = 0; i < insertMessage.length; i++) {
          if (
            insertMessage[i].stock !== "" &&
            parseInt(insertMessage[i].stock) !== 0 &&
            insertMessage[i].price !== ""
          ) {
            let row = {
              insertOne: {
                stock: insertMessage[i].stock,
                price: parseFloat(insertMessage[i].price),
                equal: insertMessage[i].equal,
                alert: insertMessage[i].alert,
                email: EMAIL,
              },
            };
            query.push(row);
          }
        }
      }
      let update_notify = new Promise(function (resolve, reject) {
        updateRecordMulti(collection, query, function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
          return;
        });
      });

      if (query.length !== 0) {
        update_notify
          .then(function (result) {
            let promises = [];
            for (let i = 0; i < updateMessage.length; i++) {
              if (
                updateMessage[i].oldStock !== updateMessage[i].stock &&
                updateMessage[i].stock !== "" &&
                parseInt(updateMessage[i].stock) !== 0 &&
                updateMessage[i].price !== ""
              ) {
                promises.push({
                  updateOne: {
                    filter: {
                      stock: updateMessage[i].oldStock,
                    },
                    update: {
                      $inc: {
                        people: -1,
                      },
                    },
                  },
                });
                promises.push({
                  updateOne: {
                    filter: {
                      stock: updateMessage[i].stock,
                    },
                    update: {
                      $inc: {
                        people: 1,
                      },
                    },
                    upsert: true,
                  },
                });
              }
            }
            for (let i = 0; i < insertMessage.length; i++) {
              if (
                insertMessage[i].stock !== "" &&
                parseInt(insertMessage[i].stock) !== 0 &&
                insertMessage[i].price !== ""
              ) {
                promises.push({
                  updateOne: {
                    filter: {
                      stock: insertMessage[i].stock,
                    },
                    update: {
                      $inc: {
                        people: 1,
                      },
                    },
                    upsert: true,
                  },
                });
              }
            }
            if (promises.length !== 0) {
              let collection = mongoConectClient
                .db("rockie2695_mongodb")
                .collection("stockAlert_" + "eachStock");
              return new Promise(function (resolve, reject) {
                updateRecordMulti(collection, promises, function (err, result) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(result);
                  }
                  return;
                });
              });
            }
          })
          .then(function (result) {
            let collection = mongoConectClient
              .db("rockie2695_mongodb")
              .collection("stockAlert_" + "stockNotify");
            let whereCondition = { email: EMAIL };
            return new Promise(function (resolve, reject) {
              findRecord(collection, whereCondition, {}, function (
                err,
                result
              ) {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              });
            });
          })
          .then(function (result) {
            res.send({ ok: result });
          })
          .catch(function (error) {
            console.log(error);
            res.send({ error: error });
          });
      } else {
        res.send({ error: "empty query" });
      }
    }
  }
});

app.post("/find/:THING", function (req, response) {
  let THING = req.params.THING;
  let EMAIL = req.body.email;
  let [todayHour, todayMinute, todayDay, today, todaySecond] = getDayTime();
  if (checkEmail(EMAIL)) {
    if (THING === "stockName") {
      let STOCK = req.body.stock;
      let promises = [];
      let settings = {
        method: "Get",
      };
      /*let url = "https://query2.finance.yahoo.com/v1/finance/quoteType/" + STOCK.substring(STOCK.length - 4, STOCK.length) + ".HK?lang=zh-Hant-HK&region=HK"
            
            promises.push(fetch(url, settings)
                .then(res => res.json())
                .then((res) => {
                    console.log(res)
                    // do something with JSON
                    return { ...res }
                })
                .catch(err => {
                    console.log(err)
                    rejects(err)
                })
            )*/

      /*let url2 = "http://money18.on.cc/js/daily/hk/quote/" + STOCK + "_d.js?time=" + todayHour + todayMinute + todaySecond;
            promises.push(fetch(url2, settings)
                .then(res => res.text())
                .then(res => res.replace(/\r\n/g, "").replace(/\t/g, "").replace(/\'/g, "\""))
                .then(res => res.substring(13))
                .then(res => JSON.parse(res))
                .then((res) => {
                    console.log(res)
                    // do something with JSON
                    return { ...res }
                })
                .catch(err => {
                    console.log(err)
                    rejects(err)
                })
            )*/

      let url =
        "http://realtime-money18-cdn.on.cc/securityQuote/genStockDetailHKJSON.php?stockcode=" +
        STOCK +
        "&time=" +
        todayHour +
        todayMinute +
        todaySecond;
      promises.push(
        fetch(url, settings)
          .then((res) => res.json())
          .then((res) => {
            //console.log(res)
            // do something with JSON
            return { ...res };
          })
          .catch((err) => {
            console.log(err);
            return rejects(err);
          })
      );

      Promise.all(promises)
        .then(function (result) {
          response.send({
            stock: STOCK,
            name: result[0].shortPut.Company,
            past: parseFloat(result[0].daily.preCPrice),
            nowPrice: parseFloat(result[0].real.np),
            nowTime: result[0].real.ltt,
            tenDayHigh: parseFloat(result[0].daily.tenDayHigh), //10日高
            tenDayLow: parseFloat(result[0].daily.tenDayLow), //10日低
            tenDayAvg: parseFloat(result[0].daily.ma10), //10日平均價
            monthLow: parseFloat(result[0].daily.mthLow), //1個月低
            monthHigh: parseFloat(result[0].daily.mthHigh), //1個月高
            twentyDayAvg: parseFloat(result[0].daily.ma20), //20日平均價
            wk52Low: parseFloat(result[0].daily.wk52Low), //52周低
            wk52High: parseFloat(result[0].daily.wk52High), //52周高
            fiftyDayAvg: parseFloat(result[0].daily.ma50), //50日平均價
            lotSize: parseInt(result[0].daily.lotSize), //每手股數
            eps: parseFloat(result[0].daily.eps), //全年每股盈利(元)
            dividend: parseFloat(result[0].daily.dividend), //全年每股派息(元)
            rsi10: parseFloat(result[0].daily.rsi10), //10日RSI
            rsi14: parseFloat(result[0].daily.rsi14), //14日RSI
            rsi20: parseFloat(result[0].daily.rsi20), //20日RSI
            pe: parseFloat(result[0].calculation.pe), //市盈率(倍)
            marketValue: parseFloat(result[0].calculation.marketValue), //市值
            issuedShare: parseFloat(result[0].daily.issuedShare), //發行股數
            vol: parseFloat(result[0].real.vol), //成交量
            tvr: parseFloat(result[0].real.tvr), //成交金額
          });
        })
        .catch((err) => {
          console.error(err);
          response.send({ error: err });
        });
    } else if (THING === "stockNews") {
      let STOCK = req.body.stock;
      let promises = [];
      let promises2 = []; //for photo
      let settings = {
        method: "Get",
      };
      let url =
        "https://money18.on.cc/cnt/utf8/stockList/HK/" +
        STOCK +
        "/" +
        STOCK +
        "_all.js?time=" +
        todayHour +
        todayMinute +
        todaySecond;
      promises.push(
        fetch(url, settings)
          .then((res) => res.json())
          .then((res) => {
            //console.log(res)
            // do something with JSON
            return res;
          })
          .catch((err) => {
            console.log(err);
            return rejects(err);
          })
      );
      let test1 = "";
      Promise.all(promises)
        .then(function (result) {
          let addArray = [];
          let breakloopCount = 10;
          if (Object.keys(result[0]).length < 10) {
            breakloopCount = Object.keys(result[0]).length;
          }
          for (let i = 0; i < breakloopCount; i++) {
            addArray.push(result[0][i]);
          }
          test1 = addArray;
          for (let i = 0; i < addArray.length; i++) {
            promises2.push(
              new Promise(function (resolve, reject) {
                if (addArray[i].thumbnail === "") {
                  resolve("");
                } else {
                  let rebuild_imgUrl_array = addArray[i].thumbnail.split("/");
                  let rebuild_imgUrl =
                    "https://hk.on.cc/hk/bkn/cnt/finance/" +
                    rebuild_imgUrl_array[3] +
                    "/photo//" +
                    rebuild_imgUrl_array[4];
                  imageToBase64(rebuild_imgUrl) // Image URL
                    .then((response) => {
                      //console.log(response); // "iVBORw0KGgoAAAANSwCAIA..."
                      return resolve(response);
                    })
                    .catch((error) => {
                      console.log(error); // Logs an error if there was one
                      return reject(err);
                    });
                }
              })
            );
          }
          return new Promise(function (resolve, reject) {
            Promise.all(promises2)
              .then(function (result) {
                resolve(result);
              })
              .catch((err) => {
                reject(err);
              });
          });
        })
        .then(function (result) {
          for (let i = 0; i < test1.length; i++) {
            test1[i].photo = result[i];
            if (test1[i]["link"] !== "") {
              test1[i]["link"] =
                "https://money18.on.cc/finnews/content/related_news/" +
                test1[i]["link"].split("/")[4];
            }
            if (test1[i]["content"] !== "") {
              test1[i]["content"] = test1[i]["content"].replace(
                "&lt;br/&gt;&lt;br/&gt;",
                ""
              );
              test1[i]["content"] = test1[i]["content"].replace(
                "&lt;br/&gt;&lt;br",
                ""
              );
              test1[i]["content"] = test1[i]["content"].replace(
                "&lt;br/&gt;&lt;b",
                ""
              );
              test1[i]["content"] = test1[i]["content"].replace("/&g", "");
            }
          }
          response.send(test1);
        })
        .catch((err) => {
          console.log(err);
          response.send({ error: err });
        });
    } else if (THING === "stockDailyPrice") {
      let STOCK = req.body.stock;
      let promises = [];
      let settings = {
        method: "Get",
      };
      let url =
        "https://www.quandl.com/api/v3/datasets/HKEX/" +
        STOCK +
        ".json?api_key=xCJuSM5DeG9s9PtmNbFg&time=" +
        todayHour +
        todayMinute +
        todaySecond;
      promises.push(
        fetch(url, settings)
          .then((res) => res.json())
          .then((res) => {
            //console.log(res)
            // do something with JSON
            return { ...res };
          })
          .catch((err) => {
            console.log(err);
            return rejects(err);
          })
      );
      Promise.all(promises)
        .then(function (result) {
          response.send(result[0]);
        })
        .catch((err) => {
          console.log(err);
          response.send({ error: err });
        });
    }
  }
});

app.post("/delete/:TABLE", function (req, response) {
  let TABLE = req.params.TABLE;
  let EMAIL = req.body.email;

  if (checkEmail(EMAIL)) {
    let collection = mongoConectClient
      .db("rockie2695_mongodb")
      .collection("stockAlert_" + TABLE);
    if (TABLE == "stockNotify" && typeof req.body.stock !== "undefined") {
      let id = req.body.id;
      let stock = req.body.stock;
      let delete_notify = new Promise(function (resolve, reject) {
        deleteRecord(collection, { _id: ObjectId(id) }, function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
          return;
        });
      });
      let return_result = "";
      delete_notify
        .then(function (result) {
          //console.log(result.result)
          if (typeof result.result.ok !== "undefined") {
            return_result = result.result.ok;
          } else {
            response.send({ error: "delete error" });
            return;
          }
        })
        .then(function () {
          let promises = [];
          promises.push({
            updateOne: {
              filter: {
                stock: stock,
              },
              update: {
                $inc: {
                  people: -1,
                },
              },
            },
          });
          let collection = mongoConectClient
            .db("rockie2695_mongodb")
            .collection("stockAlert_" + "eachStock");
          return new Promise(function (resolve, reject) {
            updateRecordMulti(collection, promises, function (err, result) {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
              return;
            });
          });
        })
        .then(function (result) {
          response.send({ _id: id, ok: return_result });
        })
        .catch((err) => {
          console.error(err);
          response.send({ error: "server error" });
        });
    }
  }
});
/*
app.get("/find/:THING", function (req, response) {
    let THING = req.params.THING
    //let EMAIL = req.body.email
    let [todayHour, todayMinute, todayDay, today, todaySecond] = getDayTime()
    //if (checkEmail(EMAIL)) {
    if (THING === 'stockName') {
        let STOCK = '00001'

        let url = "https://query2.finance.yahoo.com/v1/finance/quoteType/0002.HK?lang=zh-Hant-HK&region=HK"
        let settings = {
            method: "Get"
        }
        let promises = []
        promises.push(fetch(url, settings)
            .then(res => res.json())
            .then((res) => {
                console.log(res)
                // do something with JSON
                return { ...res }
            })
            .catch(err => {
                console.log(err)
                rejects(err)
            })
        )
        Promise.all(promises)
            .then(function (result) {
                response.send({ "stock": STOCK, "name": result[0].quoteType.result[0].longName })
            }).catch(err => {
                console.error(err)
                response.send({ "error": "fetch error" })
            })
    }
    //}
})*/
//test

app.get("/select/:TABLE", function (req, res) {
  let TABLE = req.params.TABLE;
  let EMAIL = "rockie2695@yahoo.com.hk";
  let [todayHour, todayMinute, todayDay, today] = getDayTime();
  let onlyToday = new Date(today.toDateString());
  let onlyNextDay = new Date(today.toDateString());
  onlyNextDay = new Date(onlyNextDay.setDate(onlyNextDay.getDate() + 1));
  console.log(
    onlyToday,
    onlyNextDay,
    new Date(onlyToday.setHours(8)),
    new Date(onlyNextDay.setHours(8))
  );
  let collection = mongoConectClient
    .db("rockie2695_mongodb")
    .collection("stockAlert_stockPrice");
  var find = new Promise(function (resolve, reject) {
    findRecord(
      collection,
      { time: { $lt: onlyNextDay, $gte: onlyToday }, stock: "00001" },
      { projection: { _id: 0 } },
      function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
  find
    .then(function (result) {
      res.send({ ok: result });
    })
    .catch(function (error) {
      console.log(error);
      res.send({ error: error });
    });
});

app.get("/", function (req, res) {
  if (interval === null) {
    time = {};
    startServer();
  }
  res.send("ok");
});

app.get(/.*/, function (req, res) {
  res
    .status(404)
    .send({ method: req.method, result: req.url + " Not Supported" });
});

function findRecord(collection = "", query = {}, filter = {}, callback) {
  let middleQuery = collection.find(query, filter);
  if (query.hasOwnProperty("count")) {
    delete query.count;
    callback(middleQuery.count());
  } else {
    if (query.hasOwnProperty("orderBy")) {
      let orderBy = query.orderBy;
      delete query.orderBy;
      middleQuery = middleQuery.sort(orderBy);
    }
    if (query.hasOwnProperty("limit")) {
      let limit = query.limit;
      delete query.limit;
      middleQuery = middleQuery.limit(limit);
    }

    middleQuery.toArray(function (err, result) {
      callback(err, result);
    });
  }
}
/*
function recordMulti(collection, query, callback) {
    collection.bulkWrite(query, function (err, result) {
        callback(err, result);
    });
}*/
function insertManyRecord(collection = "", query = {}, callback) {
  collection.insertMany(query, function (err, result) {
    callback(err, result);
  });
}
function updateRecordMulti(collection = "", query = {}, callback) {
  collection.bulkWrite(query, function (err, result) {
    callback(err, result);
  });
}
function deleteRecord(collection = "", query = {}, callback) {
  collection.deleteOne(query, function (err, result) {
    callback(err, result);
  });
}
