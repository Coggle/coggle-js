var assert = require("assert");

var test_diagram_title = "Coggle JS Client Test";

// setup
describe("setup", function(){
  var token   = process.env.COGGLE_USER_AUTH_TOKEN;
  var baseurl = process.env.COGGLE_BASE_URL;
  it('COGGLE_USER_AUTH_TOKEN must be set to a valid user auth token in order to run tests', function(){
    assert(token);
  });
  
  describe("CoggleApi", function(){
    var CoggleApi = require("../");
    it('should create a new API client', function(){
      var coggle = new CoggleApi({
           token:token,
        base_url:baseurl
      });
      testCreateDiagram(coggle);
    });
  });
});

function testCreateDiagram(coggle){
  describe("#createDiagram()", function(){
    it('should create a new diagram', function(done){
      coggle.createDiagram(test_diagram_title, function(err, diagram){
        if(err)
          throw err;
        assert(diagram);
        done();
        testDiagram(diagram);
      });
    });
  });
}

function testDiagram(diagram){
  describe("#getNodes()", function(){
    it('should get the nodes for the diagram', function(done){
      diagram.getNodes(function(err, nodes){
        if(err)
          throw err;
        assert.equal(nodes.length, 1);
        assert.equal(nodes[0].text, test_diagram_title);
        done();
        testModifyRoot(nodes[0]);
      });
    });
  });
}

function testModifyRoot(root_node){
  describe('#setText', function(){
    var renamed_daigram_title = test_diagram_title + ' Renamed';
    it('should set root text', function(done){
      root_node.setText(renamed_daigram_title, function(err, node){
        if(err)
          throw err;
        assert.equal(node.text, renamed_daigram_title);
        done();
        testAdd(root_node);
      });
    });
  });
}

function testAdd(node){
  describe('#addChild()', function(){
    it('should create a new child', function(done){
      node.addChild("new child", {x:100, y:50}, function(err, child){
        if(err)
          throw err;
        assert.equal(child.text, "new child");
        assert.equal(child.offset.x, 100);
        assert.equal(child.offset.y, 50);
        assert.equal(child.parent_id, node.id);
        done();
        testModify(child);
      });
    });
  });
}

function testModify(node){
  describe('#setText()', function(){
    it('should change the node text', function(done){
      node.setText("renamed node", function(err, node){
        if(err)
          throw err;
        assert.equal(node.text, "renamed node");
        done();
      });
    });
  });
  describe('#move()', function(){
    it('should change the node position', function(done){
      node.move({x:-100, y:-20}, function(err, node){
        if(err)
          throw err;
        assert.equal(node.offset.x, -100);
        assert.equal(node.offset.y, -20);
        done();
        testAdd2(node);
      });
    });
  });
}

function testAdd2(node){
  describe('#addChild()', function(){
    it('should create another new child', function(done){
      node.addChild("new new child", {x:100, y:50}, function(err, child){
        if(err)
          throw err;
        assert.equal(child.text, "new new child");
        assert.equal(child.offset.x, 100);
        assert.equal(child.offset.y, 50);
        assert.equal(child.parent_id, node.id);
        done();
        // delete the parent node: the child should be removed too
        testDelete(node);
      });
    });
  });
}

function testDelete(node){
  describe('#remove()', function(){
    it('should remove the node and children', function(done){
      node.remove(function(err){
        if(err)
          throw err;
        node.diagram.getNodes(function(err, nodes){
          if(err)
            throw err;
          function findNodeRecursive(children){
            for(var i = 0; i < children.length; i++){
              if(children[i].id == node.id)
                return true;
              if(findNodeRecursive(children[i].children))
                return true;
            }
            return false;
          }
          assert(!findNodeRecursive(nodes));
          done();
        });
      });
    });
  });  
}

