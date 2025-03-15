import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { MeshComponent } from '../components/MeshComponent';
import { TransformComponent } from '../components/TransformComponent';
import { CameraComponent } from '../components/CameraComponent';
import { ModelComponent } from '../components/ModelComponent';
import * as THREE from 'three';

export class RenderSystem extends System {
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private cameraEntity: Entity | null = null;

    constructor() {
        super();
        // Create scene
        this.scene = new THREE.Scene();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.cameraEntity) {
                const camera = this.cameraEntity.getComponent(CameraComponent);
                if (camera) {
                    camera.camera.aspect = window.innerWidth / window.innerHeight;
                    camera.camera.updateProjectionMatrix();
                }
            }
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(TransformComponent) && 
               (entity.hasComponent(MeshComponent) || entity.hasComponent(ModelComponent));
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public setCameraEntity(entity: Entity): void {
        this.cameraEntity = entity;
    }

    public update(deltaTime: number): void {
        // If no camera, don't render
        if (!this.cameraEntity) return;
        
        const cameraComponent = this.cameraEntity.getComponent(CameraComponent);
        if (!cameraComponent) return;

        // Update all entities' meshes based on their transform
        for (const entity of this.entities) {
            const transform = entity.getComponent(TransformComponent);
            const mesh = entity.getComponent(MeshComponent);
            const model = entity.getComponent(ModelComponent);

            if (transform) {
                if (mesh) {
                    mesh.mesh.position.copy(transform.position);
                    mesh.mesh.rotation.copy(transform.rotation);
                    mesh.mesh.scale.copy(transform.scale);

                    // Add mesh to scene if not already
                    if (!mesh.mesh.parent) {
                        this.scene.add(mesh.mesh);
                    }
                }

                if (model) {
                    model.model.position.copy(transform.position);
                    model.model.rotation.copy(transform.rotation);
                    model.model.scale.copy(transform.scale);

                    // Add model to scene if not already
                    if (!model.model.parent) {
                        this.scene.add(model.model);
                    }

                    // Update animations
                    model.update(deltaTime);
                }
            }
        }

        // Render the scene
        this.renderer.render(this.scene, cameraComponent.camera);
    }
} 