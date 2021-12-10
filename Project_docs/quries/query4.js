const { MongoClient } = require("mongodb");
async function Query4() {
  let client;
  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carCollection = db.collection("car");
    // this is the query body
    const query = [
      {
        $sort: {
          startYear: 1,
        },
      },
      {
        $group: {
          _id: "$currentRentalBranch",
          car_with_earliest_start_year: {
            $first: "$$ROOT",
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
          "branch.0.branchName": "Mat Lam Tam",
        },
      },
      {
        $set: {
          isAvailable: false,
        },
      },
    ];

    const result = await carCollection.aggregate(query).toArray();
    console.log("result for Query 4 is: ", result);
  } finally {
    await client.close();
  }
}

module.exports.Query4 = Query4;
Query4();
