import { Component } from '../core/Component';
import * as THREE from 'three';

export class MeshComponent extends Component {
    public mesh: THREE.Object3D;

    constructor(mesh: THREE.Object3D) {
        super();
        this.mesh = mesh;
    }
} 