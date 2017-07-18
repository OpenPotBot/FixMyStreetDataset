/*
  Purpose: Pass information to other helper functions after a user clicks 'Predict'
  Args:
    value - Actual filename or URL
    source - 'url' or 'file'
*/
function predict_click(value, source) {
  $('#waitDiv').show();
  // first grab current index
  var index = document.getElementById("hidden-counter").value;

  // Div Stuff
  if (index > 1) {
    createNewDisplayDiv(index);
  }

  if (source === "url") {
    document.getElementById("img_preview" + index).src = value;
    doPredict({ url: value });

    // Div Stuff
    createHiddenDivs("url", value);
  }

  else if (source === "file") {
    var preview = document.querySelector("#img_preview" + index);
    var file = document.querySelector("input[type=file]").files[0];
    var reader = new FileReader();

    // load local file picture
    reader.addEventListener("load", function () {
      preview.src = reader.result;
      var localBase64 = reader.result.split("base64,")[1];
      doPredict({ base64: localBase64 });

      // Div Stuff
      createHiddenDivs("base64", localBase64);
    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }
  }
}

/*
  Purpose: Does a v2 prediction based on user input
  Args:
    value - Either {url : urlValue} or { base64 : base64Value }
*/
var globalTagArray = '';
function doPredict(value) {
  $('#waitDiv').show();

  var modelID = getSelectedModel();

  app.models.predict(modelID, value).then(

    function (response) {
      console.log(response);
      var conceptNames = "";
      var tagArray, regionArray;
      var tagCount = 0;
      var modelName = response.rawData.outputs[0].model.name;

      // Check for regions models first
      if (response.rawData.outputs[0].data.hasOwnProperty("regions")) {
        regionArray = response.rawData.outputs[0].data.regions;

        // Regions are found, so iterate through all of them
        for (var i = 0; i < regionArray.length; i++) {
          conceptNames += "<b>Result " + (i + 1) + "</b>";

          // Demographic has separate sub-arrays
          if (modelName == "demographics") {
            var ageArray = regionArray[i].data.face.age_appearance.concepts;
            var ethnicArray = regionArray[i].data.face.multicultural_appearance.concepts;
            var genderArray = regionArray[i].data.face.gender_appearance.concepts;

            // Age Header
            conceptNames += '<br/><b><span style="font-size:10px">Age Appearance</span></b>';

            // print top 5 ages
            for (var a = 0; a < 5; a++) {
              conceptNames += '<li>' + ageArray[a].name + ': <i>' + ageArray[a].value + '</i></li>';
            }

            // Ethnicity Header
            conceptNames += '<b><span style="font-size:10px">Multicultural Appearance</span></b>';

            // print top 3 ethnicities
            for (var e = 0; e < 3; e++) {
              conceptNames += '<li>' + ethnicArray[e].name + ': <i>' + ethnicArray[e].value + '</i></li>';
            }

            // Gender Header
            conceptNames += '<b><span style="font-size:10px">Gender Appearance</span></b>';

            // print gender
            conceptNames += '<li>' + genderArray[0].name + ': <i>' + genderArray[0].value + '</i></li>';
          }

          // For faces just print bounding boxes
          else if (modelName == "face-v1.3") {
            // Top Row
            conceptNames += '<li>Top Row: <i>' + regionArray[i].region_info.bounding_box.top_row + '</i></li>';
            conceptNames += '<li>Left Column: <i>' + regionArray[i].region_info.bounding_box.left_col + '</i></li>';
            conceptNames += '<li>Bottom Row: <i>' + regionArray[i].region_info.bounding_box.bottom_row + '</i></li>';
            conceptNames += '<li>Right Column: <i>' + regionArray[i].region_info.bounding_box.right_col + '</i></li>';
          }

          // Celebrity
          else if (modelName == "celeb-v1.3") {
            tagArray = regionArray[i].data.face.identity.concepts;

            // Print first 10 results
            for (var c = 0; c < 10; c++) {
              conceptNames += '<li>' + tagArray[c].name + ': <i>' + tagArray[c].value + '</i></li>';
            }
          }

          // Logos
          else if (modelName == "logo") {
            // Print all results
            conceptNames += '<br/><b><span style="font-size:10px">Logo</span></b>';
            conceptNames += '<li>' + regionArray[i].data.concepts[0].name + ': <i>' + regionArray[i].data.concepts[0].value + '</i></li>';
            conceptNames += '<br/><b><span style="font-size:10px">Location</span></b>';
            conceptNames += '<li>Top Row: <i>' + regionArray[i].region_info.bounding_box.top_row + '</i></li>';
            conceptNames += '<li>Left Column: <i>' + regionArray[i].region_info.bounding_box.left_col + '</i></li>';
            conceptNames += '<li>Bottom Row: <i>' + regionArray[i].region_info.bounding_box.bottom_row + '</i></li>';
            conceptNames += '<li>Right Column: <i>' + regionArray[i].region_info.bounding_box.right_col + '</i></li>';
          }

          // Focus
          else if (modelName == "focus") {
            // Print total focus score and all regions with focus

            if (i === 0) {
              conceptNames += '<li>Overall Focus: <i>' + response.rawData.outputs[0].data.focus.value + '</i></li>';
            }

            conceptNames += '<br/><b><span style="font-size:10px">Focus Region</span></b>';
            conceptNames += '<li>Top Row: <i>' + regionArray[i].region_info.bounding_box.top_row + '</i></li>';
            conceptNames += '<li>Left Column: <i>' + regionArray[i].region_info.bounding_box.left_col + '</i></li>';
            conceptNames += '<li>Bottom Row: <i>' + regionArray[i].region_info.bounding_box.bottom_row + '</i></li>';
            conceptNames += '<li>Right Column: <i>' + regionArray[i].region_info.bounding_box.right_col + '</i></li>';
          }

          tagCount += 10;
        }
      }

      // Color Model
      else if (modelName === "color") {
        conceptNames += '<b><span style="font-size:10px">Colors</span></b>';
        tagArray = response.rawData.outputs[0].data.colors;

        for (var col = 0; col < tagArray.length; col++) {
          conceptNames += '<li>' + tagArray[col].w3c.name + ': <i>' + tagArray[col].value + '</i></li>';
        }

        tagCount = tagArray.length;
      }

      // Generic tag response models
      else if (response.rawData.outputs[0].data.hasOwnProperty("concepts")) {
        tagArray = response.rawData.outputs[0].data.concepts;

        for (var other = 0; other < tagArray.length; other++) {
          conceptNames += '<li>' + tagArray[other].name + ': <i>' + tagArray[other].value + '</i></li>';
        }

        tagCount = tagArray.length;
      }

      // Bad region request
      else {
        if (modelName != "logo" && modelName != "focus") {
          $('#concepts').html("<br/><br/><b>No Faces Detected!</b>");
        }
        else if (modelName == "logo") {
          $('#concepts').html("<br/><br/><b>No Logos Detected!</b>");
        }
        else {
          $('#concepts').html("<br/><br/><b>No Focus Regions Detected!</b>");
        }
        $('#waitDiv').hide();
        return;
      }

      var columnCount = tagCount / 10;

      conceptNames = '<ul style="margin-right:20px; margin-top:20px; columns:' + columnCount + '; -webkit-columns:' + columnCount + '; -moz-columns:' + columnCount + ';">' + conceptNames;

      conceptNames += '</ul>';
      $('#concepts').html(conceptNames);

      document.getElementById("add-image-button").style.visibility = "visible";

      //Matthew Steer added this on: 17.5.17
      globalTagArray = tagArray;
      $('#waitDiv').hide();
    },
    function (err) {
      console.log(err);
    }
  );
}

/*
  Purpose: Return a back-end model id based on current user selection
  Returns:
    Back-end model id
*/
function getSelectedModel() {
  var model = document.querySelector('input[name = "model"]:checked').value;

  if (model === "general") {
    return Clarifai.GENERAL_MODEL;
  }

  else if (model === "food") {
    return Clarifai.FOOD_MODEL;
  }

  else if (model === "NSFW") {
    return Clarifai.NSFW_MODEL;
  }

  else if (model === "travel") {
    return Clarifai.TRAVEL_MODEL;
  }

  else if (model === "wedding") {
    return Clarifai.WEDDINGS_MODEL;
  }

  else if (model === "color") {
    return Clarifai.COLOR_MODEL;
  }

  else if (model === "demographic") {
    return Clarifai.DEMOGRAPHICS_MODEL;
  }

  else if (model === "logo") {
    return Clarifai.LOGO_MODEL;
  }

  else if (model === "apparel") {
    return "e0be3b9d6a454f0493ac3a30784001ff";
  }

  else if (model === "faces") {
    return Clarifai.FACE_DETECT_MODEL;
  }

  else if (model == "focus") {
    return Clarifai.FOCUS_MODEL;
  }

  else if (model === "celebrity") {
    return "e466caa0619f444ab97497640cefc4dc";
  }

  else if (model === "custom") {
    var e = document.getElementById("custom_models_dropdown");
    return e.options[e.selectedIndex].value;
  }

}

/*
  Purpose: Add an image to an application after user clicks button
  Args:
    index - # of the image in the session
*/
function addImageToApp(index) {
  var imgType = document.getElementById("hidden-type" + index).value;
  var imgValue = document.getElementById("hidden-val" + index).value;

  //Matthew Steer added this on: 17.5.17   
  //Create ID
  var d = new Date();
  var refNumber = d.getTime();

  //Post Image    
  var postObj = {};
  var imgDetails = {};
  imgDetails.fixMyStreetCats = fixMyStreetCats;
  if (globalTagArray) {
    imgDetails.tagName_1 = globalTagArray[0].name;
    imgDetails.tagValue_1 = globalTagArray[0].value;
    imgDetails.tagName_2 = globalTagArray[1].name;
    imgDetails.tagValue_2 = globalTagArray[1].value;
    imgDetails.tagName_3 = globalTagArray[2].name;
    imgDetails.tagValue_3 = globalTagArray[2].value;
    imgDetails.tagName_4 = globalTagArray[3].name;
    imgDetails.tagValue_4 = globalTagArray[3].value;
    imgDetails.tagName_5 = globalTagArray[4].name;
    imgDetails.tagValue_5 = globalTagArray[4].value;
    imgDetails.tagName_6 = globalTagArray[5].name;
    imgDetails.tagValue_6 = globalTagArray[5].value;
    imgDetails.tagName_7 = globalTagArray[6].name;
    imgDetails.tagValue_7 = globalTagArray[6].value;
    imgDetails.tagName_8 = globalTagArray[7].name;
    imgDetails.tagValue_8 = globalTagArray[7].value;
    imgDetails.tagName_9 = globalTagArray[8].name;
    imgDetails.tagValue_9 = globalTagArray[8].value;
    imgDetails.tagName_10 = globalTagArray[9].name;
    imgDetails.tagValue_10 = globalTagArray[9].value;
    imgDetails.tagName_11 = globalTagArray[10].name;
    imgDetails.tagValue_11 = globalTagArray[10].value;
    imgDetails.tagName_12 = globalTagArray[11].name;
    imgDetails.tagValue_12 = globalTagArray[11].value;
    imgDetails.tagName_13 = globalTagArray[12].name;
    imgDetails.tagValue_13 = globalTagArray[12].value;
    imgDetails.tagName_14 = globalTagArray[13].name;
    imgDetails.tagValue_14 = globalTagArray[13].value;
    imgDetails.tagName_15 = globalTagArray[14].name;
    imgDetails.tagValue_15 = globalTagArray[14].value;
    imgDetails.tagName_16 = globalTagArray[15].name;
    imgDetails.tagValue_16 = globalTagArray[15].value;
    imgDetails.tagName_17 = globalTagArray[16].name;
    imgDetails.tagValue_17 = globalTagArray[16].value;
    imgDetails.tagName_18 = globalTagArray[17].name;
    imgDetails.tagValue_18 = globalTagArray[17].value;
    imgDetails.tagName_19 = globalTagArray[18].name;
    imgDetails.tagValue_19 = globalTagArray[18].value;
    imgDetails.tagName_20 = globalTagArray[19].name;
    imgDetails.tagValue_20 = globalTagArray[19].value;
  }

  document.getElementById("refNumber(" + index + ")").textContent = "Reference ID: " + refNumber;
  document.getElementById("refNumber(" + index + ")").style.visibility = 'visible';
  if (EXIFdetails.lat != undefined) {
    imgDetails.lat = EXIFdetails.lat;
    document.getElementById("gps_lat(" + index + ")").textContent = "Lat: " + imgDetails.lat;
    document.getElementById("gps_lat(" + index + ")").style.visibility = 'visible';
  }
  if (EXIFdetails.lon != undefined) {
    imgDetails.lon = EXIFdetails.lon;
    document.getElementById("gps_lon(" + index + ")").textContent = "Lon: " + imgDetails.lon;
    document.getElementById("gps_lon(" + index + ")").style.visibility = 'visible';
  }

  if (EXIFdetails.lat != undefined && EXIFdetails.lon != undefined) {
    //create a wgs84 coordinate
    wgs84 = new GT_WGS84();
    wgs84.setDegrees(imgDetails.lat, imgDetails.lon);

    //convert to OSGB
    osgb = wgs84.getOSGB();
    imgDetails.osgb_easting = osgb.eastings;
    imgDetails.osgb_northing = osgb.northings;

    document.getElementById("osgb(" + index + ")").textContent = "OS Easting: " + imgDetails.osgb_easting + ", OS Northing: " + imgDetails.osgb_northing;
    document.getElementById("osgb(" + index + ")").style.visibility = 'visible';
  }

  postObj = { id: refNumber, data: JSON.stringify(imgDetails), emailAddress: '', emailFrom: '', emailSubject: '', emailBody: '' };

  $.ajax({
    type: "POST",
    url: "http://ww1.bathnes.gov.uk/publicwebapi/api/PotBotRequestsAPI/v2",
    data: JSON.stringify(postObj),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (el, textStatus, jqXhr) {
      $.ajax({
        type: "GET",
        url: "http://ww1.bathnes.gov.uk/publicwebapi/api/PotBotRequestsAPI/v2/potbotcategories/" + refNumber,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response, textStatus, jqXhr) {
          var select = document.getElementById("myPotBotCats(" + index + ")");
          if (response.length != 0) {
            $.each(response, function (posn, el) {
              var option = document.createElement("option");
              option.text = el;
              select.add(option);
            });
          } else {
            var fixMyStreetCatsObject = fixMyStreetCats.split('|');
            for (var item in fixMyStreetCatsObject) {
              var option = document.createElement("option");
              option.text = fixMyStreetCatsObject[item];
              select.add(option);
            }
          }
          document.getElementById("add-image-button").style.visibility = 'hidden';
          document.getElementById("myPotBotCats(" + index + ")").style.visibility = 'visible';          

          //get road information from GIS          
          var dataSet = [];
          $.ajax({
            type: "GET",
            url: "http://ww1.bathnes.gov.uk/publicwebapi/api/PotBotGISRequestsAPI/v2/PotBotGIS/" + refNumber + '/' + imgDetails.osgb_easting + '/' + imgDetails.osgb_northing + '/15',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response, textStatus, jqXhr) {
              if (response.length != 0) {
                $.each(response, function (posn, el) {
                  if (el != '') {
                    var cols = el.split("|");
                    dataSet.push([cols[0], cols[1]]);
                  }
                });
                if (dataSet.length != 0) {
                  //show mini map
                  $('#prop_mini_map-' + index).attr('src', 'https://isharemapstest.bathnes.gov.uk/MapGetImage.aspx?RequestType=Map&MapSource=Bathnes/minimap&layers=all&Easting=' + imgDetails.osgb_easting  + '&Northing=' + imgDetails.osgb_northing + '&Zoom=150&mapid=-1&ServiceAction=GotoLocation&MapWidth=350&MapHeight=350&ZoomPin=1');
                  $('#prop_mini_map-' + index).show();

                  //Show data table
                  $('#datatable-' + index).DataTable({
                    ordering: false,                    
                    data: dataSet,
                    columns: [
                      { title: "Description" },
                      { title: "Category" }
                    ]
                  });
                }
              }
              $('#waitDiv').hide();
            },
            error: function () {
            }
          });
        },
        error: function () {
        }
      });
    },
    error: function () {
    }
  });

  // if(imgType === "url") {
  //   app.inputs.create({
  //     url: imgValue
  //   }).then(
  //     function(response) {
  //       alert("Image successfully added!");
  //     },
  //     function(err) {
  //       alert("Error Adding Image. Check to see if it is a duplicate.");
  //     }
  //   );
  // }

  // else if(imgType === "base64") {
  //   app.inputs.create({
  //     base64: imgValue
  //   }).then(
  //     function(response) {
  //       alert("Image successfully added!");
  //     },
  //     function(err) {
  //       alert("Error Adding Image. Check to see if it is a duplicate.");
  //     }
  //   );
  // }
}

