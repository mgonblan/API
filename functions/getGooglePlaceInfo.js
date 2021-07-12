exports = function(changeEvent) {
  var fullDocument = changeEvent.fullDocument;
  
  searchableName = encodeURIComponent(fullDocument.name.trim());
  
   GooglePlacesSearchURL ="https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input="+searchableName+"&inputtype=textquery&fields=place_id&key="+context.values.get("GooglePlacesAPIKey");
   const http = context.Services.get("GooglePlacesServices");
   return http 
    .get({url: GooglePlacesSearchURL})
    .then(resp=>{
      //The response body is encoded as raw BSON.Binary. Parse it to JSON.
              var details_result = EJSON.parse(resp.body.text());

              // ACTION REQUIRED BELOW: Replace database name and collection name so it matches yours
              // WHAT THIS DOES: Uses Google Places info and pushes it to MongoDB Document. This also reformats Google Places Geo info to make it GeoJSON-ready
              // All fields added to the queryFields will be pushed to the MongoDB document inside the nested document googlePlaceInfo
              var collection = context.services.get("mongodb-atlas").db("DogtorDb").collection("Business");
              collection.updateOne(
                {"_id":fullDocument._id},
                {$set:{
                  "populatedOn":Date(),
                  "googlePlaceInfo":details_result.result,
                  "googlegeoJSONcoordinates.type":"Point"},
                  $push:{ "googlegeoJSONcoordinates.coordinates" : {$each:
                    [details_result.result.geometry.location.lng,
                    details_result.result.geometry.location.lat]}}
                  });
    });
  /*
    A Database Trigger will always call a function with a changeEvent.
    Documentation on ChangeEvents: https://docs.mongodb.com/manual/reference/change-events/

    Access the _id of the changed document:
    const docId = changeEvent.documentKey._id;

    Access the latest version of the changed document
    (with Full Document enabled for Insert, Update, and Replace operations):
    const fullDocument = changeEvent.fullDocument;

    const updateDescription = changeEvent.updateDescription;

    See which fields were changed (if any):
    if (updateDescription) {
      const updatedFields = updateDescription.updatedFields; // A document containing updated fields
    }

    See which fields were removed (if any):
    if (updateDescription) {
      const removedFields = updateDescription.removedFields; // An array of removed fields
    }

    Functions run by Triggers are run as System users and have full access to Services, Functions, and MongoDB Data.

    Access a mongodb service:
    const collection = context.services.get("mongodb-atlas").db("DogtorDb").collection("Business");
    const doc = collection.findOne({ name: "mongodb" });

    Note: In Atlas Triggers, the service name is defaulted to the cluster name.

    Call other named functions if they are defined in your application:
    const result = context.functions.execute("function_name", arg1, arg2);

    Access the default http client and execute a GET request:
    const response = context.http.get({ url: <URL> })

    Learn more about http client here: https://docs.mongodb.com/realm/functions/context/#context-http
  */
};
