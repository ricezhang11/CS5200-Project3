const express = require("express");
const router = express.Router();

const myDb = require("../db/myRedisDB.js");

/* GET home page. */
router.get("/", async function (req, res, next) {
  res.redirect("/cars");
});

// http://localhost:3000/cars?pageSize=24&page=3&q=John
// display cars -- all cars or fit certain search queries
router.get("/cars", async (req, res, next) => {
  const startYear = req.query.startYear || "";
  const model = req.query.model || "";
  const make = req.query.make || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  try {
    let total = await myDb.getCarCount(startYear, model, make);
    let cars = await myDb.getCars(startYear, model, make, page, pageSize);
    let allMakes = await myDb.getAllCarMake();
    let allModels = await myDb.getAllCarModel();
    let allRentalBranches = await myDb.getAllRentalBranch();

    res.render("./pages/index", {
      allMakes,
      allModels,
      allRentalBranches,
      cars,
      startYear,
      model,
      make,
      msg,
      currentPage: page,
      lastPage: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/bookings", async (req, res, next) => {
  const startDate = req.query.startDate || "";
  const endDate = req.query.endDate || "";
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  try {
    let total = await myDb.getBookingCount(startDate, endDate);
    let bookings = await myDb.getBookings(startDate, endDate, page, pageSize);
    console.log("index.js debug ");
    console.log(total, startDate, endDate, page, Math.ceil(total / pageSize));
    res.render("./pages/bookingIndex", {
      bookings,
      startDate,
      endDate,
      currentPage: page,
      lastPage: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// branches router
router.get("/branches", async (req, res, next) => {
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const msg = req.query.msg || null;
  console.log("get branches");
  try {
    let total = await myDb.getBranchCount();
    let branches = await myDb.getBranches();
    res.render("./pages/branchesIndex", {
      branches,
      msg,
      currentPage: page,
      lastPage: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// http://localhost:3000/customers?pageSize=24&page=3&q=John
// display customers -- all customers or fit certain search queries
router.get("/customers", async (req, res, next) => {
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 24;
  const times = req.query.times || "";
  try {
    let total = await myDb.getCustomerCount(times);
    console.log("inside get/customer route", total);
    let customers = await myDb.getCustomers(times, page, pageSize);
    res.render("./pages/customersIndex", {
      customers,
      times,
      currentPage: page,
      lastPage: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// get customer details
router.get("/customers/:customerID", async (req, res, next) => {
  const customerID = req.params.customerID;
  try {
    let customer = await myDb.getCustomerByID(customerID);
    let bookings = await myDb.getCustomerBookingHistory(customerID);
    let membershipStatus =
      (await myDb.getCustomerMembershipStatus(customerID)) || "None";

    console.log("get customer by id", {
      customer,
    });

    res.render("./components/customerDetail.ejs", {
      customer,
      bookings,
      membershipStatus,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/createBranch", async (req, res, next) => {
  const branch = req.body;

  try {
    const newBranch = await myDb.createBranch(branch);

    console.log("Created", newBranch);
    res.redirect("/branches/?msg=created");
  } catch (err) {
    console.log("Error creating branch", err);
    next(err);
  }
});

router.post("/createCar", async (req, res, next) => {
  const car = req.body;

  try {
    const newCar = await myDb.createCar(car);

    console.log("Created", newCar);
    res.redirect("/cars/?msg=created");
  } catch (err) {
    console.log("Error creating car", err);
    next(err);
  }
});

// same route as the next one but this is just displaying the edit page
router.get("/cars/:carID/edit", async (req, res, next) => {
  const carID = req.params.carID;

  const msg = req.query.msg || null;
  try {
    let car = await myDb.getCarByID(carID);
    let allMakes = await myDb.getAllCarMake();
    let allModels = await myDb.getAllCarModel();
    let allRentalBranches = await myDb.getAllRentalBranch();

    console.log("edit car", {
      car,
      msg,
      allModels,
      allMakes,
      allRentalBranches,
    });

    res.render("./pages/editCar", {
      car,
      allModels,
      allMakes,
      allRentalBranches,
      msg,
    });
  } catch (err) {
    next(err);
  }
});

// same route as the previous one but this is for posting the changes
router.post("/cars/:carID/edit", async (req, res, next) => {
  const carID = req.params.carID;
  const car = req.body;

  try {
    let updatedCar = await myDb.updateCarByID(carID, car);
    console.log("update", updatedCar);

    // redirect back to cars
    if (updatedCar) {
      res.redirect("/cars/?msg=Updated");
    } else {
      res.redirect("/cars/?msg=Error Updating");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/cars/:carID/delete", async (req, res, next) => {
  const carID = req.params.carID;

  try {
    let deletedCar = await myDb.deleteCarByID(carID);
    console.log("delete", deletedCar);

    if (deletedCar) {
      res.redirect("/cars/?msg=Deleted");
    } else {
      res.redirect("/cars/?msg=Error Deleting");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/branches/:rentalBranchID/delete", async (req, res, next) => {
  const rentalBranchID = req.params.rentalBranchID;

  try {
    let deletedBranch = await myDb.deleteBranchByID(rentalBranchID);
    console.log("delete", deletedBranch);

    if (deletedBranch && deletedBranch.changes === 1) {
      res.redirect("/branches/?msg=Deleted");
    } else {
      res.redirect("/branches/?msg=Error Deleting");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/branches/:rentalBranchID/edit", async (req, res, next) => {
  const rentalBranchID = req.params.rentalBranchID;

  const msg = req.query.msg || null;
  try {
    let branch = await myDb.getBranchByID(rentalBranchID);

    console.log("edit branch", {
      branch,
      msg,
    });

    res.render("./pages/editBranch", {
      branch,
      msg,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/branches/:rentalBranchID/edit", async (req, res, next) => {
  const rentalBranchID = req.params.rentalBranchID;
  const branch = req.body;

  try {
    let updatedBranch = await myDb.updateBranchByID(rentalBranchID, branch);
    console.log("update", updatedBranch);

    if (updatedBranch && updatedBranch.changes === 1) {
      res.redirect("/branches/?msg=Updated");
    } else {
      res.redirect("/branches/?msg=Error Updating");
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
