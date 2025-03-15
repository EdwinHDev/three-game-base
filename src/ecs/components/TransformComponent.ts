import { Component } from '../core/Component';
import * as THREE from 'three';

export class TransformComponent extends Component {
    public position: THREE.Vector3;
    public rotation: THREE.Euler;
    public scale: THREE.Vector3;

    constructor(
        position: THREE.Vector3 = new THREE.Vector3(),
        rotation: THREE.Euler = new THREE.Euler(),
        scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
    ) {
        super();
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }
} 