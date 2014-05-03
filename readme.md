## Coggle API Javascript Client

### Basic Use
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
            raise err;
        console.log("created diagram!", diagram);
    }
);
```


### API Documentation

#### CoggleApi
##### constructor
##### createDiagram

### CoggleApiDiagram 
##### constructor
##### getNodes
##### webUrl

#### CoggleApiNode
##### constructor
##### addChild

