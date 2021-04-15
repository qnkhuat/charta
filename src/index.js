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
  return context.measureText(text).width;
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
    this.state = {
      x: props.x,
      y: props.y,
      value: '',
      rows: 1,
      width: 1,
      height: 0,
      element: null,
    };
  }


  handleChange(e){
    const text = e.target.value;
    const lines = text.split("\n");
    const longest_line = lines.reduce((a, b) => a.length > b.length ? a : b, '');
    const textWidth = getTextWidth(longest_line);
    this.setState({
      value: text,
      rows: lines.length,
      width: textWidth, // in px
    });
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
      width: this.state.width > 0 ? this.state.width : 30 + 'px',
      background: 'transparent',
    }

    return (
      <textarea style={style} autoFocus 
        ref={(element) => {this.element = element }}
        rows={this.state.rows}
        className="textarea-purge"
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

  render() {
    const intro = <h3 className="center absolute z-50 text-center text-gray-500 font-bold text-xl animate-pulse">This is a paper just like your paper<br></br>Click anywhere and type!</h3>;
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
        {divs.length === 0 && intro}
        <div id="paper" className="absolute w-full h-full top-0 left-0">
          <div id="menu" className='z-50 absolute'>
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

          
          <div id="sketch" 
            className={`${this.getZIndex('sketch')} bg-green-200`}>
            <SketchField width='1024px'
              height='768px'
              tool={Tools.Pencil}
              lineColor='black'
              lineWidth={3}/>
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































