import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { CameraComponent } from '../components/CameraComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { World } from '../core/World';
import * as THREE from 'three';

export class CameraFollowSystem extends System {
    private readonly CAMERA_HEIGHT = 5;
    private readonly CAMERA_DISTANCE = 10;
    private readonly SMOOTH_FACTOR = 0.1;
    private readonly MIN_DISTANCE = 5;
    private readonly MAX_DISTANCE = 15;
    private readonly MIN_HEIGHT = 2;
    private readonly MAX_HEIGHT = 10;
    private readonly ORBIT_SPEED = 2.0;
    private readonly VERTICAL_SPEED = 1.5;
    private readonly MIN_VERTICAL_ANGLE = 0.1; // Casi horizontal
    private readonly MAX_VERTICAL_ANGLE = Math.PI / 2.5; // Limita el ángulo máximo hacia arriba
    
    private isRightMouseDown: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    private targetAngle: number = Math.PI; // Comenzar detrás del jugador
    private currentAngle: number = Math.PI;
    private targetVerticalAngle: number = Math.PI / 6; // 30 grados inicial
    private currentVerticalAngle: number = Math.PI / 6;
    private world: World;
    
    constructor(world: World) {
        super();
        this.world = world;
        this.setupMouseControls();
    }
    
    private setupMouseControls(): void {
        // Manejar el clic derecho del ratón
        window.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Botón derecho
                this.isRightMouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) { // Botón derecho
                this.isRightMouseDown = false;
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.isRightMouseDown) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                // Rotación horizontal
                this.targetAngle -= deltaX * 0.01 * this.ORBIT_SPEED;
                
                // Rotación vertical (invertida para que se sienta natural)
                this.targetVerticalAngle = Math.max(
                    this.MIN_VERTICAL_ANGLE,
                    Math.min(
                        this.MAX_VERTICAL_ANGLE,
                        this.targetVerticalAngle - deltaY * 0.01 * this.VERTICAL_SPEED
                    )
                );
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        // Prevenir el menú contextual del clic derecho
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
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
        
        // Procesar cada entidad de cámara
        for (const cameraEntity of this.entities) {
            const cameraTransform = cameraEntity.getComponent(TransformComponent);
            const camera = cameraEntity.getComponent(CameraComponent);
            
            if (!cameraTransform || !camera) continue;
            
            // Suavizar la transición de los ángulos
            this.currentAngle += (this.targetAngle - this.currentAngle) * this.SMOOTH_FACTOR;
            this.currentVerticalAngle += (this.targetVerticalAngle - this.currentVerticalAngle) * this.SMOOTH_FACTOR;
            
            // Calcular la posición objetivo de la cámara usando coordenadas esféricas
            const horizontalDistance = this.CAMERA_DISTANCE * Math.cos(this.currentVerticalAngle);
            const height = this.CAMERA_DISTANCE * Math.sin(this.currentVerticalAngle);
            
            const targetPosition = new THREE.Vector3(
                playerTransform.position.x + Math.sin(this.currentAngle) * horizontalDistance,
                playerTransform.position.y + height,
                playerTransform.position.z + Math.cos(this.currentAngle) * horizontalDistance
            );
            
            // Aplicar suavizado al movimiento de la cámara
            cameraTransform.position.lerp(targetPosition, this.SMOOTH_FACTOR);
            
            // Hacer que la cámara mire al jugador
            const lookAtPosition = new THREE.Vector3(
                playerTransform.position.x,
                playerTransform.position.y + 1, // Mirar un poco por encima del jugador
                playerTransform.position.z
            );
            
            // Actualizar la cámara de Three.js
            camera.camera.position.copy(cameraTransform.position);
            camera.camera.lookAt(lookAtPosition);
        }
    }
} 