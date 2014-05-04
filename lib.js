/**
 * # lib.js
 *
 * Define the Coggle API classes
 *
 */

var unirest   = require('unirest');

/**!jsjsdoc
 * // documentation is produced in the order of definition: we want the main
 * // class to be first, so define it first.
 *
 * doc.CoggleApi = {}
 * doc.CoggleApiDiagram = {}
 * doc.CoggleApiNode = {}
 *
 */

/**!jsjsdoc
 *
 * doc.CoggleApiNode = {
 *    $brief: "Coggle API Node object, which represents individual parts"+
 *            "(\"nodes\") of the branches in a Coggle diagarm"
 * }
 *
 * doc.CoggleApiNode.$constructor = {
 *   $brief: "Create a new instance of a Coggle API Node object.",
 *   $parameters: {
 *     coggle_api_diagram: {
 *      $type:'CoggleApiDiagram',
 *      $brief:'The Diagram in which this node belongs.'
 *     },
 *     node_resource: {
 *      $type:'Object',
 *      $brief:'Node Resource object, with at least `_id` (`String`), `text` (`String`), and `offset` (`{x:Number, y:Number}`) fields.'
 *     }
 *   }
 * }
 *
 */
var CoggleApiNode = function CoggleApiNode(coggle_api_diagram, node_resource){
  this.diagram = coggle_api_diagram;
  this.id      = node_resource._id;
  this.text    = node_resource.text;
  this.offset  = node_resource.offset;

  if('parent' in node_resource){
    this.parent_id = node_resource.parent;
  }

  this.children = [];
  if('children' in node_resource){
    node_resource.children.forEach(function(child_resource){
      var child = new CoggleApiNode(coggle_api_diagram, child_resource);
      child.parent_id = this.id;
      this.children.push_back(child);
    });
  }
};
CoggleApiNode.prototype = {
  /**!jsjsdoc
   *
   * doc.CoggleApiNode.addChild = {
   *   $brief: "Add a child to this item. The child is positioned relative to "+
   *           "this item, and will move when you move this item.",
   *   $parameters: {
   *     text: "Text to add for the item.",
   *     offset: {
   *        $type: "Object: {x:Number, y:Number}",
   *        $brief: "Offset of the new item from this one. The `x` coordinate "+
   *                "is along the branch direction, the `y` coordinate is "+
   *                "vertically down from the top of the document."
   *     },
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (error, [Array of CoggleApiNode])",
   *     }
   *   }
   * }
   */
  addChild: function addChild(text, offset, callback){
    var self = this;
    var body = {
         parent: this.id,
         offset: offset,
           text: text
    };
    this.diagram.apiclient.post(
      this.diagram.replaceId('/api/1/diagrams/:diagram/nodes'),
      body,
      function(err, node){
        if(err)
          return callback(err);
        var api_node = new CoggleApiNode(self.diagram, node);
        api_node.parent_id = self.id;
        self.children.push(api_node);
        return callback(false, api_node);
    });
  }
};

/**!jsjsdoc
 *
 * doc.CoggleApiDiagram = {
 *    $brief: "Coggle API Diagram object.",
 * }
 *
 * doc.CoggleApiDiagram.$constructor = {
 *   $brief: "Create a new instance of a Coggle API Diagram object.",
 *   $parameters: {
 *     coggle_api: {
 *      $type:'CoggleApi',
 *      $brief:'The API client used for accessing this diagram.'
 *     },
 *     diagram_resource: {
 *      $type:'Object',
 *      $brief:'Diagram Resource object, with at least `_id` and `title` fields'
 *     }
 *   }
 * }
 *
 */
