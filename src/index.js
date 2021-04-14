import './index.css'
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'

class TextArea extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      x: props.x,
      y: props.y,
      value: '',
      rows: 3,
      cols: 30,

    };

  }

  handleChange(e){
    const text = e.target.value;
    const lines = text.split("\n");
    const max_len = lines.reduce((a, b) => a.length > b.length ? a : b, '').length;


    this.setState({
      value: text,
      rows: lines.length > 3 ? lines.length : 3,
      cols: max_len > 30 ? max_len : 30
    });
  }

  render(){
    const style = {
      position: 'absolute',
      left: this.state.x + 'px',
      top: this.state.y + 'px',
      background:'transparent'
    }
    return (
      <textarea style={style} autoFocus 
        rows={this.state.rows}
        cols={this.state.cols}
        onChange={this.handleChange.bind(this)}/>  
    )

  }
}

class Paper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      color: "bg-white",
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
    const newdivs = [];
    console.log(divs);
    for (const div in divs){
      console.log(div);
    }
    divs.push(this.createTextArea(x, y));
    this.setState({divs:divs});
  }

  render() {
    const divs = this.state.divs;
    return (
      <div 
        className={`w-full h-full absolute top-0 left-0 ${this.state.color}`}
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

