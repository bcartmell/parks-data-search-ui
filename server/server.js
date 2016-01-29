/* jshint node: true */
'use strict';

exports.server = (function(listenOnPort) {
  var sys = require("sys"),
    http = require("http"),
    path = require("path"),
    url = require("url"),
    filesys = require("fs"),
    mime = require("./serverModules/mime.js");

  var reqCount = 0;

  listenOnPort = listenOnPort || 8080;

  var respond404 = function(response) {
    response.writeHeader(404, {"Content-Type": "text/plain"});
    response.write("404 Not Found\n");
    response.end();
  };

  var postHandler = function postHandler(request, response) {
    request.on('data', function(data) {
      process.stdout.write('received post data: \n'+ data);
    });
  };

  var fetchFile = function fetchFile(fullPath, response) {
    filesys.readFile(fullPath, "binary", function(err, file) {
      if(err) {
        respond404(response);
      }
      else {
        var ext = fullPath.split('.').pop();
        var responseType = mime.mimeType[ext];
        if (responseType === undefined)
      responseType = "text/plain";

    response.writeHeader(200, {"Content-Type": responseType});
    response.write(file, 'binary');
    response.end();
      }
    });
  };

  var serverInstance = http.createServer(function(request,response){
    var requestedPath = url.parse(request.url).pathname;

    if (request.method === 'POST') {
      postHandler(request, response);
    }

    if (requestedPath == "/") {
      requestedPath = "index.html";
      reqCount = reqCount+1;
      process.stdout.write('request '+ reqCount +' received from '+ request.connection.remoteAddress +'.');
    }

    var fullPath = path.join(process.cwd(),requestedPath);
    fetchFile(fullPath, response);
  });

  return {
    start: function(listenOnPort) {
      serverInstance.listen(listenOnPort, function() {
        sys.puts("Server Running on " + listenOnPort);			
      });
    },
    stop: function() {
      serverInstance.close(function() {
        sys.puts('Server closed.');
      });
    }
  };
}());
