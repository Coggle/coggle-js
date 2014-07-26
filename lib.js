/** vim: et:ts=2:sw=2:sts=2
 * @license Coggle OPML Importer Copyright (c) 2014, CoggleIt Limited. All Rights Reserved.
 * Licensed under the MIT license, http://opensource.org/licenses/MIT
 */
/** # lib.js
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

  var self = this;

  this.children = [];
  if('children' in node_resource){
    node_resource.children.forEach(function(child_resource){
      var child = new CoggleApiNode(coggle_api_diagram, child_resource);
      child.parent_id = this.id;
      self.children.push(child);
    });
  }
};
CoggleApiNode.prototype = {
  replaceIds: function(url){
    return this.diagram.replaceId(url.replace(':node', this.id));
  },
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
   *       $brief: "Callback accepting (Error, CoggleApiNode)",
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
      this.replaceIds('/api/1/diagrams/:diagram/nodes'),
      '',
      body,
      function(err, node){
        if(err)
          return callback(err);
        var api_node = new CoggleApiNode(self.diagram, node);
        api_node.parent_id = self.id;
        self.children.push(api_node);
        return callback(false, api_node);
    });
  },
  
  /**!jsjsdoc
   *
   * doc.CoggleApiNode.update = {
   *   $brief: "Update the properties of this node",
   *   $parameters: {
   *     properties: {
   *        $type: "Object: {text:String, offset:{x:Number, y:Number}, parent:String}",
   *        $brief: "Omitted properties are unmodified."
   *     },
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error, CoggleApiNode)",
   *     }
   *   }
   * }
   *
   */
  update: function update(properties, callback){
    var body = {};
    if(properties.parent){
        if(typeof properties.parent !== 'string')
            callback(new Error('parent id must be string'));
        body.parent = properties.parent;
    }
    if(properties.offset){
        if(isNaN(properties.offset.x)) callback(new Error('offset.x must be a number'));
        if(isNaN(properties.offset.y)) callback(new Error('offset.y must be a number'));
        body.offset = {
            x: properties.offset.x,
            y: properties.offset.y
        };
    }
    if(properties.text){
        if(typeof properties.text !== 'string')
            callback(new Error('text must be string'));
        if(properties.text.length > 3000)
            callback(new Error('text too long'));
        body.text = properties.text;
    }
    var self = this;
    this.diagram.apiclient.put(
      this.replaceIds('/api/1/diagrams/:diagram/nodes/:node'),
      '',
      body,
      function(err, node){
        if(err)
          return callback(err);
        self.parent_id = node.parent_id;
        self.text      = node.text;
        self.offset    = node.offset;
        return callback(false, self);
    });
  },
  /**!jsjsdoc
   *
   * doc.CoggleApiNode.setText = {
   *   $brief: "Set the text of this node.",
   *   $parameters: {
   *     text: {
   *        $type: "String",
   *        $brief: "New text to set"
   *     },
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error, CoggleApiNode)",
   *     }
   *   }
   * }
   *
   */
  setText: function setText(text, callback){
    return this.update({text:text}, callback);
  },

  /**!jsjsdoc
   *
   * doc.CoggleApiNode.move = {
   *   $brief: "Move this node to a new offset relative to its parent.",
   *   $parameters: {
   *     offset: {
   *        $type: "Object {x:Number, y:Number}",
   *        $brief: "New position to set"
   *     },
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error, CoggleApiNode)",
   *     }
   *   }
   * }
   *
   */
  move: function move(offset, callback){
    return this.update({offset:offset}, callback);
  },

  /**!jsjsdoc
   *
   * doc.CoggleApiNode.remove = {
   *   $brief: "Remove this node, and all nodes descended from it.",
   *   $parameters: {
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error)",
   *     }
   *   }
   * }
   *
   */
  remove: function remove(callback){
    this.diagram.apiclient.delete(
      this.replaceIds('/api/1/diagrams/:diagram/nodes/:node'),
      '',
      callback
    );
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
  /**!jsjsdoc
   *
   * doc.CoggleApiDiagram.webUrl = {
   *   $brief: "Return the web URL for accessing this diagram.",
   *   $parameters: {}
   * }
   */
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
   *       $brief: "Callback accepting (Error, [Array of CoggleApiNode])",
   *     }
   *   }
   * }
   */
  getNodes: function getNodes(callback){
    var self = this;
    this.apiclient.get(
      this.replaceId('/api/1/diagrams/:diagram/nodes'),
      '',
      function(err, body){
        if(err)
          return callback(new Error('failed to get diagram nodes: ' + err.message));
        var api_nodes = [];
        body.forEach(function(node_resource){
          api_nodes.push(new CoggleApiNode(self, node_resource));
        });
        return callback(false, api_nodes);
    });
  },
  /**!jsjsdoc
   *
   * doc.CoggleApiDiagram.arrange = {
   *   $brief: "Rearrange the nodes in this diagram. Use with care!",
   *   $detail:
   *     "This function performs a server-side re-arrangement of all of the "+
   *     "items in the diagram. It will attempt to make sure no items overlap, "+
   *     "and to space things out evenly, it is **not** guaranteed to produce "+
   *     "the same result when called with the same parameters. "+
   *     "\n\n"+
   *     "Use of this function is generally discouraged, for the same reason that "+
   *     "an auto-arrange function isn't provided in the web interface to "+
   *     "Coggle: the placement of items can convey meaning, and if your program "+
   *     "understands relationships in the data (such as a natural ordering, or "+
   *     "that some sibling branches are more closely associated than others), "+
   *     "then you should make use of that information to perform a custom "+
   *     "layout.",
   *   $parameters: {
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error, [Array of CoggleApiNode])",
   *     }
   *   }
   * };
   *
   */
  arrange: function(callback){
    var self = this;      
    this.apiclient.put(
      this.replaceId('/api/1/diagrams/:diagram/nodes'),
      'action=arrange',
      {},
      function(err, body){
        if(err)
          return callback(new Error('failed to rearrange diagram: ' + err.message));
        var api_nodes = [];
        body.forEach(function(node_resource){
          api_nodes.push(new CoggleApiNode(self, node_resource));
        });
        return callback(false, api_nodes);
      }
    );
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
   *     query_string: "Query string, if any.",
   *     body: "The body to post. Will be converted to JSON.",
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error, body) that will be called "+
   *               "with the result. The response returned from the server "+
   *               "is parsed as JSON and returned as `body`.",
   *     }
   *   },
   *   $examples: ".post('/api/1/diagrams', '', {title:'My New Diagram'}, function(err, diagram){...})"
   * }
   */
  post: function post(endpoint, query_string, body, callback){
    if(query_string && query_string.indexOf('&') !== 0)
      query_string = '&' + query_string;
    unirest.post(this.baseurl + endpoint + '?access_token=' + this.token + (query_string || ''))
      .type('json')
      .send(body)
      .end(function(response){
        if(!response.ok)
          return callback(new Error(
            'POST ' + endpoint + ' '+(response.code || (response.error && response.error.code))+
            ': ' + ((response.body && response.body.description) || response.error)
          ));
        return callback(false, response.body);
    });
  },
  /**!jsjsdoc
   *
   * doc.CoggleApi.put = {
   *   $api: "private",
   *   $brief: "PUT to an endpoint on the Coggle API",
   *   $parameters: {
   *     endpoint: {
   *       $type: "String",
   *       $brief: "URL of endpoint to put to (relative to the domain)",
   *     },
   *     query_string: "Query string, if any. Only `action=arrange` is"+
   *                   "currently used by any endpoint.",
   *     body: "The body to put. Will be converted to JSON.",
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error, body) that will be called "+
   *               "with the result. The response returned from the server "+
   *               "is parsed as JSON and returned as `body`.",
   *     }
   *   },
   *   $examples: ".put('/api/1/diagrams', '', {title:'My New Diagram'}, function(err, diagram){...})"
   * }
   */
  put: function put(endpoint, query_string, body, callback){
    if(query_string && query_string.indexOf('&') !== 0)
      query_string = '&' + query_string;
    unirest.put(this.baseurl + endpoint + '?access_token=' + this.token + (query_string || ''))
      .type('json')
      .send(body)
      .end(function(response){
        if(!response.ok)
          return callback(new Error(
            'PUT ' + endpoint + ' '+(response.code || (response.error && response.error.code))+
            ': ' + ((response.body && response.body.description) || response.error)
          ));
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
   *     query_string: "Query string, if any.",
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error, body) that will be called "+
   *               "with the result. The response returned from the server "+
   *               "is parsed as JSON and returned as `body`.",
   *     }
   *   }
   * }
   */
  get: function get(endpoint, query_string, callback){
    if(query_string && query_string.indexOf('&') !== 0)
      query_string = '&' + query_string;
    unirest.get(this.baseurl + endpoint + '?access_token=' + this.token + (query_string || ''))
      .type('json')
      .end(function(response){
        if(!response.ok)
          return callback(new Error(
            'GET ' + endpoint + ' '+(response.code || (response.error && response.error.code))+
            ': ' + ((response.body && response.body.description) || response.error)
          ));
        return callback(false, response.body);
    });
  },

  /**!jsjsdoc
   *
   * doc.CoggleApi.delete = {
   *   $api: "private",
   *   $brief: "DELETE an endpoint on the Coggle API",
   *   $parameters: {
   *     endpoint: {
   *       $type: "String",
   *       $brief: "URL of endpoint to delete (relative to the domain)"
   *     },
   *     query_string: "Query string, if any.",
   *     callback: {
   *       $type: "Function",
   *       $brief: "Callback accepting (Error) that will be called "+
   *               "with the result.",
   *     }
   *   }
   * }
   */
  'delete': function(endpoint, callback){
    if(query_string && query_string.indexOf('&') !== 0)
      query_string = '&' + query_string;
    unirest.delete(this.baseurl + endpoint + '?access_token=' + this.token + (query_string || ''))
      .type('json')
      .end(function(response){
        if(!response.ok)
          return callback(new Error(
            'DELETE ' + endpoint + ' '+(response.code || (response.error && response.error.code))+
            ': ' + ((response.body && response.body.description) || response.error)
          ));
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
   *       $brief: "Callback accepting (Error, CoggleApiDiagram)",
   *     }
   *   }
   * }
   */
  createDiagram: function createCoggle(title, callback){
    if(typeof title !== 'string')
        throw new Error("title must be a string");
    // callback should accept(Error, diagram)
    var self = this;
    var body = {
      title:title
    };
    this.post('/api/1/diagrams', '', body, function(err, body){
      if(err)
        return callback(new Error('failed to create coggle: ' + err.message));
      return callback(false, new CoggleApiDiagram(self, body));
    });
  },
};


module.exports = CoggleApi;