/*
  Purpose: Create a dynamic div to store entire user session
  Args:
    index - # of the image in the session
*/
function createNewDisplayDiv(index) {
  var mainDiv = document.getElementById("predictions");

  var elem = document.createElement('div');
  elem.innerHTML =
    '<div style="margin-top:30px; margin-left:20px; margin-bottom:30px; clear:left; float:left"> \
      <img id="img_preview' + index + '" src="" width="400"/> \
      <br/> \
      <span id="add-image-button" style="visibility:hidden"> \
        <button onClick="addImageToApp(' + index + ')">Categorise image</button> \
        <select id="myPotBotCats(' + index + ')" size="1" style="visibility:hidden"></select> \
      </span> \
    </div> \
    <div id="concepts" class="conceptBox"> \
    </div> \
    <div style="margin-left:20px; margin-bottom:30px; clear:left; float:left"> \
      <span id="refNumber(' + index + ')" style="visibility:hidden"></span>\
      <span id="gps_lat(' + index + ')" style="visibility:hidden"></span>\
      <span id="gps_lon(' + index + ')" style="visibility:hidden"></span>\
      <span id="osgb(' + index + ')" style="visibility:hidden"></span>\
    </div>\
    <img id="prop_mini_map-' + index + '" src="" class="minimap" style="width: 25%; margin: 0px auto; display: block;">\
    <table id="datatable-' + index + '" class="display" width="100%"></table>';
  mainDiv.innerHTML = elem.innerHTML + mainDiv.innerHTML;
}

/*
  Purpose: Creates hidden Div elements to store info of each picture uploaded
  Args:
    urlOrBase64 - binary variable to store the type of image
    source - the actual URL string or the base64
*/
function createHiddenDivs(urlOrBase64, source) {
  // first grab current index
  var index = document.getElementById("hidden-counter").value;

  // type
  var input1 = document.createElement("input");
  input1.setAttribute("type", "hidden");
  input1.setAttribute("id", "hidden-type" + index);
  input1.setAttribute("name", "hidden-type" + index);
  input1.setAttribute("value", urlOrBase64);

  // value
  var input2 = document.createElement("input");
  input2.setAttribute("type", "hidden");
  input2.setAttribute("id", "hidden-val" + index);
  input2.setAttribute("name", "hidden-val" + index);
  input2.setAttribute("value", source);

  // add new inputs to page
  document.getElementsByTagName('body')[0].appendChild(input1);
  document.getElementsByTagName('body')[0].appendChild(input2);

  // increment index
  document.getElementById("hidden-counter").value = parseInt(index) + 1;
}
