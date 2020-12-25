import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter, Route, Switch, Link, Redirect } from 'react-router-dom';

class Square extends React.Component {
    //a method that renders the component
    render() {
        let elementClass;
        if (this.props.isNom) {
            elementClass = "square-nom";
        } else if (this.props.isSnake) {
            elementClass = "square-snake"
        } else {
            elementClass = "square";
        }
        return (
            <button className={elementClass}/>
        );
    }
}

//A “key” is a special string attribute you need to include when creating lists of elements in React. 
//Keys are used in React to identify which items in the list are changed, updated or deleted.
class Board extends React.Component {
    render() {
        const snake = this.props.snake;
        const nom = this.props.nom;
        return (
            <div>
                {[...Array(this.props.height)].map((_, i) =>
                    <div className="board-row" key={i}>
                        {[...Array(this.props.width)].map((_, j) =>
                            <Square key={j} isNom={i === nom.x && j === nom.y}
                                isSnake={snake.some(cell => cell.x === i && cell.y === j)} />
                        )}
                    </div>
                )}
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            score: 0,
            width: 20,
            height: 15,
        }
    }

    render() {
        return <Switch>
            <Route path="/title_screen" render={() => (
                <TitleScreen
                    width={this.state.width}
                    height={this.state.height}
                    onWidthUpdated={(width) => this.setState({ width: width })}
                    onHeightUpdated={(height) => this.setState({ height: height })} />
            )} />
            <Route path="/game_screen" render={() => (
                <GameInProgress score={this.state.score}
                    width={this.state.width}
                    height={this.state.height}
                    onScoreUpdated={(score) => this.setState({ score: score })} 
                    onNewGameStart={() => this.setState({score: 0})}/>
            )} />
            <Route path="/game_over_screen" render={() => (
                <GameOver score={this.state.score}/>
            )} />
            <Route path="/" render={() => (
                <Redirect to='/title_screen'/>
            )} />
        </Switch>
    }
}

