var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

//complex query
// complex search criterion (more than one expression with logical connectors)
// The company wants to investigate their business in east coasts, so they want to look at
// the order of popularity of the branches (based on transaction amount) in the east coast states
// (Connecticut, Virginia, Florida, North Carolina, Massachusetts, New Jersey)

MongoClient.connect(url, function (err, db) {
  if (err) throw err;
  var dbo = db.db("project2");
  const query = [
    {
      $group: {
        _id: "$pickupRentalBranch",
        totalTransaction: {
          $sum: "$totalCharge",
        },
      },
    },
    {
      $lookup: {
        from: "rentalBranch",
        localField: "_id",
        foreignField: "_id",
        as: "branch",
      },
    },
    {
      $match: {
        $or: [
          { "branch.state": "Virginia" },
          { "branch.state": "Connecticut" },
          { "branch.state": "Florida" },
          { "branch.state": "North Carolina" },
          { "branch.state": "Massachusetts" },
          { "branch.state": "New Jersey" },
        ],
      },
    },
    {
      $sort: {
        totalTransaction: -1,
      },
    },
    {
      $project: {
        _id: 0,
        branchName: "$branch.branchName",
        branchManager: "$branch.branchManager",
        totalTransaction: 1,
      },
    },
  ];

  dbo
    .collection("booking")
    .aggregate(query)
    .toArray(function (err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
    });
});
