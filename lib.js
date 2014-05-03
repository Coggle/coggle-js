/**
 * # lib.js
 *
 * Define the Coggle API classes
 *
 */

/*! imports */
var unirest   = require('unirest');

/**
 * Create a new Coggle API Node object
 *
 * @constructor
 * @class CoggleApiNode
 *
 * @param {CoggleApiDiagram} diagram of this node
 * @param {Object} resource representing this node
 *
 * @return constructs an instance of CoggleApi
 * @api public
 */
var CoggleApiNode = function CoggleApiNode(coggle_api_diagram, node_resource){
  this.diagram = coggle_api_diagram;
  this.id      = node_resource._id;
  this.text    = node_resource.text;
  this.offset  = node_resource.offset;
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

/**
 * Create a new instance of a Coggle API Diagram object.
 *
 * @constructor
 * @class CoggleApi
 *
 * @param {CoggleApi} api client to be used by this diagram
 * @param {Object} resource describing this diagram. Should have at least the
 *                 following fields:
 *                   * _id: ID of the diagram
 *                   * title: title of the diagram
 *
 * @return constructs an instance of CoggleApi
 * @api public
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
 *   $parameters: {
 *     options: "Options: {}"
 *   }
 * }
 *
 */
var CoggleApi = function CoggleApi(options){
  this.baseurl = options.base_url || 'https://coggle.it';
  this.token   = options.token;
  if(!options.token)
      throw new Error("you must provide a user's authentication token");

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
     *       $example: "Use `/api/1/diagrams` to create a new diagram."
     *     },
     *     body: "The body to post. Will be converted to JSON.",
     *     callback: {
     *       $type: "Function",
     *       $brief: "Callback accepting (error, body) that will be called "+
     *               "with the result. The response returned from the server "+
     *               "is parsed as JSON and returned as `body`.",
     *     }
     *   }
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
};

module.exports = CoggleApi;

