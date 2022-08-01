var express = require("express");
var bodyParser = require("body-parser");
var awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

var AWS = require("aws-sdk");
var AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const https = require("https");

// declare a new express app
var app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

/**********************
 * getQuickSightDashboardEmbedURL get method *
 **********************/

app.get("/getEverestDashboard", function (req, res) {
  var roleArn =
    "arn:aws:cognito-idp:us-east-1:567024620811:userpool/us-east-1_YSyREQVZ8"; // your cognito authenticated role arn here

  AWS.config.region = "us-east-1";

  var sessionName = req.query.payloadSub;
  var cognitoIdentity = new AWS.CognitoIdentity();
  var stsClient = new AWS.STS();
  var params = {
    IdentityPoolId: "us-east-1:b3d2f970-705b-4d09-b321-24621523169e",
    Logins: {
      "cognito-idp.us-east-1.amazonaws.com/us-east-1_YSyREQVZ8":
        req.query.jwtToken,
    },
  };

  cognitoIdentity.getId(params, function (err, data) {
    if (err) console.log(err, err.stack);
    else {
      data.Logins = {
        "cognito-idp.us-east-1.amazonaws.com/us-east-1_YSyREQVZ8":
          req.query.jwtToken,
      };

      cognitoIdentity.getOpenIdToken(data, function (err, openIdToken) {
        if (err) {
          console.log(err, err.stack);
          res.json({
            err,
          });
        } else {
          let stsParams = {
            RoleSessionName: sessionName,
            WebIdentityToken: openIdToken.Token,
            RoleArn: roleArn,
          };
          stsClient.assumeRoleWithWebIdentity(stsParams, function (err, data) {
            if (err) {
              console.log(err, err.stack);
              res.json({
                err,
              });
            } else {
              AWS.config.update({
                region: "us-east-1",
                credentials: {
                  accessKeyId: data.Credentials.AccessKeyId,
                  secretAccessKey: data.Credentials.SecretAccessKey,
                  sessionToken: data.Credentials.SessionToken,
                  expiration: data.Credentials.Expiration,
                },
              });
              var registerUserParams = {
                // required
                AwsAccountId: "567024620811",
                // can be passed in from api-gateway call
                Email: req.query.email,
                // can be passed in from api-gateway call
                IdentityType: "IAM",
                // can be passed in from api-gateway call
                Namespace: "default",
                // can be passed in from api-gateway call
                UserRole: "READER",
                IamArn: roleArn,
                SessionName: sessionName,
              };
              var quicksight = new AWS.QuickSight();
              quicksight.registerUser(registerUserParams, function (err, data) {
                if (err) {
                  console.log("3");
                  console.log(err, err.stack); // an error occurred
                  if (err.code && err.code === "ResourceExistsException") {
                    var getDashboardParams = {
                      // required
                      AwsAccountId: "567024620811",
                      // required
                      DashboardId: "78a8e352-a998-4705-8e16-94d5f9712491",
                      // required
                      IdentityType: "IAM",
                      ResetDisabled: false, // can be passed in from api-gateway call
                      SessionLifetimeInMinutes: 100, // can be passed in from api-gateway call
                      UndoRedoDisabled: false, // can be passed in from api-gateway call
                    };
                    var quicksightGetDashboard = new AWS.QuickSight();
                    quicksightGetDashboard.getDashboardEmbedUrl(
                      getDashboardParams,
                      function (err, data) {
                        if (err) {
                          console.log(err, err.stack); // an error occurred
                          res.json({
                            err,
                          });
                        } else {
                          console.log(data);
                          res.json({
                            data,
                          });
                        }
                      }
                    );
                  } else {
                    res.json({
                      err,
                    });
                  }
                } else {
                  // successful response
                  setTimeout(function () {
                    var getDashboardParams = {
                      // required
                      AwsAccountId: "567024620811",
                      // required
                      DashboardId: "78a8e352-a998-4705-8e16-94d5f9712491",
                      // required
                      IdentityType: "IAM",
                      ResetDisabled: false, // can be passed in from api-gateway call
                      SessionLifetimeInMinutes: 100, // can be passed in from api-gateway call
                      UndoRedoDisabled: false, // can be passed in from api-gateway call
                    };

                    var quicksightGetDashboard = new AWS.QuickSight();
                    quicksightGetDashboard.getDashboardEmbedUrl(
                      getDashboardParams,
                      function (err, data) {
                        if (err) {
                          console.log(err, err.stack); // an error occurred
                          res.json({
                            err,
                          });
                        } else {
                          console.log(data);
                          res.json({
                            data,
                          });
                        }
                      }
                    );
                  }, 2000);
                }
              });
            }
          });
        }
      });
    }
  });
});

app.listen(3000, function () {
  console.log("App started");
});

module.exports = app;
