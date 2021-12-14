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

// April --- DONE!
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
      let t = parseInt(times);
      t += 1;
      let promises = [];
      let maximumBookingTimes = await client.get("maximumTimes");
      let allCustomersWithBookingTimeLessOrEqualToT = [];
      while (t <= parseInt(maximumBookingTimes)) {
        let customers = await client.sMembers(`bookingTimes:${t}`);
        allCustomersWithBookingTimeLessOrEqualToT =
          allCustomersWithBookingTimeLessOrEqualToT.concat(customers);
        t += 1;
      }
      console.log(
        "customers with bookings more than",
        times,
        "times",
        allCustomersWithBookingTimeLessOrEqualToT
      );
      let customersInRange = allCustomersWithBookingTimeLessOrEqualToT.slice(
        (page - 1) * pageSize,
        page * pageSize
      );
      customersInRange.forEach((customerKey) => {
        let promise = client.hGetAll(customerKey);
        promises.push(promise);
      });
      let result = await Promise.all(promises);
      return result;
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
  }
}

// April --- DONE!
async function getCars(page, pageSize) {
  console.log("get all cars");

  let client;
  let result = [];

  try {
    client = await getRedisConnection();
    let allCarKeys = await client.lRange(
      "allCars",
      (page - 1) * pageSize,
      page * pageSize - 1
    );
    console.log(
      "page",
      page,
      "pageSize",
      pageSize,
      "length",
      allCarKeys.length
    );
    let promises = [];
    allCarKeys.forEach((carKey) => {
      let promise = client.hGetAll(carKey);
      promises.push(promise);
    });
    result = await Promise.all(promises);
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
  }
}

// April -- DONE!
async function getAllCarMake() {
  console.log("get all car makes");
  let client;

  try {
    client = await getRedisConnection();
    let allCarMakes = await client.lRange("allCarMakes", 0, -1);
    console.log(allCarMakes);
    return allCarMakes;
  } catch (err) {
    console.log(err);
  } finally {
    client.quit();
  }
}

// April -- DONE!
async function getAllCarModel() {
  console.log("get all car models");
  let client;

  try {
    client = await getRedisConnection();
    let allCarModels = await client.lRange("allCarModels", 0, -1);
    console.log(allCarModels);
    return allCarModels;
  } catch (err) {
    console.log(err);
  } finally {
    client.quit();
  }
}

// April -- DONE!
async function getAllRentalBranch() {
  console.log("get all rental branches");
  let client;

  try {
    client = await getRedisConnection();
    let allRentalBranches = await client.lRange("allRentalBranches", 0, -1);
    console.log(allRentalBranches);
    return allRentalBranches;
  } catch (err) {
    console.log(err);
  } finally {
    client.quit();
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

// April -- DONE!
async function getCustomerCount(times) {
  console.log("get customer count", times);

  let client;
  try {
    client = await getRedisConnection();

    if (times === "") {
      let numberOfCustomers = await client.lLen("allCustomers");
      console.log("number of customers is", numberOfCustomers);
      return numberOfCustomers;
    } else {
      let t = parseInt(times);
      t += 1;
      let maximumBookingTimes = await client.get("maximumTimes");
      let numberOfCustomersWithBookingMoreThanTTimes = 0;
      while (t <= parseInt(maximumBookingTimes)) {
        let customers = await client.sMembers(`bookingTimes:${t}`);
        numberOfCustomersWithBookingMoreThanTTimes += customers.length;
        t += 1;
      }
      console.log(
        "there are",
        numberOfCustomersWithBookingMoreThanTTimes,
        "that have booked more than",
        times,
        "times"
      );
      return numberOfCustomersWithBookingMoreThanTTimes;
    }
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
  }
}

// April -- DONE!
async function getCarCount(startYear, model, make) {
  console.log("get car count", startYear, model, make);

  let client;

  try {
    client = await getRedisConnection();
    let numberOfCars = await client.lLen("allCars");
    return numberOfCars;
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
  }
}

// April --- DONE!
async function getCarByID(carID) {
  console.log("get car by ID", carID);

  let client;

  try {
    client = await getRedisConnection();

    let car = await client.hGetAll(`car:${carID}`);
    console.log(car);
    return car;
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
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

// April -- DONE!
async function getCustomerByID(customerID) {
  console.log("get customer by ID", customerID);

  let client;
  let result;

  try {
    client = await getRedisConnection();

    result = await client.hGetAll(`customer:${customerID}`);
    console.log("result is", result);
    // takes the first element because _id should be the unique identifier for each customer
    return result;
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
  }
}

// April -- DONE!
async function getCustomerBookingHistory(customerID) {
  console.log("get customer booking history", customerID);

  let client;
  let result;

  try {
    client = await getRedisConnection();

    result = await client.sMembers(`customer:${customerID}:bookings`);
    console.log("booking history is:", result);

    let promises = [];
    result.forEach((bookingKey) => {
      let promise = client.hGetAll(bookingKey);
      promises.push(promise);
    });

    let bookings = await Promise.all(promises);
    console.log(bookings);
    return bookings;
  } catch (err) {
    console.log(err);
  } finally {
    await client.quit();
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
