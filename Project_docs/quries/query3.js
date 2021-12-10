var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("project2");
  var startDate = "2020-06-25";
  dbo
    .collection("booking")
    .find({ bookingStartDate: { $gt: new Date(startDate) } })
    .count(function (err, result) {
      if (err) throw err;
      console.log(
        "total bookings whose start date is older than",
        startDate,
        ": ",
        result
      );
      db.close();
    });
});
