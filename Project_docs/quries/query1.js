var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

//counting documents for an specific user
//find out how many bookings does a user do?

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("project2");
  const query = [
    {
      $match: {
        firstName: "Ardys",
        lastName: "Gentil",
      },
    },
    {
      $lookup: {
        from: "booking",
        localField: "_id",
        foreignField: "customer",
        as: "bookings",
      },
    },
    {
      $project: {
        total_bookings: {
          $cond: {
            if: { $isArray: "$bookings" },
            then: { $size: "$bookings" },
            else: "NA",
          },
        },
      },
    },
  ];

  dbo
    .collection("customer")
    .aggregate(query)
    .toArray(function (err, result) {
      if (err) throw err;
      console.log("total bookings done by customer: Ardys Gentil");
      console.log(result);
      db.close();
    });
});
