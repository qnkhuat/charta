import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'


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
    };
  }

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

  render() {
    const intro = <h3 className="center absolute z-10 text-center text-gray-500 font-bold text-xl animate-pulse">This is a paper just like your paper<br></br>Click anywhere and type!</h3>;
    const divs = this.state.divs;
    return (
      <div 
        className={`w-full h-full absolute top-0 left-0 bg-white`}
        onClick={this.handleOnClick.bind(this)}
      >
        {divs.length === 0 && intro}
        <div id="texts">{divs.length !== 0 && divs.map((div)=> div.div)}</div>
      </div>
    )
  }
}

class App extends React.Component {
  render(){
    return (
      <div id="wrapper ">
        <Paper/>
      </div>
    )
  }
}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);

