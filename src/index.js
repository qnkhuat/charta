import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'


function getTextWidth(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = getComputedStyle(document.body).font;
  return context.measureText(text).width;
}

class TextArea extends React.Component{
  // Maybe construct into multiple p lines rather than one single Textarea
  constructor(props){
    super(props);
    this.state = {
      x: props.x,
      y: props.y,
      value: ' ',
      rows: 1,
      longest_line: '',
    };
  }

  handleChange(e){
    const text = e.target.value;
    const lines = text.split("\n");
    const longest_line = lines.reduce((a, b) => a.length > b.length ? a : b, '');

    this.setState({
      value: text,
      rows: lines.length,
      longest_line: longest_line,
    });
  }

  render(){
    const textWidth = getTextWidth(this.state.longest_line);
    const style = {
      position: 'absolute',
      left: this.state.x + 'px',
      top: this.state.y + 'px',
      width: textWidth > 0 ? textWidth : 30 + 'px',
      background:'transparent',
    }

    return (
      <textarea style={style} autoFocus 
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
      x: 0,
      y: 0,
    };
  }
  
  createTextArea(x, y){
    return (
        <TextArea key={`${x},${y}`} x={x} y={y}/>  
    )
  }

  createDiv(e) {
    const x = e.clientX,
      y = e.clientY;
    const divs = this.state.divs.slice();
    divs.push(this.createTextArea(x, y));
    this.setState({divs:divs});
  }

  render() {
    const divs = this.state.divs;
    return (
      <div 
        className={`w-full h-full absolute top-0 left-0 bg-white`}
        onClick={this.createDiv.bind(this)}
      >
        <div>
          {divs.length !== 0 && divs.map((div)=> div)}
        </div>
      </div>
    )
  }
}

class App extends React.Component {
  render(){
    const intro = <h3 className="center absolute z-10 text-center text-gray-400 text-xl">This is a paper just like your paper<br></br>Click anywhere and type!</h3>;
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

