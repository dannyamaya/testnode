
var BUCKET_NAME = 'cannedhead.livinn/';

var fs = require('fs');
var aws = require('aws-sdk');

//Esta linea  Para trabajar en el local
aws.config.loadFromPath('AwsConfig.json');

var s3 = new aws.S3();
s3.setEndpoint('s3-sa-east-1.amazonaws.com');


function getContentTypeByFile(fileName) {
  var rc = 'application/octet-stream';
  var fileNameLowerCase = fileName.toString().toLowerCase();

  if (fileNameLowerCase.indexOf('.html') >= 0) rc = 'text/html';
  else if (fileNameLowerCase.indexOf('.css') >= 0) rc = 'text/css';
  else if (fileNameLowerCase.indexOf('.json') >= 0) rc = 'application/json';
  else if (fileNameLowerCase.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fileNameLowerCase.indexOf('.png') >= 0) rc = 'image/png';
  else if (fileNameLowerCase.indexOf('.jpg') >= 0) rc = 'image/jpg';
  else if (fileNameLowerCase.indexOf('.jpeg') >= 0) rc = 'image/jpeg';
  else if (fileNameLowerCase.indexOf('.svg') >= 0) rc = 'image/svg+xml';

  return rc;
}


// Export functions
module.exports = {

  uploadFiles: function(fileName,remoteName,user,buffer,folder) {
    try{
      //var fileBuffer = fs.readFileSync(fileName);
      var metaData = getContentTypeByFile(fileName);
      var remote = remoteName;

      console.log(remote);

      return s3.putObject({
        ACL: 'public-read',
        Bucket: BUCKET_NAME + folder + user,
        Key: remote,
        Body: buffer,
        ContentType: metaData
      }, function(error, response) {
        if(error){
          console.log('error uploading image: ' + error);
          return false;
        }
        else{
          console.log('uploaded image [' + fileName + ']');
          return true;
        }

      });
    }
    catch (e){
      console.log(e);
      return false;
    }
  }




}

