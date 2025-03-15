import { Component } from '../core/Component';

export class PlayerComponent extends Component {
    public moveSpeed: number;
    public turnSpeed: number;
    public isUsingKeyboardControl: boolean = false;
    public isMoving: boolean = false;

    constructor(moveSpeed: number = 2, turnSpeed: number = 8) {
        super();
        this.moveSpeed = moveSpeed;
        this.turnSpeed = turnSpeed;
    }
} 