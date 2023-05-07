var nodes = [];
var edges = [];
const container = document.getElementById("tree-container");


// *** CANVAS SETTINGS ***
const s = new sigma({
    renderer: {
        container: container,
        type: "canvas"
    },
    settings: {
        minNodeSize: 10,
        maxNodeSize: 15,
        minEdgeSize: 2,
        maxEdgeSize: 2,
        edgeColor: "#000000",
        defaultNodeColor: "#2a9d8f",
        labelThreshold: 0,
        rendererEdgeLabels: true,
  }
});

s.cameras[0].goTo({ x: 0, y: 0, angle: 0, ratio: 1.2 });
s.refresh();

function addNode(data, pos_x, pos_y) {
    s.graph.addNode({ id: data, label: data, x: pos_x, y: pos_y, size: 30});        // each node has unique id
    s.refresh();
}

function addEdge(from, to) {
    s.graph.addEdge({
        id: `${from}-${to}`,
        source: from,
        target: to
    });
    s.refresh();
}

function clearCanvas(){
    s.graph.clear();    // clears our canvas
    nodes.length = 0;   // clear our nodes list
    edges.length = 0;   // clear our edges list
    s.refresh();
}


class Node {
    constructor(data) {
      this.key = data;
      this.left = null;
      this.right = null;
    }
}

class object {
  constructor(r, n) {
      this.roll_no = r;
      this.name = n;
  }
}


// *** extract values from frontend and create LIST ***
function createListNode(key, roll, name){
    let obj = new object(roll, name);
    let node = new Node(key);
    node.left = obj;
    return node;
}

var list = null;
function createListForGenerator(node){      // adding node into our list
    if(list == null){
        list = node;
        return;
    }
    let temp = list;
    while(temp.right != null)
        temp = temp.right;
    temp.right = node;
}



// *** Add Nodes in LIST ***  TAKING USER INPUTS (Key, name, rollno)
function addNodeToList(){
    document.getElementById('displayList').classList.remove('d-none');

    let inputKey = document.querySelector("#inputKey");
    let inputRoll = document.querySelector("#inputRoll");
    let inputName = document.querySelector("#inputName");

    // FOR Frontend Display
    let html = "[ " +inputKey.value+ ", " +inputRoll.value+ ", " + inputName.value + " ]<br>";

    let node = createListNode(inputKey.value, inputRoll.value, inputName.value);
    createListForGenerator(node);

    inputKey.value="";
    inputRoll.value="";
    inputName.value="";

    document.getElementById("myList").innerHTML +=  html;
}


// *** Code for Bottom-Up generator ***
// when yield is executed it save function state and returns the node
// when we call generator.next() function resumes its execution
function* bottomUpTreeConstruction(list) {
    // Case1: No element in List
    if (list === null) {
        yield new Node(-1);
        return;
    }

    // Case2: Only 1 element in List
    if (list.right === null) {
        yield list;
        return;
    }

    let root = new Node(1);
    let end = root;
    root.key = list.key;
    root.left = list;

    // End Pointer is used to remove links between list Nodes
    list = list.right;
    end.left.right = null;

    while (list !== null) {
        end.right = new Node(1);
        end = end.right;
        end.key = list.key;
        end.left = list;
        list = list.right;

        end.left.right = null;
    }

    yield root;
    // Till Now We have Reached STEP 2 of our Visualization (so clear screen and Visualize it)


    let old_list = root;
    let new_list;
    let temp1;
    let temp2;

    // This condition indicates that we have only 1 node left
    while (old_list.right !== null) {
      // INITIAL STEP
      temp1 = old_list;
      temp2 = old_list.right;
      old_list = old_list.right.right;

      temp2.right = temp2.left;
      temp2.left = temp1.left;
      temp1.left = temp2;
      temp1.right = null;

      new_list = temp1;
      end = temp1;
      //   Till now our First 2 nodes got merged (here we can yield 2 nodes first merged nodes and remaining list)

      // REPEATING STEP
      while (old_list !== null) {
        // Joining Last Tree
        if (old_list.right === null) {
            end.right = old_list;
            old_list = null;
            yield new_list;
        }
        // Joining Two adjacent Trees
        else {
            temp1 = old_list;
            temp2 = old_list.right;
            old_list = old_list.right.right;

            temp2.right = temp2.left;
            temp2.left = temp1.left;
            temp1.left = temp2;
            temp1.right = null;

            end.right = temp1;
            end = end.right;

            yield new_list;   // it will yield tree made till now
            //   if(old_list != null)
            //     yield old_list;
        }
      }
      old_list = new_list;
      yield new_list;
    }
    root=old_list;
}


// *** ALGO to visualize Tree ***
// Helper Function (will be used for spacing between 2 trees)
function successor(temp){
    if(temp == null) return 0;
    let count=0;
    while(temp.right != null){
        temp = temp.right;
        count++;
    }
    return count;
}

