// Project 2, query 5:
// # advanced query mechanism
// # Scenario below uses advanced mechanism of $switch:
// # the company decides to award the customers with membership benefits
// # Customers who have spent more than $3000 will be awarded gold membership
// # Customers who have spent more than $2000 will be awarded silver membership
// # Customers who have spent more than $1000 will be awarded bronze membership
const { MongoClient } = require("mongodb");
async function Query5() {
  let client;
  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const bookingCollection = db.collection("booking");

    // query body
    const query = [
      {
        $group: {
          _id: "$customer",
          total_spending_of_current_customer: {
            $sum: "$totalCharge",
          },
        },
      },
      {
        $addFields: {
          membership: {
            $switch: {
              branches: [
                {
                  case: {
                    $gte: ["$total_spending_of_current_customer", 3000],
                  },
                  then: "gold membership",
                },
                {
                  case: {
                    $gte: ["$total_spending_of_current_customer", 2000],
                  },
                  then: "silver membership",
                },
                {
                  case: {
                    $gte: ["$total_spending_of_current_customer", 1000],
                  },
                  then: "bronze membership",
                },
              ],
              default: "None",
            },
          },
        },
      },
    ];
    const result = await bookingCollection.aggregate(query).toArray();

    console.log("result for Query 5 is: ", result);
  } finally {
    await client.close();
  }
}

module.exports.Query5 = Query5;
Query5();
