import React, {useState, useRef} from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';
import './index.css'
import {
    ControlledMenu,
    Menu,
    MenuItem,
    MenuButton,
    SubMenu
} from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';

import {SketchField, Tools} from 'react-sketch';

function getTextWidth(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = getComputedStyle(document.body).font;
  const width = context.measureText(text).width;
  return width;
}

function isInBoundingBox(x, y, bx, by, bw, bh){
  if (bx <= x && x <= (bx + bw) && by <= y && y <= (by + bh)){
    return true;
  }
  return false;
}

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

  handleChange(e){
    this.isEditting = true;
    const text = e.target.value;
    const lines = text.split("\n");
    let hasLongerLine = false;
    lines.forEach((line) => {
      const lineWidth = getTextWidth(line);
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
      <textarea style={style} autoFocus 
        className={`textarea-purge focus:border-blue-300`}
        ref={(element) => {this.element = element }}
        rows={this.state.rows}
        onBlur={this.handleOnBlur.bind(this)}
        onChange={this.handleChange.bind(this)}/>  
    )
  }
}

class Paper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      divs: [],
      selectedMode: 'text',
      isDragging: false,
      menuOpen: false,
      intact:true
    };
    this.options = [
      {value: 'text', label: 'Text'},
      {value: 'sketch', label: 'Sketch'},
    ]
    this.options = {
      text: {label: '🖋', enable:true},
      sketch: {label: '🎨', enable:false}
    }
  }


  getZIndex(mode){ return mode == this.state.selectedMode ? 'z-30' : 'z-20';}

  createDiv(x, y){
    const divs = this.state.divs.slice();
    const divRef = React.createRef();
    const div = <TextArea key={`${x},${y}`} x={x} y={y} ref={divRef}/>;
    const newDivs = divs.filter(div => div.ref.current.state.value.length > 0); // Remove non-text div

    newDivs.push({div:div, ref:divRef}); // Add the current one
    this.setState({divs:newDivs});
  }

  handleOnClick(e) {
   if (this.state.intact){
      this.setState({intact:false})
    }

    const x = e.clientX,
      y = e.clientY;
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

  handleMenuClick(e){
    if (this.state.isDragging){
      this.setState({menuOpen: false})
    } else {
      this.setState({menuOpen: !this.state.menuOpen})
    }
  }

  handleModeChange(e) {
    this.setState({
      selectedMode: e.value,
      menuOpen: false,
    })
  }

  handleDrag(){
    this.setState({isDragging:true, menuOpen: false});
  }

  handleStopDrag(){
    setTimeout(() => {
      this.setState({isDragging:false});
    }, 10) // stop is called before menuclick.
  }

  onSketchChange() {
    if (this.state.intact){
      this.setState({intact:false})
    }
  }

  render() {
    const intro = <h3 className="center absolute z-50 text-center text-gray-500 font-bold text-xl animate-pulse">This is a paper just like your paper<br></br>Click anywhere to start scribbling!</h3>;
    const divs = this.state.divs;

    // *** Menu ***
    const menuRef = React.createRef();
    const menuButton = <button 
      className='text-3xl rounded-full w-16 h-16 text-center bg-pink-300 focus:outline-none'
      ref={menuRef} 
      onClick={this.handleMenuClick.bind(this)}
    >{this.options[this.state.selectedMode]['label']}</button>;

    return (
      <div>
        {this.state.intact == true && intro}
        <div id="menu" className='absolute z-50 float-left'>
          <Draggable
            onDrag={this.handleDrag.bind(this)}
            onStop={this.handleStopDrag.bind(this)}
            defaultPosition={{x:window.innerWidth-100, y:window.innerHeight-100}}
          >
            <div>
              {menuButton}
              <ControlledMenu
                className='bg-transparent shadow-none min-w-0 text-center'
                anchorRef={menuRef}
                direction='top'
                isOpen={this.state.menuOpen}
                onClick={this.handleModeChange.bind(this)}
              >
                {this.options.length !== 0 && Object.keys(this.options).map((key, index) =>
                <MenuItem value={key} key={key} 
                  className="p-0 rounded-full bg-pink-300 mt-2 hover:bg-blue-300 h-16">
                  <p className="w-16 text-3xl inline-block text-center">{this.options[key]['label']}</p>
                </MenuItem>
                )}
              </ControlledMenu>
            </div>
          </Draggable>
        </div>

        <div id="paper" className="absolute w-screen h-screen overflow-scroll top-0 left-0">
          <div 
            id="texts"
            className={`bg-transparent ${this.getZIndex('text')} w-x2 h-x2 absolute`}
            onClick={this.handleOnClick.bind(this)}
          >
            {divs.length !== 0 && divs.map((div)=> div.div)}
          </div>
          <div id="sketch" 
            className={`${this.getZIndex('sketch')} bg-transparent  w-x2 h-x2 absolute`}>
            <SketchField width='200vw'
              height='200vh'
              tool={Tools.Pencil}
              lineColor='black'
              lineWidth={3}
              onChange={this.onSketchChange.bind(this)}
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
      <div id="wrapper">
        <Paper/>
      </div>
    )
  }
}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);