class TitleScreen extends React.Component {
    render() {
        return (
            <table>
                <tbody>
                    <tr>
                        <td colSpan="2"><div style={{ textAlign: 'center' }} className="title"> Snake Game </div></td>
                    </tr>
                    <tr>
                        <td colSpan="2"><div style={{ textAlign: 'center' }} className="snake-emoji"> 🐍</div></td>
                    </tr>
                    <tr>
                        <td><label htmlFor="width-select">Width: </label>
                            <select value={this.props.width}
                                onChange={(event) => this.props.onWidthUpdated(parseInt(event.target.value))}
                                name="width" id="width-select">
                                {[...Array(6)].map((_, i) =>
                                    <option value={10 + 5 * i} key={i}> {10 + 5 * i} </option>
                                )};
                        </select>
                        </td>
                        <td><label htmlFor="height-select"> Height: </label>
                            <select value={this.props.height}
                                onChange={(event) => this.props.onHeightUpdated(parseInt(event.target.value))}
                                name="height" id="height-select">
                                {[...Array(6)].map((_, i) =>
                                    <option value={10 + 5 * i} key={i}> {10 + 5 * i}</option>
                                )};
                        </select>

                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2"><div style={{ textAlign: 'center' }}>
                            <Link to="/game_screen">
                                Start Game </Link></div></td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

class GameInProgress extends React.Component {
    constructor(props) {
        super(props);
        props.onNewGameStart();
        const snake = [
            {
                x: Math.floor(props.height / 2),
                y: Math.floor(props.width / 2 - 1)
            },
            {
                x: Math.floor(props.height / 2),
                y: Math.floor(props.width / 2)
            },
            {
                x: Math.floor(props.height / 2),
                y: Math.floor(props.width / 2 + 1)
            },
        ];
        this.state = {
            snake: snake,
            direction: 'e',
            nom: this.getNom(snake),
            redirect: false
        }
    }

    getNom(snake) {
        let x;
        let y;
        do {
            x = Math.floor(Math.random() * this.props.height);
            y = Math.floor(Math.random() * this.props.width);
        } while (snake.some(cell => cell.x === x && cell.y === y));
        return {
            x: x,
            y: y
        };
    }

    moveSnake = () => {
        const snake = this.state.snake;
        const head = snake[snake.length - 1];
        let newHead;
        switch (this.state.direction) {
            case 'e':
                newHead = {
                    x: head.x,
                    y: head.y + 1
                };
                break;
            case 'n':
                newHead = {
                    x: head.x - 1,
                    y: head.y
                };
                break;
            case 'w':
                newHead = {
                    x: head.x,
                    y: head.y - 1
                };
                break;
            case 's':
                newHead = {
                    x: head.x + 1,
                    y: head.y
                };
                break;
        }
        newHead.x = (newHead.x + this.props.height) % this.props.height;
        newHead.y = (newHead.y + this.props.width) % this.props.width;

        const nom = this.state.nom;

        if (snake.some(cell => cell.x === newHead.x && cell.y === newHead.y)) {
            clearInterval(this.intervalId);
            this.setState({
                redirect: true
            });
        } else if (newHead.x === nom.x && newHead.y === nom.y) {
            const newSnake = snake.concat([newHead]);
            this.setState({
                snake: newSnake,
                nom: this.getNom(newSnake),
            });
            this.props.onScoreUpdated(this.props.score + 100 + (snake.length - 3) * 10);
            this.restartTimer();
        } else {
            this.setState({
                snake: snake.slice(1).concat([newHead])
            });
        }
    }

    componentDidMount() {
        if (this.board) {
            this.board.focus();
        }
        this.startTimer();
    }

    startTimer = () => {
        if (!this.intervalId) {
            const snake = this.state.snake;
            const interval = Math.max((300 * 0.95 ** (snake.length - 3)), 60);
            this.intervalId = setInterval(this.moveSnake, interval);
        }
    }

    stopTimer = () => {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    restartTimer = () => {
        this.stopTimer();
        this.startTimer();
    }

    toggleTimer = () => {
        if (this.intervalId) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }

    componentWillUnmount() {
        this.stopTimer();
    }


    handleKeyPress = (event) => {
        if (event.key === 'ArrowUp' && this.state.direction !== 's') {
            this.setState({
                direction: 'n'
            });
        }
        if (event.key === 'ArrowRight' && this.state.direction !== 'w') {
            this.setState({
                direction: 'e'
            });
        }
        if (event.key === 'ArrowLeft' && this.state.direction !== 'e') {
            this.setState({
                direction: 'w'
            });
        }
        if (event.key === 'ArrowDown' && this.state.direction !== 'n') {
            this.setState({
                direction: 's'
            });
        }

        if (event.key === ' ') {
            this.handleStartStopEvent();
        }
    }

    handleStartStopEvent = () => {
        this.toggleTimer();
        if (this.board) {
            this.board.focus();
        }
        this.forceUpdate();
    }


    render() {
        if (this.state.redirect) {
            this.setState({
                redirect: false
            });
            return <Redirect to='/game_over_screen' />;
        } else {
            return (
                <div className="game">
                    <div className="score"> Score: {this.props.score}</div>
                    <div className="game-board" onKeyDown={this.handleKeyPress} tabIndex="0" ref={board => { this.board = board; }} >
                        <Board snake={this.state.snake} nom={this.state.nom}
                            width={this.props.width}
                            height={this.props.height} />
                    </div>
                    <button onClick={this.handleStartStopEvent}>
                        {this.intervalId ? 'Pause' : 'Start'}
                    </button>
                </div>
            );
        }
    }
}

//jsx, adds XML syntax to JavaScript.
class GameOver extends React.Component {
    render() {
        return (
            <table>
                <tbody>
                    <tr>
                        <td><div style={{ textAlign: 'center', fontSize: '20px' }}> Game over </div></td>
                    </tr>
                    <tr>
                        <td><div className="game-over-emoji">💀</div></td>
                    </tr>
                    <tr><td>
                        <div className="score" style={{ textAlign: 'center' }}> Your score is {this.props.score}</div></td>
                    </tr>
                    <tr>
                        <td><div style={{ textAlign: 'center' }}>
                            <Link to="/title_screen">Start again</Link>
                        </div></td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

// ========================================

ReactDOM.render(
    <BrowserRouter>
        <Game />
    </BrowserRouter>,
    document.getElementById('root')
);
