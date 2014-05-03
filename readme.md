# Coggle API Javascript Client

## Basic Use
See [coggle-issue-importer](http://github.com/coggle/coggle-issue-importer) for
a complete example application, including authentication.

```js
var CoggleApi = require('coggle');

var coggle = new CoggleApi({
  token:user_access_token
});

coggle.createDiagram(
    "My New Coggle"
    function(err, diagram){
        if(err)
            throw err;
        console.log("created diagram!", diagram);
    }
);
```


# API Documentation
##Class `CoggleApi`
The Coggle API client.

###Constructor
Create a new instance of the Coggle API client.

###Method `post`
POST to an endpoint on the Coggle API

Parameters:
  * **`endpoint`** type: `String`URL of endpoint to post to (relative to the domain)
  * **`body`**The body to post. Will be converted to JSON.
  * **`callback`** type: `Function`Callback accepting (error, body) that will be called with the result. The response returned from the server is parsed as JSON and returned as `body`.

###Method `get`
GET from an endpoint on the Coggle API

Parameters:
  * **`endpoint`** type: `String`URL of endpoint to get from (relative to the domain)
  * **`callback`** type: `Function`Callback accepting (error, body) that will be called with the result. The response returned from the server is parsed as JSON and returned as `body`.

###Method `createDiagram`
Create a new Coggle diagram.

Parameters:
  * **`title`** type: `String`Title for the created diagram.
  * **`callback`** type: `Function`Callback accepting (error, CoggleApiDiagram)
