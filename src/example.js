import './index.css'
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'
import TextareaAutosize from 'react-textarea-autosize'

function Square(props){
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  )
}

function calculateWinner(squares){
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6], 
  ];
  for (let i = 0; i < lines.length; i++){
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares [a];
    }
  }
  return null;
}

class Board extends React.Component {
  renderSquare(i) {
    return <Square 
      value={this.props.squares[i]} 
      onClick={() => this.props.onClick(i)}
    />;
  }

  render(){
    return (
      <div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [{
        squares: Array(9).fill(null),
      }],
      xIsNext: true,
      stepNumber: 0,
    }
  }

  handleClick(i){
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      xIsNext: !this.state.xIsNext,
      stepNumber: history.length
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step%2) === 0,
    })
  }


  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move : 'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}> {desc}</button>
        </li>
      );
    });


    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }

    return (
      <div className="game">
        <div className="game-board">
          <Board 
            squares={current.squares}
            onClick={(i)=> this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
        <textarea>
          Hey you can fill anything here if you want too
        </textarea>
      </div>
    );
  }
}


class TextArea extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      x: props.x,
      y: props.y,
    };

  }

  render(){
    const style = {
      position: 'absolute',
      left: this.state.x + 'px',
      top: this.state.y + 'px',
      background:'transparent'
    }
    return (
      <textarea style={style} autoFocus/>  
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
  _onMouseMove(e) {
    this.setState({ x: e.clientX, y: e.clientY});
    console.log(e.clientX, e.clientY);
  }

  createTextArea(x, y){
    return (
        <TextArea x={x} y={y} />  
    )
  }

  createDiv(e) {
    const x = e.clientX,
      y = e.clientY;
    const divs = this.state.divs.slice();
    //divs = divs.filter(div)
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

