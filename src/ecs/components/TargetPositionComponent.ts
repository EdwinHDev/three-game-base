import { Component } from '../core/Component';
import * as THREE from 'three';

export enum MovementState {
    IDLE,
    ROTATING,
    MOVING
}

export class TargetPositionComponent extends Component {
    public targetPosition: THREE.Vector3;
    public movementState: MovementState;
    public reachedThreshold: number; // Distancia mínima para considerar que se ha llegado al objetivo
    public targetRotation: number; // Ángulo de rotación objetivo (en radianes)
    public rotationThreshold: number; // Umbral para considerar que la rotación ha sido completada

    constructor(
        targetPosition: THREE.Vector3 = new THREE.Vector3(), 
        reachedThreshold: number = 0.5,
        rotationThreshold: number = 0.05 // ~3 grados
    ) {
        super();
        this.targetPosition = targetPosition;
        this.movementState = MovementState.IDLE;
        this.reachedThreshold = reachedThreshold;
        this.targetRotation = 0;
        this.rotationThreshold = rotationThreshold;
    }
} 