// Helper Function (will be used for spacing between 2 trees)
function predecessor(temp){
    if(temp == null) return 0;
    let count=0;
    while(temp.left != null){
        temp = temp.left;
        count++;
    }
    return count-1;
}

// Helper Function (returns true or false)
function nodeAlreadyExist(temp){
    return s.graph.nodes().some(node => node.id == temp);
}

function makeUnique(key){
    return key+"_";
}

// DFS Function to visualize step 2
function step2Function(node, parent, posx, posy, mySet){
  // Base Case
  if(node == null) return;

  let x = posx.toString();
  let y = posy.toString();
  let parent_key="";
  if(parent != null)
      parent_key = (parent.key).toString();


  if(node instanceof object){
      nodes.push([node.name, x, y]);
      edges.push([parent_key, node.name]);
      return;
  }

    // Make Sure our nodeKey is unique
    let nodeKey = (node.key).toString();
    if(mySet.has(nodeKey)){
        nodeKey = makeUnique(nodeKey);
        node.key = nodeKey;
    }
    mySet.add(nodeKey);

  nodes.push([nodeKey, x, y]);
  if(parent_key != "")
      edges.push([parent_key, nodeKey]);

  // Traverse to its left subtree and generate its nodes (when moving left subtree only increament x)
  step2Function(node.left, node, posx, posy+50, mySet);

  // Traverse to right subtree and generate its nodes
  step2Function(node.right, null, posx+50, posy, mySet);
}


// Recursive Visualization function for remaining steps
function recursiveFunction(node, parent, posx, posy, mySet, lastTree){
    if(node == null) return;        // base case

    let x = posx.toString();
    let y = posy.toString();
    let parent_key="";
    if(parent != null)
        parent_key = (parent.key).toString();

    if(node instanceof object){
        nodes.push([node.name, x, y]);
        edges.push([parent_key, node.name]);
        return;
    }

    // Make Sure our nodeKey is unique
    let nodeKey = (node.key).toString();
    if(mySet.has(nodeKey)){
        nodeKey = makeUnique(nodeKey);
        node.key = nodeKey;
    }
    mySet.add(nodeKey);


    nodes.push([nodeKey, x, y]);
    if(parent_key != "")
        edges.push([parent_key, nodeKey]);

    // if our current node is root node
    if(parent == null){
        if(lastTree)
            recursiveFunction(node.left, node, posx, posy+50, mySet, true);
        else
            recursiveFunction(node.left, node, posx, posy+50, mySet, false);
        if(node.right != null){
            edges.push([nodeKey, (node.right.key).toString()]);

            let x = successor(node.left);
            let y = predecessor(node.right);
            let inc_x = (x+y+3)*50;     // tweeks has been done here for nodes spacing (trial and run)

            // run successor on nodeKey and predecessor on node->right to calculate posx of our tree
            recursiveFunction(node.right, null, posx+inc_x, posy, mySet, false);    // because by this we will be moving to right a new tree whose parenet should be null
        }
    }
    else{
        let succ = successor(node.left);
        let pred = predecessor(node.left);
        let x = Math.floor((succ+pred+1)/2) + 1;
        let dist = posx - x*50;
        recursiveFunction(node.left, node, dist, posy+50, mySet, false);

        if(node.right != null){
            succ = successor(node.right);
            pred = predecessor(node.right);
            x = Math.floor((succ+pred)/2) + 1;     // WORKING

            // done some tweek from trial and error to find this formula (this stops overlapping of nodes)
            if(node.right.right != null)
                x = Math.floor((succ+pred-1)/2) + 1;     // WORKING

            dist = posx + x*50;
            if(lastTree)
                dist += 50;
            recursiveFunction(node.right, node, dist, posy + 50, mySet, false);
        }
    }
}


// *** Display LIST on CANVAS ***
function display(){
    for(let i in nodes){
        addNode(nodes[i][0], nodes[i][1], nodes[i][2]);    // {key, posx, posy}
        s.refresh();
    }

    for(let i in edges){
        addEdge(edges[i][0], edges[i][1]);      // {from_edge, to_edge}
        s.refresh();
    }
}

function displayStep2List() {
    display();

    // Add edges between roots
    let temp = list;
    while(temp.right != null){
        let from_edge = (temp.key).toString();
        let to_edge = (temp.right.key).toString();
        addEdge(from_edge, to_edge);
        temp = temp.right;
    }
    s.refresh();
}


function startVisualization(){
    var treeGenerator = bottomUpTreeConstruction(list);
    list = treeGenerator.next().value;    // now our list is converted to TYPE 2
    step2Function(list, null, 0, 0, new Set());
    displayStep2List();

    let intervalId = setInterval(function() {
        const result = treeGenerator.next();
        if (result.done)
            clearInterval(intervalId);

        else {
            clearCanvas();
            list = result.value;        // get node from generator
            if(list.right != null)
                recursiveFunction(list, null, 0, 0, new Set(), false);
            else
                recursiveFunction(list, null, 0, 0, new Set(), true);
            console.log(nodes);
            display();
        }
    }, 1000);
}