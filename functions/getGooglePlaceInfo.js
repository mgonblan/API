exports = function(changeEvent) {

    // WHAT THIS DOES: Extract changeEvent full document into a usable variable
    var fullDocument = changeEvent.fullDocument;
  
    // ACTION REQUIRED BELOW: Replace "name" by whatever field name you are using to contain the searchable business name information
    // WHAT THIS DOES: The field "name" probably contains spaces. The following makes it usable as a URL by replacing spaces by %20.
    searchableName = encodeURIComponent(fullDocument.name.trim());
    searchableLocation = encodeURIComponent(fullDocument.location.trim());
  
    // ACTION REQUIRED BELOW: Replace "GooglePlacesAPIKey" by the name of the Stitch Value you are using for your Google API Key.
    // Alternatively, replace context.values.get("GooglePlacesAPIKey") by your API Key if you are not using Stitch Value.
    // WHAT THIS DOES: Compose Google Place searchable URL and set it to return a JSON document with only the Place ID
    GooglePlacesSearchURL ="https://api.yelp.com/v3/businesses/search?term="+searchableName+"&location="+searchableLocation;
  
    // ACTION REQUIRED BELOW: Replace "GooglePlaces" by the name of the Stitch HTTP GET Service you created.
    const http = context.services.get("YelpApiDoc");
    return http
      .get({url: GooglePlacesSearchURL})
      .then(resp=>{
          //The response body is encoded as raw BSON.Binary. Parse it to JSON.
          var search_result = EJSON.parse(resp.body.text());
  
          // ACTION REQUIRED BELOW: edit the list of Google Places fields you are interested in. See documentation for full list.
          // Be careful, all fields you list below will be in the MongoDB document per the updateOne procedure (this is because the update procedure inserts the full JSON document straight from Google API into MongoDB) 
          queryFields = "formatted_address,geometry,name,place_id,type,vicinity,formatted_phone_number,international_phone_number,opening_hours,website,rating";
          GoogleDetailsURL ="https://api.yelp.com/v3/businesses/"+search_result.id;
  
          // ACTION REQUIRED BELOW: Replace "GooglePlaces" by the name of the Stitch HTTP GET Service you created.
          const http = context.services.get("YelpApiDoc");
          return http
            .get({url: GoogleDetailsURL,
                  headers: {
                  'Authorization': 'Bearer 22pD2RxDY6W-ddNKWtzVZ-SPQpr_p820mU4o8tocZBEEQlS8UT1eVJyT-jpdNhuRv1qkt-aJCbfT021XZr2UACA2CGtGqqCRW4zIevNJAJRjMZDJAvpYV_f1INbqYHYx'
                  }
            })
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
                    "businessInfo":details_result.result,
                    "businessCoordinates":{
                      "type": "Point",
                      $push:{"coordinates": {$each: [details_result.coordinates.longitude,details_result.coordinates.latitude]}}
                    }
                  }});
            });
      });
  };