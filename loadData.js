// load data and create car hashes with the key format car:carID
const { MongoClient } = require("mongodb");
const { createClient } = require("redis");

async function getRedisConnection() {
  let clientRedis = createClient();
  clientRedis.on("error", (err) => console.log("Redis Client Error", err));
  await clientRedis.connect();
  console.log("redis connected");
  return clientRedis;
}

async function getMongoConnection() {
  let clientMongo;
  const uri = "mongodb://localhost:27017";
  clientMongo = new MongoClient(uri);
  await clientMongo.connect();
  console.log("Connected to Mongo Server");
  return clientMongo;
}

async function loadCar() {
  let clientMongo;
  let clientRedis;
  try {
    clientMongo = await getMongoConnection();
    clientRedis = await getRedisConnection();

    const db = clientMongo.db("project2");
    const carCollection = db.collection("car");

    const query = [
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
          from: "carMake",
          localField: "make",
          foreignField: "_id",
          as: "make",
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

    let result = await carCollection.aggregate(query).toArray();

    let promises = [];

    result.forEach((car) => {
      let carId = car._id.toString();
      let key = `car:${carId}`;
      let isAvailable = "1";
      if (!car.isAvailable) {
        isAvailable = "0";
      }
      let promise = clientRedis.hSet(key, {
        id: carId,
        startYear: car.startYear,
        model: car.model[0].model,
        make: car.make[0].make,
        currentRentalBranch: car.currentRentalBranch[0].branchName,
        isAvailable: isAvailable,
      });
      promises.push(promise);
      promise = clientRedis.rPush("allCars", key);
      promises.push(promise);
    });

    Promise.all(promises);
  } catch (err) {
    console.log(err);
  } finally {
    await clientMongo.close();
    await clientRedis.quit();
  }
}

async function loadCustomer() {
  let clientMongo;
  let clientRedis;
  try {
    clientRedis = await getRedisConnection();
    clientMongo = await getMongoConnection();

    const db = clientMongo.db("project2");
    const customerCollection = db.collection("customer");

    let result = await customerCollection.find({}).toArray();
    let promises = [];

    // create customer hash in the format of "customer:${customerId}"
    result.forEach((customer) => {
      let customerId = customer._id.toString();
      let key = `customer:${customerId}`;
      let promise = clientRedis.hSet(key, {
        id: customerId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
        city: customer.city,
        state: customer.state,
        country: customer.country,
      });
      promises.push(promise);
      promise = clientRedis.rPush("allCustomers", key);
      promises.push(promise);
    });
    Promise.all(promises);
  } catch (err) {
    console.log(err);
  } finally {
    clientMongo.close();
    clientRedis.quit();
  }
}

async function loadCustomerBookings() {
  let clientMongo;
  let clientRedis;
  try {
    clientMongo = await getMongoConnection();
    clientRedis = await getRedisConnection();

    const db = clientMongo.db("project2");
    const bookingCollection = db.collection("booking");

    const query = [
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
          from: "customer",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
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
        $group: {
          _id: "$customer",
          bookings: {
            $push: "$$ROOT",
          },
          count: {
            $sum: 1,
          },
        },
      },
    ];

    let result = await bookingCollection.aggregate(query).toArray();
    let promises = [];

    result.forEach((customerBooking) => {
      // first step, create a hash for each booking in the format
      // of `booking:${bookingId}`
      let bookingKeys = [];
      customerBooking.bookings.forEach((booking) => {
        let bookingId = booking._id.toString();
        let bookingKey = `booking:${bookingId}`;
        bookingKeys.push(bookingKey);
        let promise = clientRedis.hSet(bookingKey, {
          bookingStartDate: booking.bookingStartDate.toString(),
          bookingEndDate: booking.bookingEndDate.toString(),
          totalCharge: booking.totalCharge,
          pickupRentalBranch: booking.pickupRentalBranch[0].branchName,
          returnRentalBranch: booking.returnRentalBranch[0].branchName,
        });
        promises.push(promise);
      });
      // add all booking keys to a set in the format of
      // `customer:${customerId}:bookings`
      let customerId = customerBooking._id[0]._id.toString();
      let customerBookingKey = `customer:${customerId}:bookings`;
      bookingKeys.forEach((key) => {
        let promise = clientRedis.sAdd(customerBookingKey, key);
        promises.push(promise);
      });
    });
    Promise.all(promises);
  } catch (err) {
    console.log(err);
  } finally {
    clientMongo.close();
    clientRedis.quit();
  }
}

async function loadDataForBookingTimesFilter() {
  let clientMongo;
  let clientRedis;
  try {
    clientMongo = await getMongoConnection();
    clientRedis = await getRedisConnection();

    const db = clientMongo.db("project2");
    const bookingCollection = db.collection("booking");

    const query = [
      {
        $group: {
          _id: "$customer",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: "$count",
          customers: {
            $push: "$_id",
          },
        },
      },
    ];

    let result = await bookingCollection.aggregate(query).toArray();
    let promises = [];

    // add booking times in the format of `bookingTimes:${times}` as a set of customers
    // to store a set of customers that have booked X times
    result.forEach((bookingTimes) => {
      let count = bookingTimes._id;
      let key = `bookingTimes:${count}`;
      bookingTimes.customers.forEach((id) => {
        let customerId = id.toString();
        let customerKey = `customer:${customerId}`;
        let promise = clientRedis.sAdd(key, customerKey);
        promises.push(promise);
      });
    });
    Promise.all(promises);
  } catch (err) {
    console.log(err);
  } finally {
    clientMongo.close();
    clientRedis.quit();
  }
}

async function loadMaximumBookingTimes() {
  let clientMongo;
  let clientRedis;

  try {
    clientMongo = await getMongoConnection();
    clientRedis = await getRedisConnection();

    const db = clientMongo.db("project2");
    const bookingCollection = db.collection("booking");

    const query = [
      {
        $group: {
          _id: "$customer",
          times: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          times: -1,
        },
      },
    ];

    let result = await bookingCollection.aggregate(query).toArray();
    let maximumTimes = result[0].times;
    await clientRedis.set("maximumTimes", maximumTimes.toString());
  } catch (err) {
    console.log(err);
  } finally {
    clientMongo.close();
    clientRedis.quit();
  }
}

loadCar();
loadCustomer();
loadCustomerBookings();
loadDataForBookingTimesFilter();
loadMaximumBookingTimes();
