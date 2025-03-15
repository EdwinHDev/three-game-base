import { System } from '../core/System';
import { Entity } from '../core/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TargetPositionComponent, MovementState } from '../components/TargetPositionComponent';
import * as THREE from 'three';

export class PlayerControlSystem extends System {
    private keyStates: { [key: string]: boolean } = {};
    
    constructor() {
        super();
        // Set up event listeners for keyboard
        window.addEventListener('keydown', (e) => {
            this.keyStates[e.code] = true;
            // Interrupt click-to-move when any movement key is pressed
            if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                this.interruptClickToMove();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keyStates[e.code] = false;
        });
    }

    private interruptClickToMove(): void {
        for (const entity of this.entities) {
            const targetPos = entity.getComponent(TargetPositionComponent);
            if (targetPos) {
                targetPos.movementState = MovementState.IDLE;
            }
            
            // Marcar que estamos usando control por teclado
            const player = entity.getComponent(PlayerComponent);
            if (player) {
                player.isUsingKeyboardControl = true;
            }
        }
    }
    
    protected isEntityCompatible(entity: Entity): boolean {
        return entity.hasComponent(PlayerComponent) && 
               entity.hasComponent(TransformComponent) &&
               entity.hasComponent(TargetPositionComponent);
    }
    
    public update(deltaTime: number): void {
        for (const entity of this.entities) {
            const player = entity.getComponent(PlayerComponent);
            const transform = entity.getComponent(TransformComponent);
            const targetPos = entity.getComponent(TargetPositionComponent);
            
            if (!player || !transform || !targetPos) continue;
            
            // Si hay movimiento por click activo y no estamos usando el teclado, no procesar input
            if (targetPos.movementState !== MovementState.IDLE && !player.isUsingKeyboardControl) {
                continue;
            }
            
            // Movement direction vector
            const moveDirection = new THREE.Vector3(0, 0, 0);
            
            // Forward/backward (Z axis)
            const movingForward = this.keyStates['KeyW'] || this.keyStates['ArrowUp'];
            const movingBackward = this.keyStates['KeyS'] || this.keyStates['ArrowDown'];
            
            if (movingForward) {
                moveDirection.z -= 1; // Forward is -Z (matches our model's front)
            }
            if (movingBackward) {
                moveDirection.z += 1; // Backward is +Z
            }
            
            // Left/right rotation
            const rotatingLeft = this.keyStates['KeyA'] || this.keyStates['ArrowLeft'];
            const rotatingRight = this.keyStates['KeyD'] || this.keyStates['ArrowRight'];
            
            // Apply rotation based on A/D keys
            if (rotatingLeft) {
                transform.rotation.y += player.turnSpeed * deltaTime;
            }
            if (rotatingRight) {
                transform.rotation.y -= player.turnSpeed * deltaTime;
            }
            
            // Actualizar estado de movimiento
            const isMoving = moveDirection.length() > 0;
            player.isMoving = isMoving;
            
            // Si estamos usando alguna tecla de movimiento
            if (isMoving) {
                player.isUsingKeyboardControl = true;
                targetPos.movementState = MovementState.IDLE; // Asegurar que click-to-move está desactivado
                
                // Normalize for consistent speed in all directions
                moveDirection.normalize();
                
                // Apply movement relative to the player's facing direction
                const speed = player.moveSpeed * deltaTime;
                const movement = moveDirection.multiplyScalar(speed);
                
                // Create a quaternion from current rotation
                const quaternion = new THREE.Quaternion();
                quaternion.setFromEuler(transform.rotation);
                
                // Apply rotation to movement vector (to move in facing direction)
                movement.applyQuaternion(quaternion);
                
                // Update position
                transform.position.add(movement);
            } else if (player.isUsingKeyboardControl) {
                // Si no hay movimiento por teclado pero estábamos usando teclado
                player.isMoving = false;
                player.isUsingKeyboardControl = false;
            }
        }
    }
} 