import { Component } from '../core/Component';
import * as THREE from 'three';

export class CameraComponent extends Component {
    public camera: THREE.PerspectiveCamera;

    constructor(
        fov: number = 75,
        aspect: number = window.innerWidth / window.innerHeight,
        near: number = 0.1,
        far: number = 1000
    ) {
        super();
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        
        // Actualizamos la cámara cuando cambia el tamaño de la ventana
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
    }
} 