var CoggleApiDiagram = function CoggleApiDiagram(coggle_api, diagram_resource){
    this.apiclient = coggle_api;
    this.id        = diagram_resource._id;
    this.title     = diagram_resource.title;
};
CoggleApiDiagram.prototype = {
  webUrl: function webUrl(){
    return this.replaceId(this.apiclient.baseurl+'/diagram/:diagram');
  },
  replaceId: function replaceId(url){
    return url.replace(':diagram', this.id);
  },
  /**!jsjsdoc
   *
   * doc.CoggleApiDiagram.getNodes = {
   *   $brief: "Get all of the nodes (branch elements) in a Diagram.",
   *   $parameters: {
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (error, [Array of CoggleApiNode])",
   *     }
   *   }
   * }
   */
  getNodes: function getNodes(callback){
    var self = this;
    this.apiclient.get(
      this.replaceId('/api/1/diagrams/:diagram/nodes'),
      function(err, body){
        if(err)
          return callback(new Error('failed to get diagram nodes: ' + err.message));
        var api_nodes = [];
        body.forEach(function(node_resource){
          api_nodes.push(new CoggleApiNode(self, node_resource));
        });
        return callback(false, api_nodes);
    });
  }
};


/**!jsjsdoc
 *
 * doc.CoggleApi = {
 *    $brief: "The Coggle API client.",
 * }
 *
 * doc.CoggleApi.$constructor = {
 *   $brief: "Create a new instance of the Coggle API client.",
 *   $examples: "new CoggleApi({token:user_auth_token})",
 *   $parameters: {
 *     options: {
 *      $type: "Object",
 *      $brief: "Possible Options:\n  * **`token`**, **required**: API user "+
 *              "authentication token"
 *     }
 *   }
 * }
 *
 */
var CoggleApi = function CoggleApi(options){
  this.baseurl = options.base_url || 'https://coggle.it';
  this.token   = options.token;
  if(!options.token)
      throw new Error("you must provide a user's authentication token");
};
CoggleApi.prototype = {
  /**!jsjsdoc
   *
   * doc.CoggleApi.post = {
   *   $api: "private",
   *   $brief: "POST to an endpoint on the Coggle API",
   *   $parameters: {
   *     endpoint: {
   *       $type: "String",
   *       $brief: "URL of endpoint to post to (relative to the domain)",
   *     },
   *     body: "The body to post. Will be converted to JSON.",
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (error, body) that will be called "+
   *               "with the result. The response returned from the server "+
   *               "is parsed as JSON and returned as `body`.",
   *     }
   *   },
   *   $examples: ".post(`/api/1/diagrams`, {title:'My New Diagram'}, function(err, diagram){...})"
   * }
   */
  post: function post(endpoint, body, callback){
    unirest.post(this.baseurl + endpoint + '?access_token=' + this.token)
      .type('json')
      .send(body)
      .end(function(response){
        if(!response.ok)
          return callback(new Error('POST ' + endpoint + ' failed:' + (response.body && response.body.details) || response.error));
        return callback(false, response.body);
    });
  },
  /**!jsjsdoc
   *
   * doc.CoggleApi.get = {
   *   $api: "private",
   *   $brief: "GET from an endpoint on the Coggle API",
   *   $parameters: {
   *     endpoint: {
   *       $type: "String",
   *       $brief: "URL of endpoint to get from (relative to the domain)"
   *     },
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (error, body) that will be called "+
   *               "with the result. The response returned from the server "+
   *               "is parsed as JSON and returned as `body`.",
   *     }
   *   }
   * }
   */
  get: function get(endpoint, callback){
    unirest.get(this.baseurl + endpoint + '?access_token=' + this.token)
      .type('json')
      .end(function(response){
        if(!response.ok)
          return callback(new Error('GET ' + endpoint + ' failed:' + (response.body && response.body.details) || response.error));
        return callback(false, response.body);
    });
  },

  /**!jsjsdoc
   *
   * doc.CoggleApi.createDiagram = {
   *   $brief: "Create a new Coggle diagram.",
   *   $parameters: {
   *     title: {
   *       $type: "String",
   *       $brief: "Title for the created diagram."
   *     },
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (error, CoggleApiDiagram)",
   *     }
   *   }
   * }
   */
  createDiagram: function createCoggle(title, callback){
    // callback should accept(error, diagram)
    var self = this;
    var body = {
      title:title
    };
    this.post('/api/1/diagrams', body, function(err, body){
      if(err)
        return callback(new Error('failed to create coggle: ' + err.message));
      return callback(false, new CoggleApiDiagram(self, body));
    });
  },
};


module.exports = CoggleApi;

