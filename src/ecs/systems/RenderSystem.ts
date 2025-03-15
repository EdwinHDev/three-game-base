import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { MeshComponent } from '../components/MeshComponent';
import * as THREE from 'three';

export class RenderSystem extends System {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private cameraEntity: Entity | null = null;

    constructor() {
        super();
        // Initialize Three.js scene and renderer
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        
        // Add some ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.cameraEntity) {
                const cameraComponent = this.cameraEntity.getComponent(CameraComponent);
                if (cameraComponent) {
                    cameraComponent.camera.aspect = window.innerWidth / window.innerHeight;
                    cameraComponent.camera.updateProjectionMatrix();
                }
            }
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Method to get the scene for other systems
    public getScene(): THREE.Scene {
        return this.scene;
    }

    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(MeshComponent) && entity.hasComponent(TransformComponent);
    }

    public setCameraEntity(entity: Entity): void {
        if (entity.hasComponent(CameraComponent)) {
            this.cameraEntity = entity;
        }
    }

    public update(deltaTime: number): void {
        // If no camera, don't render
        if (!this.cameraEntity) return;
        
        const cameraComponent = this.cameraEntity.getComponent(CameraComponent);
        if (!cameraComponent) return;

        // Update all entities' meshes based on their transform
        for (const entity of this.entities) {
            const mesh = entity.getComponent(MeshComponent);
            const transform = entity.getComponent(TransformComponent);

            if (mesh && transform) {
                mesh.mesh.position.copy(transform.position);
                mesh.mesh.rotation.copy(transform.rotation);
                mesh.mesh.scale.copy(transform.scale);

                // Add mesh to scene if not already
                if (!mesh.mesh.parent) {
                    this.scene.add(mesh.mesh);
                }
            }
        }

        // Render the scene
        this.renderer.render(this.scene, cameraComponent.camera);
    }
}

// Import CameraComponent here to avoid circular dependency
import { CameraComponent } from '../components/CameraComponent'; 