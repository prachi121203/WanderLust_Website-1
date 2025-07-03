const Listing = require("../models/listing");
const { listingSchema } = require("../schema.js");

//module.exports.index =  async(req, res) => {
//const allListings= await Listing.find({});
    //res.render("listings/index.ejs", {allListings});
    //};

    module.exports.index = async (req, res) => {
  const { category } = req.query;
  let allListings;

  if (category) {
    allListings = await Listing.find({ category });
  } else {
    allListings = await Listing.find({});
  }

  // ✅ Pass both listings and selected category to EJS
  res.render("listings/index.ejs", { allListings, category });
};

    module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
    };

    module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path: "reviews",
        populate: {
            path: "author",
        },
    })
    .populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing, mapToken:process.env.MAP_TOKEN });
    };

    module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const result = listingSchema.validate(req.body);
    if(result.error){
    throw new ExpressError(400, result.error);
       }
       //Geocode using MapTiler
       console.log(result.value);
         const locationString = req.body.listing.location;
const geoRes = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(locationString)}.json?key=${process.env.MAP_TOKEN}`);

if (!geoRes.ok) {
  const errText = await geoRes.text();
  req.flash("error", `Geocoding failed: ${errText}`);
  return res.redirect("/listings/new");
}

const geoData = await geoRes.json();
const [lng, lat] = geoData.features[0].center;

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = {url, filename};
         newListing.geometry = {
      type: "Point",
      coordinates: [lng, lat]
    };
    console.log("✅ Final Listing to Save:", JSON.stringify(newListing, null, 2));
        await newListing.save();

        req.flash("success", "New Listing Create");
        res.redirect(`/listings/${newListing._id}`);
    };

    module.exports.renderEditForm = async (req, res) => {
        let { id } = req.params;
        const listing = await Listing.findById(id);
        if(!listing){
            req.flash("error", "Listing you requested for does not exist!");
            res.redirect("/listings");
        }
        let originalImageUrl = listing.image.url;
        originalImageUrl= originalImageUrl.replace("/upload", "/upload/w_250");
        
        res.render("listings/edit.ejs", { listing, originalImageUrl });
        };

module.exports.updateListing = async (req, res) => {
let { id } = req.params;
  // Log request body to check if data is being sent correctly
console.log("Request Body:", req.body);

if (!req.body.listing) {
return res.status(400).send("Send valid data for listing");
}

let listing = await Listing.findByIdAndUpdate(id, req.body.listing, { runValidators: true, new: true });

if(typeof req.file!="undefined"){
let url = req.file.path;
let filename = req.file.filename;
listing.image = {url, filename};
await listing.save();
}
req.flash("success", "Listing Updated!");
res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};