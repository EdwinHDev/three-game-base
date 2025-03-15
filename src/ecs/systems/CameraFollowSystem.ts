import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { CameraComponent } from '../components/CameraComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { World } from '../core/World';
import { UserSettings } from '../../config/UserSettings';
import * as THREE from 'three';

export class CameraFollowSystem extends System {
    private readonly DEFAULT_CAMERA_DISTANCE = 10;
    private readonly MIN_CAMERA_DISTANCE = 5; // Distancia mínima al hacer zoom in
    private readonly MAX_CAMERA_DISTANCE = 20; // Distancia máxima al hacer zoom out
    private readonly ZOOM_SPEED = 0.5; // Velocidad del zoom
    private readonly SMOOTH_FACTOR = 0.1;
    private readonly LOOK_AT_OFFSET = 1.0;
    private readonly MIN_HEIGHT = 0.5; // Altura mínima de la cámara sobre el suelo
    
    private isRightMouseDown: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    private targetTheta: number = Math.PI; // Ángulo horizontal (alrededor del personaje)
    private currentTheta: number = Math.PI;
    private targetPhi: number = Math.PI / 3; // Ángulo vertical (desde arriba)
    private currentPhi: number = Math.PI / 3;
    private targetDistance: number;
    private currentDistance: number;
    private world: World;
    private settings: UserSettings;
    
    constructor(world: World) {
        super();
        this.world = world;
        this.settings = UserSettings.getInstance();
        this.targetDistance = this.DEFAULT_CAMERA_DISTANCE;
        this.currentDistance = this.DEFAULT_CAMERA_DISTANCE;
        this.setupMouseControls();
    }
    
    private setupMouseControls(): void {
        window.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                this.isRightMouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            } else if (e.button === 1) {
                this.resetCamera();
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.isRightMouseDown = false;
            }
        });
        
        window.addEventListener('wheel', (e) => {
            // Aplicar zoom con la rueda del ratón
            const zoomDelta = e.deltaY * this.ZOOM_SPEED * 0.01;
            this.targetDistance = Math.max(
                this.MIN_CAMERA_DISTANCE,
                Math.min(this.MAX_CAMERA_DISTANCE, this.targetDistance + zoomDelta)
            );
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.isRightMouseDown) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                // Rotación horizontal (theta)
                const horizontalFactor = this.settings.invertCameraX ? 1 : -1;
                this.targetTheta += deltaX * 0.01 * this.settings.cameraRotationSpeed * horizontalFactor;
                
                // Rotación vertical (phi)
                const verticalFactor = this.settings.invertCameraY ? -1 : 1;
                const deltaPhi = deltaY * this.settings.cameraRotationSpeed * 0.01 * -verticalFactor;
                
                // Calcular el ángulo mínimo para evitar atravesar el suelo
                // arccos(MIN_HEIGHT / CAMERA_DISTANCE) nos da el ángulo máximo desde arriba
                const minPhi = Math.PI / 6; // Límite superior (30 grados desde arriba)
                const maxPhi = Math.PI - Math.acos(this.MIN_HEIGHT / this.currentDistance);
                
                this.targetPhi = Math.max(minPhi, Math.min(maxPhi, this.targetPhi + deltaPhi));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        window.addEventListener('auxclick', (e) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        });
    }
    
    private resetCamera(): void {
        this.targetTheta = Math.PI;
        this.targetPhi = Math.PI / 3; // 60 grados desde arriba, una buena vista por defecto
        this.targetDistance = this.DEFAULT_CAMERA_DISTANCE;
    }
    
    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(CameraComponent) && entity.hasComponent(TransformComponent);
    }
    
    private findPlayerEntity(entities: Entity[]): Entity | null {
        for (const entity of entities) {
            if (entity.hasComponent(PlayerComponent) && entity.hasComponent(TransformComponent)) {
                return entity;
            }
        }
        return null;
    }
    
    public update(deltaTime: number): void {
        const playerEntity = this.findPlayerEntity(this.world.getEntities());
        if (!playerEntity) return;
        
        const playerTransform = playerEntity.getComponent(TransformComponent);
        if (!playerTransform) return;
        
        for (const cameraEntity of this.entities) {
            const cameraTransform = cameraEntity.getComponent(TransformComponent);
            const camera = cameraEntity.getComponent(CameraComponent);
            
            if (!cameraTransform || !camera) continue;
            
            // Suavizar la transición de los ángulos y la distancia
            this.currentTheta += (this.targetTheta - this.currentTheta) * this.SMOOTH_FACTOR;
            this.currentPhi += (this.targetPhi - this.currentPhi) * this.SMOOTH_FACTOR;
            this.currentDistance += (this.targetDistance - this.currentDistance) * this.SMOOTH_FACTOR;
            
            // Calcular la posición de la cámara usando coordenadas esféricas
            const targetPosition = new THREE.Vector3(
                playerTransform.position.x + this.currentDistance * Math.sin(this.currentPhi) * Math.sin(this.currentTheta),
                playerTransform.position.y + this.currentDistance * Math.cos(this.currentPhi),
                playerTransform.position.z + this.currentDistance * Math.sin(this.currentPhi) * Math.cos(this.currentTheta)
            );
            
            // Aplicar suavizado al movimiento de la cámara
            cameraTransform.position.lerp(targetPosition, this.SMOOTH_FACTOR);
            
            // Hacer que la cámara mire al jugador
            const lookAtPosition = new THREE.Vector3(
                playerTransform.position.x,
                playerTransform.position.y + this.LOOK_AT_OFFSET,
                playerTransform.position.z
            );
            
            // Actualizar la cámara de Three.js
            camera.camera.position.copy(cameraTransform.position);
            camera.camera.lookAt(lookAtPosition);
        }
    }
} 