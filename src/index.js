import React from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';
import {SketchField, Tools} from 'react-sketch';
import {
  ControlledMenu,
  MenuItem,
} from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import './index.css'


const TEXTS_ID= 'texts';


// ****** Utilities ******
function capitalize(str) {
  const lower = str.toLowerCase();
  return str.charAt(0).toUpperCase() + lower.slice(1);
}

function getTextWidth(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = getComputedStyle(document.body).font;
  const width = context.measureText(text).width;
  return width;
}

function next(db, key){ // next key of the dict
  const keyList = Object.keys(db);
  var keyIndex = keyList.indexOf(key);
  if (keyIndex === -1) return;
  return keyIndex < (keyList.length - 1) ? keyList[keyIndex + 1] : keyList[0];
}

function prev(db, key){ // prev key of the dict
  const keyList = Object.keys(db);
  var keyIndex = keyList.indexOf(key);
  if (keyIndex === -1) return;
  return keyIndex === 0 ? keyList[keyList.length - 1] : keyList[keyIndex-1];
}

function isInBoundingBox(x, y, bx, by, bw, bh){
  if (bx <= x && x <= (bx + bw) && by <= y && y <= (by + bh)){
    return true;
  }
  return false;
}

// ****** Main Components ******
class TextArea extends React.Component{
  // Maybe construct into multiple p lines rather than one single Textarea
  constructor(props){
    super(props);
    this.maxWidthLine = 1; // Default width of a text while editing
    this.isEditting = true;
    this.state = {
      x: props.x,
      y: props.y,
      value: '',
      rows: 1,
      width: this.maxWidthLine,
      height: 0,
      element: null,
    };
  }
  
  handleOnBlur(e){
    const text = e.target.value;
    const lines = text.split("\n");
    this.setState({
      value:text,
      rows: lines.length,
    });
    this.isEditting = false;
  }

  handleOnChange(e){
    this.isEditting = true;
    const text = e.target.value;
    const lines = text.split("\n");
    let hasLongerLine = false;
    lines.forEach((line) => {
      const lineWidth = getTextWidth(line) + 10; // + 10 make it doesn't break on safari
      if (lineWidth > this.maxWidthLine){
        this.maxWidthLine = lineWidth;
        hasLongerLine = true; 
      }
    })
    if (hasLongerLine || lines.length > this.state.rows){
      this.setState({
        value: text,
        rows: lines.length,
        width: this.maxWidthLine, // in px
      });
    }
  }

  componentDidUpdate(previousProps, previousState){  
    // TODO : is there a better way to do this without ref?
    const height = this.element.getBoundingClientRect().height;
    if (height !== this.state.height){ // Prevent infinite update
      this.setState({height:height})
    }
  }

  focus(){
    this.element.focus();
  }

  handleOnStopDrag(e){
    this.setState({
      x:e.offsetLeft,
      y:e.offsetTop,
    })
  }


  render(){
    const style = {
      position: 'absolute',
      left: this.state.x + 'px',
      top: this.state.y + 'px',
      width: this.state.width > 30 ? this.state.width : 30 + 'px',
      background: 'transparent',
      overflow: 'hidden',
    }

    return (
      <Draggable
        onStop={this.handleOnStopDrag.bind(this)}
      >
        <textarea style={style} autoFocus 
          className={`textarea-purge focus:border-blue-300`}
          ref={(element) => {this.element = element }}
          rows={this.state.rows}
          onBlur={this.handleOnBlur.bind(this)}
          onChange={this.handleOnChange.bind(this)}/>  

      </Draggable>
    )
  }
}

class Paper extends React.Component {
  constructor(props) {
    super(props);
    this.isDragging = false;
    this.paperRef = null;
    this.menuTimeoutId = null; // keep track of timeout to close menu
    this.notiTimeoutId= null; // keep track of timeout to close menu
    this.state = {
      divs: [],
      selectedMode: 'text',
      menuOpen: false,
      intact:true,
      tool:Tools.Pencil,
      toolLineWidth:3,
      toolColor:"black",
      noti:""
    };
    this.options = {
      selector: {label: '🤚', tool:Tools.Select, lineWidth:5, color:'black'},
      square: {label: '🟥', tool:Tools.Rectangle, lineWidth:5, color:'black'},
      circle: {label: '⭕️', tool:Tools.Circle, lineWidth:5, color:'black'},
      line: {label: '📏', tool:Tools.Line, lineWidth:5, color:'black'},
      eraser: {label: '🧽', tool:Tools.Pencil, lineWidth:60, color:'white'},
      pencil: {label: '✏️', tool:Tools.Pencil, lineWidth:5, color:'black'},
      text: {label: '🔤', tool:null, lineWidth: null, color:null},
    }
  }

  componentDidMount(){
    window.addEventListener("keydown", this.handleOnKeyDown.bind(this));
  }

  getZIndex(mode){ return mode === this.state.selectedMode ? 'z-30' : 'z-20';}

  createDiv(x, y){
    const divs = this.state.divs.slice();
    const divRef = React.createRef();
    const div = <TextArea key={`${x},${y}`} x={x} y={y} ref={divRef}/>;
    const newDivs = divs.filter(div => div.ref.current.state.value.length > 0); // Remove non-text div

    newDivs.push({div:div, ref:divRef}); // Add the current one
    this.setState({divs:newDivs});
  }

