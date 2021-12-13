// this is the layer where we connect with db
const { MongoClient } = require("mongodb");
const { createClient } = require("redis");
const { ObjectId } = require("mongodb");

async function getRedisConnection() {
  let clientRedis = createClient();
  clientRedis.on("error", (err) => console.log("Redis Client Error", err));
  await clientRedis.connect();
  console.log("redis connected");
  return clientRedis;
}

async function getBranches() {
  let client;
  try {
    const uri = "mongodb://localhost:27017";
    client = new MongoClient(uri);
    await client.connect();

    console.log("Connected to Mongo Server");

    console.log("get Branches");

    const db = client.db("project2");
    const branchCollection = db.collection("rentalBranch");

    let result = "";
    result = await branchCollection.find({}).toArray();
    // console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
// get customer or bookingTimes hashes
async function getCustomers(times, page, pageSize) {
  let client;
  try {
    client = await getRedisConnection();

    let result = [];

    // if we don't have a times variable, we return all customers
    if (times === "") {
      // since all the customer keys are stored in a list, so we can specify
      // the starting and ending indexes
      let allCustomersKeys = await client.lRange(
        "allCustomers",
        (page - 1) * pageSize,
        page * pageSize - 1
      );
      // console.log(allCustomersKeys);
      let promises = [];
      allCustomersKeys.forEach((customerKey) => {
        let promise = client.hGetAll(customerKey);
        promises.push(promise);
      });
      result = await Promise.all(promises);
      console.log(result);
      return result;
      // otherwise we need to return customers that have booked more than x times
    } else {
      // result = await bookingCollection.aggregate(query).toArray();
      // console.log("result is:", result);
      // return result;
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
  }
}

// April
async function getCars(startYear, model, make, page, pageSize) {
  console.log("get cars", startYear, model, make);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carCollection = db.collection("car");

    // if there're no search criteria, return everything
    if (startYear === "" && model === "" && make === "") {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      console.log(result);
      return result;
      // search by start year only
    } else if (startYear !== "") {
      let query = [
        {
          $match: {
            startYear: {
              $gt: parseInt(startYear),
            },
          },
        },
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      console.log(result);
      return result;
      // search by both car model and car make
    } else if (model !== "" && make !== "") {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $match: {
            "model.0.model": model,
          },
        },
        {
          $match: {
            "make.0.make": make,
          },
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      return result;
      // search by car make only
    } else if (model === "") {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $match: {
            "make.0.make": make,
          },
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      return result;
      // search by car model only
    } else {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $match: {
            "model.0.model": model,
          },
        },
        {
          $skip: (page - 1) * pageSize,
        },
        {
          $limit: pageSize,
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      return result;
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function getAllCarMake() {
  console.log("get all car makes in database");
  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carMakeCollection = db.collection("carMake");

    result = await carMakeCollection.find({}).toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

// April
async function getAllCarModel() {
  console.log("get all car models in database");
  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carModelCollection = db.collection("carModel");

    result = await carModelCollection.find({}).toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

// April
async function getAllRentalBranch() {
  console.log("get all rental branches in database");
  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const rentalBranchCollection = db.collection("rentalBranch");

    result = await rentalBranchCollection.find({}).toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
  }
}

async function getBookings(startDate, endDate, page, pageSize) {
  let client;
  try {
    const uri = "mongodb://localhost:27017";
    client = new MongoClient(uri);
    await client.connect();

    console.log("Connected to Mongo Server");

    console.log("get bookings", startDate, endDate, page, pageSize);

    const db = client.db("project2");
    const bookingCollection = db.collection("booking");

    let result = "";

    if (startDate === "" && endDate === "") {
      result = await bookingCollection
        .find({})
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();

      return result;
    } else {
      // though endDate is well in code logical here, we do not use endDate in this project. it is always empty
      if (endDate === "") {
        result = await bookingCollection
          .find({ bookingStartDate: { $gt: new Date(startDate) } })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray(new Date(startDate));
        return result;
      } else if (startDate == "") {
        result = await bookingCollection
          .find({ bookingStartDate: { $lt: new Date(endDate) } })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray();

        return result;
      } else {
        result = await bookingCollection
          .find({
            bookingStartDate: {
              $gt: new Date(startDate),
              $lt: new Date(endDate),
            },
          })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .toArray();

        return result;
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

async function getBookingCount(startDate, endDate) {
  console.log("get booking count", startDate, endDate);

  let client;
  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");
    const db = client.db("project2");
    const bookingCollection = db.collection("booking");
    let result;
    // though endDate is well in code logical here, we do not use endDate in this project.
    if (startDate === "" && endDate === "") {
      result = await bookingCollection.find({}).count();
      console.log(result);
      return result;
    } else {
      if (endDate === "") {
        result = await bookingCollection
          .find({ bookingStartDate: { $gt: new Date(startDate) } })
          .count();
        console.log("booking count:", result);
        return result;
      } else if (startDate == "") {
        result = await bookingCollection
          .find({ bookingStartDate: { $lt: new Date(endDate) } })
          .count();
        console.log("booking count:", result);
        return result;
      } else {
        result = await bookingCollection
          .find({
            bookingStartDate: {
              $gt: new Date(startDate),
              $lt: new Date(endDate),
            },
          })
          .count();
        console.log("booking count:", result);
        return result;
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// bugu -- Done!!
async function getBranchCount() {
  console.log("get branch count");
  let client;
  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const branchCollection = db.collection("rentalBranch");
    let result;

    result = await branchCollection.find({}).count();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function getCustomerCount(times) {
  console.log("get customer count", times);

  let client;
  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const customerCollection = db.collection("customer");
    const bookingCollection = db.collection("booking");
    let result;

    if (times === "") {
      result = await customerCollection.find({}).count();
      console.log(result);
      return result;
    } else {
      let query = [
        {
          $group: {
            _id: "$customer",
            booking_times: {
              $sum: 1,
            },
            sample_booking: {
              $first: "$$ROOT",
            },
          },
        },
        {
          $match: {
            booking_times: {
              $gt: parseInt(times),
            },
          },
        },
        {
          $count: "count",
        },
      ];

      result = await bookingCollection.aggregate(query).toArray();
      let count = result[0]["count"];
      console.log("result is:", result);
      console.log("count is", count);
      return result[0]["count"];
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function getCarCount(startYear, model, make) {
  console.log("get car count", startYear, model, make);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carCollection = db.collection("car");

    // if there're no search criteria, return everything
    if (startYear === "" && model === "" && make === "") {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $count: "count",
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      console.log(result[0]["count"]);
      return result[0]["count"];
      // search by start year only
    } else if (startYear !== "") {
      let query = [
        {
          $match: {
            startYear: {
              $gt: parseInt(startYear),
            },
          },
        },
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $count: "count",
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      console.log(result[0]["count"]);
      return result[0]["count"];
      // search by both car model and car make
    } else if (model !== "" && make !== "") {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $match: {
            "model.0.model": model,
          },
        },
        {
          $match: {
            "make.0.make": make,
          },
        },
        {
          $count: "count",
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      console.log(result[0]["count"]);
      return result[0]["count"];
      // search by car make only
    } else if (model === "") {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $match: {
            "make.0.make": make,
          },
        },
        {
          $count: "count",
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      console.log(result[0]["count"]);
      return result[0]["count"];
      // search by car model only
    } else {
      let query = [
        {
          $lookup: {
            from: "carMake",
            localField: "make",
            foreignField: "_id",
            as: "make",
          },
        },
        {
          $lookup: {
            from: "carModel",
            localField: "model",
            foreignField: "_id",
            as: "model",
          },
        },
        {
          $match: {
            "model.0.model": model,
          },
        },
        {
          $count: "count",
        },
      ];
      result = await carCollection.aggregate(query).toArray();
      console.log(result[0]["count"]);
      return result[0]["count"];
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function getCarByID(carID) {
  console.log("get car by ID", carID);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carCollection = db.collection("car");

    const query = [
      {
        $match: {
          _id: ObjectId(carID),
        },
      },
      {
        $lookup: {
          from: "carMake",
          localField: "make",
          foreignField: "_id",
          as: "make",
        },
      },
      {
        $lookup: {
          from: "carModel",
          localField: "model",
          foreignField: "_id",
          as: "model",
        },
      },
      {
        $lookup: {
          from: "rentalBranch",
          localField: "currentRentalBranch",
          foreignField: "_id",
          as: "currentRentalBranch",
        },
      },
    ];
    result = await carCollection.aggregate(query).toArray();
    console.log(result[0]);
    return result[0];
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}
// bugu done
async function getBranchByID(rentalBranchID) {
  console.log("get branch by ID", rentalBranchID);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const branchCollection = db.collection("rentalBranch");

    const query = [
      {
        $match: {
          _id: ObjectId(rentalBranchID),
        },
      },
    ];
    result = await branchCollection.aggregate(query).toArray();
    console.log(result[0]);
    return result[0];
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function getCustomerByID(customerID) {
  console.log("get customer by ID", customerID);

  let client;
  let result;
  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const customerCollection = db.collection("customer");

    result = await customerCollection
      .find({ _id: ObjectId(customerID) })
      .toArray();
    console.log("result is", result[0]);
    // takes the first element because _id should be the unique identifier for each customer
    return result[0];
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function getCustomerMembershipStatus(customerID) {
  console.log("get customer membership status", customerID);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const bookingCollection = db.collection("booking");

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
        $match: {
          _id: ObjectId(customerID),
        },
      },
      {
        $addFields: {
          membership: {
            $switch: {
              branches: [
                {
                  case: {
                    $gte: ["$total_spending_of_current_customer", 6000],
                  },
                  then: "gold membership",
                },
                {
                  case: {
                    $gte: ["$total_spending_of_current_customer", 4000],
                  },
                  then: "silver membership",
                },
                {
                  case: {
                    $gte: ["$total_spending_of_current_customer", 2000],
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

    result = await bookingCollection.aggregate(query).toArray();
    console.log("membership result", result[0]["membership"]);
    return result[0]["membership"];
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function getCustomerBookingHistory(customerID) {
  console.log("get customer booking history", customerID);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const bookingCollection = db.collection("booking");

    const query = [
      {
        $lookup: {
          from: "customer",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $match: {
          "customer.0._id": ObjectId(customerID),
        },
      },
      {
        $lookup: {
          from: "rentalBranch",
          localField: "pickupRentalBranch",
          foreignField: "_id",
          as: "pickupRentalBranch",
        },
      },
      {
        $lookup: {
          from: "rentalBranch",
          localField: "returnRentalBranch",
          foreignField: "_id",
          as: "returnRentalBranch",
        },
      },
      {
        $lookup: {
          from: "car",
          localField: "car",
          foreignField: "_id",
          as: "car",
        },
      },
      {
        $lookup: {
          from: "carMake",
          localField: "car.0.make",
          foreignField: "_id",
          as: "car",
        },
      },
    ];
    result = await bookingCollection.aggregate(query).toArray();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function updateCarByID(carID, car) {
  console.log("update car by id", carID, car);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carCollection = db.collection("car");

    let isAvailable = false;
    if (car.isAvailable === "1") {
      isAvailable = true;
    }

    result = await carCollection.updateOne(
      { _id: ObjectId(carID) },
      {
        $set: {
          isAvailable: isAvailable,
          currentRentalBranch: ObjectId(car.currentRentalBranchID),
          model: ObjectId(car.modelID),
          make: ObjectId(car.makeID),
          startYear: car.startYear,
          mileage: car.mileage,
        },
      }
    );

    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function deleteCarByID(carID) {
  console.log("delete car by ID", carID);

  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carCollection = db.collection("car");

    result = await carCollection.deleteOne({
      _id: ObjectId(carID),
    });
    console.log(result);
    return result;
    // this is the query body
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

// April
async function createCar(car) {
  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const carCollection = db.collection("car");

    result = await carCollection.insertOne({
      currentRentalBranch: ObjectId(car.currentRentalBranchID),
      make: ObjectId(car.makeID),
      model: ObjectId(car.modelID),
      startYear: car.startYear,
      mileage: car.mileage,
      isAvailable: true,
    });

    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

async function createBranch(branch) {
  let client;
  let result;

  try {
    const uri = "mongodb://localhost:27017";

    client = new MongoClient(uri);

    await client.connect();

    console.log("Connected to Mongo Server");

    const db = client.db("project2");
    const branchCollection = db.collection("rentalBranch");

    result = await branchCollection.insertOne({
      branchName: branch.branchName,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      country: branch.country,
      branchManager: branch.branchManager,
    });

    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}
// Bugu --done!
async function updateBranchByID(rentalBranchID, branch) {
  console.log("update branch by id", rentalBranchID, branch);

  let mongoClient;
  let result;
  let redisClient;
  try {
    const uri = "mongodb://localhost:27017";

    mongoClient = new MongoClient(uri);

    await mongoClient.connect();

    console.log("Connected to Mongo Server");

    redisClient = await getRedisConnection();

    const db = mongoClient.db("project2");
    const branchCollection = db.collection("rentalBranch");

    result = await branchCollection.updateOne(
      { _id: ObjectId(rentalBranchID) },
      {
        $set: {
          branchName: branch.branchName,
          address: branch.address,
          city: branch.city,
          state: branch.state,
          country: branch.country,
          branchManager: branch.branchManager,
        },
      }
    );
    if (result) {
      const mills = Date.now();
      await redisClient.zAdd("car:latestBranch", {
        score: mills,
        value: rentalBranchID,
      });
    }
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await mongoClient.close();
    await redisClient.quit();
  }
}

// Bugu --done!
async function deleteBranchByID(rentalBranchID) {
  console.log("delete branch by ID", rentalBranchID);

  let mongoClient;
  let result;
  let redisClient;

  try {
    const uri = "mongodb://localhost:27017";

    mongoClient = new MongoClient(uri);

    await mongoClient.connect();

    console.log("Connected to Mongo Server");
    redisClient = await getRedisConnection();
    const db = mongoClient.db("project2");
    const rentalCollection = db.collection("rentalBranch");

    result = await rentalCollection.deleteOne({
      _id: ObjectId(rentalBranchID),
    });
    console.log(result);
    await redisClient.zRem("car:latestBranch", rentalBranchID);

    return result;
    // this is the query body
  } catch (err) {
    console.log(err);
  } finally {
    await mongoClient.close();
  }
}

async function getLatestBranch() {
  let client;
  try {
    client = await getRedisConnection();

    let allBranchesID = await client.zRangeWithScores(
      "car:latestBranch",
      0,
      -1
    );
    if (allBranchesID.length == 0) {
      console.log("no latest branch id");
      let branches = await getBranches();
      return branches[branches.length - 1];
    } else {
      var id = allBranchesID[allBranchesID.length - 1].value;
      console.log("latest branch id is", id);
      let branch = await getBranchByID(id);
      return branch;
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
  }
}

module.exports.getCars = getCars;
module.exports.getCarByID = getCarByID;
module.exports.updateCarByID = updateCarByID;
module.exports.createCar = createCar;
module.exports.deleteCarByID = deleteCarByID;
module.exports.getCarCount = getCarCount;
module.exports.getCustomers = getCustomers;
module.exports.getCustomerCount = getCustomerCount;
module.exports.getCustomerByID = getCustomerByID;
module.exports.getCustomerBookingHistory = getCustomerBookingHistory;
module.exports.getCustomerMembershipStatus = getCustomerMembershipStatus;
module.exports.getBranches = getBranches;
module.exports.getBranchCount = getBranchCount;
module.exports.createBranch = createBranch;
module.exports.updateBranchByID = updateBranchByID;
module.exports.getBranchByID = getBranchByID;
module.exports.deleteBranchByID = deleteBranchByID;
module.exports.getBookings = getBookings;
module.exports.getBookingCount = getBookingCount;
module.exports.getAllCarMake = getAllCarMake;
module.exports.getAllCarModel = getAllCarModel;
module.exports.getAllRentalBranch = getAllRentalBranch;
module.exports.getLatestBranch = getLatestBranch;