  handleOnClick(e) {
    if (e.target.id !== TEXTS_ID) return;
    
    if (this.state.intact){
      this.setState({intact:false})
    }

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top - 10; // a lil - 10 doesn't kill nobody
    const divs = this.state.divs.slice();
    const overlappedDivs = divs.filter(div => isInBoundingBox(x, y, 
      div.ref.current.state.x, div.ref.current.state.y, 
      div.ref.current.state.width, div.ref.current.state.height)
    )
    if (overlappedDivs.length > 0){
      // No create, focus on the existed on instead
      overlappedDivs[0].ref.current.focus();
    } else {
      this.createDiv(x, y);
    }
  }

  setMode(mode){
    const option = this.options[mode];
    this.setState({
      selectedMode: mode,
      tool: option.tool,
      toolColor: option.color,
      toolLineWidth: option.lineWidth,
    })
    this.setNoti(capitalize(mode));
  }

  setNoti(message){
    this.setState({
      noti:message,
    });
    if (this.notiTimeoutId !== null) clearTimeout(this.notiTimeoutId);
    this.notiTimeoutId = setTimeout(() => {
      this.setState({noti:""});
    }, 1000);
  }

  handleModeChange(e) {
    this.setMode(e.value);
    this.setState({menuOpen:false});
  }
  
  handleOnMouseOver(){ // for phone only
    this.setState({menuOpen:true});
  }

  handleOnMouseLeave(){
    this.setState({menuOpen:false});
  }

  handleOnSketchChange() {
    if (this.state.intact){
      this.setState({intact:false})
    }
  }

  handleOnKeyDown(e){
    if (e.metaKey || e.ctrlKey) {
      var hit = false;
      if (e.key === 'z') {
        hit = true;
        e.preventDefault();
        this.setMode(prev(this.options, this.state.selectedMode));
      }
      if (e.key === 'x') {
        hit = true;
        this.setMode(next(this.options, this.state.selectedMode));
      }
      if(!hit) return; // exit if not any desiable key is pressed
      
      if (!this.state.menuOpen) this.setState({menuOpen:true});
      if (this.menuTimeoutId != null) clearTimeout(this.menuTimeoutId);
      this.menuTimeoutId = setTimeout(() => {
        if (this.state.menuOpen) this.setState({menuOpen:false});
      }, 1000);
    }
  }

  render() {
    const intro = <h3 className="w-full center absolute z-10 text-center text-gray-500 font-bold text-xl animate-pulse">This is a paper just like your real paper.<br></br>Click anywhere to start scribbling 🎨<br></br><br></br> Press cmd/ctrl + z/x to change tool.</h3>;
    const noti = <h3 className="center top-1/4 absolute z-10 text-center text-red-400 font-bold text-3xl">{this.state.noti}</h3>;
    const divs = this.state.divs;

    // *** Menu ***
    const menuRef = React.createRef();

    return (
      <div id="wrapper" className="cursor-pointer bg-transparent"
        tabIndex="0"
      >
        {this.state.intact === true && intro}
        {noti}
        <div id="menu" className='absolute z-50 bottom-6 right-6'
          onMouseLeave={this.handleOnMouseLeave.bind(this)}
          onMouseOver={this.handleOnMouseOver.bind(this)}
        >
          <div>
            {<button 
              className='text-2xl md:text-3xl rounded-full w-12 md:w-16 h-12 md:h-16 text-center bg-pink-300 focus:outline-none'
              ref={menuRef} 
            >{this.options[this.state.selectedMode]['label']}</button>}
            <ControlledMenu
              className='bg-transparent shadow-none min-w-0 text-center'
              anchorRef={menuRef}
              direction='top'
              isOpen={this.state.menuOpen}
              onClick={this.handleModeChange.bind(this)}
            >
              {this.options.length !== 0 && Object.keys(this.options).map((key, index) =>
              <MenuItem value={key} key={key} 
                className={`p-0 rounded-full mt-2 ${key === this.state.selectedMode ? 'bg-pink-300' : 'bg-green-300 hover:bg-blue-300' } h-12 md:h-16`}>
                <p className="w-12 md:w-16 text-2xl md:text-3xl inline-block text-center">{this.options[key]['label']}</p>
              </MenuItem>
              )}
            </ControlledMenu>
          </div>
        </div>

        <div id="paper" 
          className="absolute w-screen h-screen overflow-scroll top-0 left-0"
        >
          <div 
            id={TEXTS_ID}
            className={`bg-transparent ${this.getZIndex('text')} w-x2 h-x2 absolute`}
            onClick={this.handleOnClick.bind(this)}
          >
            {divs.length !== 0 && divs.map((div)=> div.div)}
          </div>
          <div id="sketch" 
            className={`${this.getZIndex('sketch')} bg-transparent  w-x2 h-x2 absolute`}>
            <SketchField width='200vw'
              height='200vh'
              tool={this.state.tool}
              lineColor={this.state.toolColor}
              lineWidth={this.state.toolLineWidth}
              onChange={this.handleOnSketchChange.bind(this)}
            />
          </div>
        </div>
      </div>
    )
  }
}

class App extends React.Component {
  render(){
    return (
      <Paper/>
    )
  }
}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);































